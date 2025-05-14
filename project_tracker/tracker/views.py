from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login
from django.contrib import messages
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Project
from .serializers import ProjectSerializer
from datetime import datetime, timedelta
from django.db.models import Q
from django.contrib.auth.decorators import login_required
from django.utils import timezone
import json
from django.core.serializers.json import DjangoJSONEncoder

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

    # Kirim data project ke template
    context = {
        'projects': projects
    }

    return render(request, 'tracker/projects.html', context)

class ProjectAPI(APIView):
    permission_classes = [IsAuthenticated]
    # GET untuk list semua project atau detail satu project
    def get(self, request, pk=None):
        if pk:
            project = get_object_or_404(Project, pk=pk)
            serializer = ProjectSerializer(project)
            return Response(serializer.data)
        else:
            projects = Project.objects.all()
            serializer = ProjectSerializer(projects, many=True)
            return Response(serializer.data)

    # POST untuk create project
    def post(self, request):
        serializer = ProjectSerializer(data=request.data)
        if serializer.is_valid():
            project = serializer.save()
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

    def get(self, request, project_id):
        weekly_progress = WeeklyProgress.objects.filter(project_id=project_id)
        serializer = WeeklyProgressSerializer(weekly_progress, many=True)
        return Response(serializer.data)

    def post(self, request, project_id):
        serializer = WeeklyProgressSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project_id=project_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)