from django.urls import path
from . import views

urlpatterns = [
    path('', views.login_view, name='login'),
    path('index/', views.dashboard_view, name='index'),  # contoh route dashboard
]
