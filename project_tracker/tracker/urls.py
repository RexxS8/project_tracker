from django.urls import path
from . import views

urlpatterns = [
    path('', views.login_view, name='login'),  # root URL = login
    path('index/', views.dashboard_view, name='index'),  # dashboard
    path('projects/', views.projects_view, name='projects'),  # project list
    # API Endpoint
    path('api/projects/', views.ProjectAPI.as_view(), name='api-projects'), # GET all, POST new
    path('api/projects/<int:pk>/', views.ProjectAPI.as_view(), name='api-project-detail'),  # PUT, DELETE by id
]
