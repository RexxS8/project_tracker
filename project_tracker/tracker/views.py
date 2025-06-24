from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import ProjectSerializer, WeeklyProgressSerializer, MeetingWeekSerializer, MinutesOfMeetingSerializer
from datetime import datetime, timedelta
from django.db.models import Q
from django.contrib.auth.decorators import login_required
from django.utils import timezone
import json
from django.core.serializers.json import DjangoJSONEncoder
from .models import Project, WeeklyProgress, MeetingWeek, MinutesOfMeeting
import logging
import os
from django.conf import settings
from rest_framework import generics
from django.http import Http404

# Buat logger
logger = logging.getLogger(__name__)

@login_required(login_url='/login/')
def dashboard_view(request):
    projects = Project.objects.all()

    total_projects = projects.count()
    in_progress = projects.filter(status='In Progress').count()
    completed = projects.filter(status='Completed').count()

    overdue = projects.filter(
        Q(status='Not Started') | Q(status='In Progress'),
        end_date__lt=timezone.now()
    ).exclude(status='Completed').count()

    status_counts = {
        'Not Started': projects.filter(status='Not Started').count(),
        'In Progress': projects.filter(status='In Progress').count(),
        'Completed': projects.filter(status='Completed').count(),
    }

    progress_data = [
        {
            'name': project.name,
            'progress': project.progress
        }
        for project in projects
    ]

    # Data untuk FullCalendar
    project_events = [
    {
        "title": p.name,
        "start": p.start_date.strftime("%Y-%m-%d"),
        "end": (p.end_date + timedelta(days=1)).strftime("%Y-%m-%d"),  # Tambah 1 hari agar inclusive
        "color": "#3182CE"
    }
    for p in projects
]

    context = {
        'total_projects': total_projects,
        'in_progress': in_progress,
        'completed': completed,
        'overdue': overdue,
        'status_counts': json.dumps(status_counts),
        'progress_data': json.dumps(progress_data),
        'projects': json.dumps(project_events, cls=DjangoJSONEncoder)  # ← ini dikirim ke template
    }

    return render(request, 'tracker/index.html', context)

