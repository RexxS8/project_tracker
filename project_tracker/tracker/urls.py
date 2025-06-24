from django.urls import path
from . import views
# Hapus import yang tidak digunakan lagi dan pastikan view yang benar diimpor
from .views import ProjectAPI, WeeklyProgressAPI, WeeklyProgressDetailAPI

from django.contrib.auth import views as auth_views

urlpatterns = [
    # URL untuk otentikasi dan halaman utama
    path('', views.login_view, name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='login'), name='logout'),
    path('index/', views.dashboard_view, name='index'),
    path('projects/', views.projects_view, name='projects'),
    path('mom/', views.mom_view, name='mom_view'),

    # API Endpoints untuk Project
    path('api/projects/', ProjectAPI.as_view(), name='project-list'),
    path('api/projects/<int:pk>/', ProjectAPI.as_view(), name='project-detail'),
    
    # API Endpoints untuk Weekly Progress
    path('api/projects/<int:project_id>/weekly-progress/', WeeklyProgressAPI.as_view(), name='weekly-progress'),
    path('api/weekly-progress/<int:pk>/', WeeklyProgressDetailAPI.as_view(), name='weekly-progress-detail'),
    
    # API Endpoints untuk Minutes of Meeting (MoM)
    path('api/projects/<int:project_id>/meeting-weeks/', views.MeetingWeekAPI.as_view(), name='meeting-week-list'),
    path('api/meeting-weeks/<int:week_id>/', views.MeetingWeekDetailAPI.as_view(), name='meeting-week-detail'),
    path('api/moms/<int:mom_id>/', views.MinutesOfMeetingDetailAPI.as_view(), name='mom-detail'),
    path('api/meeting-weeks/<int:week_id>/moms/', views.MinutesOfMeetingAPI.as_view(), name='mom-list-by-week'),

    # --- PERUBAHAN: URL UNGGAH BERKAS GENERIK ---
    # URL ini menggantikan '/api/upload/' dan '/api/weekly-progress/upload/'
    # 'upload_type' bisa diisi 'moms' atau 'weekly_progress'
    path('api/upload/<str:upload_type>/', views.GenericFileUploadAPI.as_view(), name='generic-file-upload'),
]
