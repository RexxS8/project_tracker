from rest_framework import serializers
from .models import Project, WeeklyProgress

class WeeklyProgressSerializer(serializers.ModelSerializer):
    project_id = serializers.IntegerField(write_only=True)  # untuk input
    project_name = serializers.CharField(source="project.name", read_only=True)  # untuk output

    class Meta:
        model = WeeklyProgress
        fields = ['id', 'project_id', 'project_name', 'week_number', 'progress', 'status', 'description', 'created_at']

class ProjectSerializer(serializers.ModelSerializer):
    weekly_progress = WeeklyProgressSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'name', 'start_date', 'end_date', 'status', 'priority', 'progress', 'weekly_progress']
