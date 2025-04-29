from rest_framework import serializers
from .models import Project

class ProjectSerializer(serializers.ModelSerializer):
    start = serializers.DateField(source='start_date')
    end = serializers.DateField(source='end_date')
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'start_date', 'end_date',
            'status', 'priority', 'progress'
        ]