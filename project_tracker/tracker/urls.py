from django.urls import path
from . import views
from .views import ProjectAPI, WeeklyProgressAPI, WeeklyProgressDetailAPI
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('', views.login_view, name='login'),  # root URL = login
    path('logout/', auth_views.LogoutView.as_view(next_page='login'), name='logout'),  # logout
    path('index/', views.dashboard_view, name='index'),  # dashboard
    path('projects/', views.projects_view, name='projects'),  # project list
    path('mom/', views.mom_view, name='mom_view'), # minutes of meeting view
    # API Endpoints
    path('api/projects/', ProjectAPI.as_view(), name='project-list'),  # GET all, POST new
    path('api/projects/<int:pk>/', ProjectAPI.as_view(), name='project-detail'),  # GET, PUT, DELETE by ID
    path('api/projects/<int:project_id>/weekly-progress/', WeeklyProgressAPI.as_view(), name='weekly-progress'), # GET, POST by Project
    path('api/weekly-progress/<int:pk>/', WeeklyProgressDetailAPI.as_view(), name='weekly-progress-detail'), # GET, PUT, DELETE weekly progress by ID
    path('api/projects/<int:project_id>/meeting-weeks/', views.MeetingWeekAPI.as_view(), name='meeting-week-list'), # GET, POST meeting weeks for a project
    path('api/meeting-weeks/<int:week_id>/', views.MeetingWeekDetailAPI.as_view(), name='meeting-week-detail'), # GET, PUT, DELETE meeting week by ID
    path('api/moms/<int:mom_id>/', views.MinutesOfMeetingDetailAPI.as_view(), name='mom-detail'), # GET, PUT, DELETE minutes of meeting by ID
    path('api/meeting-weeks/<int:week_id>/moms/', views.MinutesOfMeetingAPI.as_view(), name='mom-list-by-week'), # GET, POST minutes of meeting for a specific week
    path('api/upload/', views.FileUploadAPI.as_view(), name='file-upload'), # File upload endpoint
]
