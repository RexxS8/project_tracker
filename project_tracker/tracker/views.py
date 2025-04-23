from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib import messages
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Project
from .serializers import ProjectSerializer

def dashboard_view(request):
    # Anda bisa menambahkan konteks atau logika lain sesuai kebutuhan
    return render(request, 'tracker/index.html')  # Pastikan file 'index.html' ada

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
    def get(self, request):
        projects = Project.objects.all()
        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data)

    def post(self, request):
        # Simpan project
        project_data = {
            "name": request.data.get("name"),
            "start_date": request.data.get("start_date"),
            "end_date": request.data.get("end_date"),  # sesuai dengan yang dikirim dari JS
            "status": request.data.get("status"),
            "priority": request.data.get("priority"),
            "progress": request.data.get("progress"),
        }
        project_serializer = ProjectSerializer(data=project_data)
        if project_serializer.is_valid():
            project = project_serializer.save()

            # Simpan task jika ada
            tasks_data = request.data.get("tasks", [])
            for task_data in tasks_data:
                task_data["project"] = project.id
                task_serializer = TaskSerializer(data=task_data)
                if task_serializer.is_valid():
                    task_serializer.save()
                else:
                    return Response(task_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            return Response(ProjectSerializer(project).data, status=status.HTTP_201_CREATED)
        return Response(project_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        try:
            project = Project.objects.get(id=request.data.get('id'))
        except Project.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProjectSerializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)