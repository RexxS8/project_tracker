from rest_framework import serializers
from .models import Project, WeeklyProgress

class WeeklyProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeeklyProgress
        fields = ['id', 'week_number', 'progress', 'description', 'status']

class ProjectSerializer(serializers.ModelSerializer):
    weekly_progress = WeeklyProgressSerializer(many=True, read_only=True)
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'start_date', 'end_date',
            'status', 'priority', 'progress', 'weekly_progress'
        ]