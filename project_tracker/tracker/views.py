from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib import messages

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