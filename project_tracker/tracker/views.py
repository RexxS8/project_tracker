from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login
from django.contrib import messages
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Project
from .serializers import ProjectSerializer
from datetime import datetime
from django.db.models import Q

def dashboard_view(request):
    # Menghitung jumlah proyek berdasarkan status
    total_projects = Project.objects.count()
    in_progress = Project.objects.filter(status='In Progress').count()
    completed = Project.objects.filter(status='Completed').count()
    
    # Mengambil proyek yang overdue dan belum selesai (statusnya bukan "Completed")
    overdue = Project.objects.filter(
        Q(status='Not Started') | Q(status='In Progress'),  # Status yang belum selesai
        end_date__lt=datetime.today()  # Tanggal selesai lebih kecil dari hari ini
    ).count()

    # Menyiapkan data untuk chart
    projects = Project.objects.all()
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

    context = {
        'total_projects': total_projects,
        'in_progress': in_progress,
        'completed': completed,
        'overdue': overdue,
        'status_counts': status_counts,
        'progress_data': progress_data,
    }

    return render(request, 'tracker/index.html', context)

def login_view(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')

        # Username in Django is "username", bukan "email" by default,
        # jadi pastikan kamu pakai custom user model jika mau login pakai email
        user = authenticate(request, username=email, password=password)

        if user is not None:
            login(request, user)
            return redirect('index')  # ganti dengan nama url dashboard kamu
        else:
            messages.error(request, 'Invalid email or password.')

    return render(request, 'tracker/login.html')

def projects_view(request):
    return render(request, 'tracker/projects.html')

class ProjectAPI(APIView):
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