def login_view(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')

        user = authenticate(request, username=email, password=password)

        if user is not None:
            login(request, user)
            return redirect('index')
        else:
            messages.error(request, 'Invalid email or password.')

    return render(request, 'tracker/login.html')

@login_required(login_url='/login/')
def projects_view(request):
    # Ambil semua project dari database
    projects = Project.objects.all()

    # Kirim data project dan man power ke template
    context = {
        'projects': projects
    }

    return render(request, 'tracker/projects.html', context)

class ProjectAPI(APIView):
    permission_classes = [IsAuthenticated]
    
    # GET untuk list semua project atau detail satu project
    def get(self, request, pk=None):
        if pk:
            # Gunakan select_related dan prefetch_related untuk optimasi query
            project = get_object_or_404(Project.objects.prefetch_related('weekly_progress', 'meeting_weeks__meetings'), pk=pk)
            serializer = ProjectSerializer(project)
            return Response(serializer.data)
        else:
            projects = Project.objects.prefetch_related('weekly_progress').all()
            serializer = ProjectSerializer(projects, many=True)
            return Response(serializer.data)

    # POST untuk create project
    def post(self, request):
        serializer = ProjectSerializer(data=request.data)
        if serializer.is_valid():
            project = serializer.save()
            # Tambahkan man power
            man_power_list = request.data.get('man_power', [])
            if isinstance(man_power_list, list):
                project.man_power = ", ".join(man_power_list)
                project.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # PUT untuk update project
    def put(self, request, pk):
        project = get_object_or_404(Project, pk=pk)
        serializer = ProjectSerializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # DELETE untuk hapus project
    def delete(self, request, pk):
        project = get_object_or_404(Project, pk=pk)
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class WeeklyProgressAPI(APIView):
    permission_classes = [IsAuthenticated]
     # GET untuk list weekly progress dari project tertentu
    def get(self, request, project_id):
        """
        Mengambil daftar weekly progress dari suatu project.
        """
        project = get_object_or_404(Project, pk=project_id)
        weekly_progress = project.weekly_progress.all()
        serializer = WeeklyProgressSerializer(weekly_progress, many=True)
        return Response(serializer.data)
    # POST untuk menambahkan weekly progress ke project tertentu
    def post(self, request, project_id):
        try:
            # Pastikan data dalam format JSON
            if isinstance(request.data, str):
                data = json.loads(request.data)
            else:
                data = request.data
                
            project = get_object_or_404(Project, pk=project_id)
            serializer = WeeklyProgressSerializer(
                data=data,
                context={'project': project}
            )
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.exception("Error in WeeklyProgressAPI")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class WeeklyProgressDetailAPI(APIView):
    """
    API View untuk mengelola satu objek WeeklyProgress (GET, PUT, DELETE).
    """
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        """Fungsi helper untuk mendapatkan objek atau 404."""
        try:
            return WeeklyProgress.objects.get(pk=pk)
        except WeeklyProgress.DoesNotExist:
            raise Http404

    def get(self, request, pk, format=None):
        """Mendapatkan detail satu weekly progress."""
        progress = self.get_object(pk)
        serializer = WeeklyProgressSerializer(progress)
        return Response(serializer.data)

    def put(self, request, pk, format=None):
        """Memperbarui satu weekly progress."""
        progress = self.get_object(pk)
        serializer = WeeklyProgressSerializer(progress, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, format=None):
        """Menghapus satu weekly progress."""
        progress = self.get_object(pk)
        progress.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@login_required
def mom_view(request):
    return render(request, 'tracker/mom.html')

# Create API views for MeetingWeek and MinutesOfMeeting
class MeetingWeekAPI(generics.ListCreateAPIView):
    serializer_class = MeetingWeekSerializer
    permission_classes = [AllowAny] # Sesuaikan jika perlu

    def get_queryset(self):
        """
        Secara dinamis memfilter queryset berdasarkan project_id dari URL.
        """
        project_id = self.kwargs.get('project_id')
        return MeetingWeek.objects.filter(project_id=project_id)

    def perform_create(self, serializer):
        """
        Secara otomatis menyuntikkan objek Project ke dalam serializer saat menyimpan.
        Ini adalah perbaikan utama untuk error "Project context is missing".
        """
        project = get_object_or_404(Project, pk=self.kwargs.get('project_id'))
        serializer.save(project=project)

# Create API views for MeetingWeek and MinutesOfMeeting
class MeetingWeekDetailAPI(APIView):
    permission_classes = [IsAuthenticated]
    
    def put(self, request, week_id):
        week = get_object_or_404(MeetingWeek, pk=week_id)
        serializer = MeetingWeekSerializer(
            week, 
            data=request.data, 
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, week_id):
        week = get_object_or_404(MeetingWeek, pk=week_id)
        week.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class MinutesOfMeetingAPI(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, week_id):
        moms = MinutesOfMeeting.objects.filter(week_id=week_id)
        serializer = MinutesOfMeetingSerializer(moms, many=True)
        return Response(serializer.data)
    
    def post(self, request, week_id):
        week = get_object_or_404(MeetingWeek, pk=week_id)
        
        # Tambahkan week_id ke data
        data = request.data.copy()
        data['week'] = week_id
        
        serializer = MinutesOfMeetingSerializer(data=data)
        if serializer.is_valid():
            serializer.save(week=week)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MinutesOfMeetingDetailAPI(APIView):
    permission_classes = [IsAuthenticated]
    
    def put(self, request, mom_id):
        mom = get_object_or_404(MinutesOfMeeting, pk=mom_id)
        serializer = MinutesOfMeetingSerializer(mom, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, mom_id):
        mom = get_object_or_404(MinutesOfMeeting, pk=mom_id)
        mom.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class GenericFileUploadAPI(APIView):
    """
    API generik untuk menangani unggahan berkas.
    Jenis unggahan ('moms' atau 'weekly_progress') ditentukan dari URL.
    Ini akan membuat folder 'weekly_progress' secara otomatis jika belum ada.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, upload_type):
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        # Validasi tipe unggahan untuk keamanan, hanya izinkan folder yang telah ditentukan
        if upload_type not in ['moms', 'weekly_progress']:
            return Response({'error': 'Invalid upload type specified'}, status=status.HTTP_400_BAD_REQUEST)

        # Buat direktori berdasarkan tipe unggahan jika belum ada
        media_dir = os.path.join(settings.MEDIA_ROOT, upload_type)
        os.makedirs(media_dir, exist_ok=True)

        file_path = os.path.join(media_dir, uploaded_file.name)

        # Penanganan sederhana untuk konflik nama berkas (menambahkan timestamp)
        if os.path.exists(file_path):
            name, ext = os.path.splitext(uploaded_file.name)
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            new_name = f"{name}_{timestamp}{ext}"
            file_path = os.path.join(media_dir, new_name)
            uploaded_file.name = new_name # Penting: update nama berkas untuk respons

        with open(file_path, 'wb+') as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)

        # Kembalikan metadata berkas agar bisa digunakan oleh frontend
        file_info = {
            'name': uploaded_file.name,
            'size': uploaded_file.size,
            'file': f'{settings.MEDIA_URL}{upload_type}/{uploaded_file.name}'
        }

        return Response(file_info, status=status.HTTP_201_CREATED)
