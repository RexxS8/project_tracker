from rest_framework import serializers
from .models import Project, WeeklyProgress

class WeeklyProgressSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all(), required=False)
    submitted_task_percent = serializers.SerializerMethodField()
    approved_task_percent = serializers.SerializerMethodField()

    class Meta:
        model = WeeklyProgress
        fields = [
            'id', 'project', 'project_name', 'week_number', 'task_description',
            'target_completion', 'submitted_task', 'revised',
            'approved_task_by_comments', 'approved_task',
            'submitted_task_percent', 'approved_task_percent', 'created_at'
        ]

    def get_submitted_task_percent(self, obj):
        return obj.submitted_task_percent

    def get_approved_task_percent(self, obj):
        return obj.approved_task_percent

    def create(self, validated_data):
        project = self.context.get('project')
        if not project:
            project = validated_data.pop('project', None)
        return WeeklyProgress.objects.create(project=project, **validated_data)

class ProjectSerializer(serializers.ModelSerializer):
    weekly_progress = WeeklyProgressSerializer(many=True, read_only=True)
    man_power = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ['id', 'name', 'start_date', 'end_date', 'status', 'priority', 'progress', 'weekly_progress', 'man_power']

    def get_man_power(self, obj):
        return [mp.name for mp in obj.man_power.all()]
