from rest_framework import serializers
from .models import Project, WeeklyProgress, MeetingWeek, MinutesOfMeeting

class WeeklyProgressSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all(), required=False)
    submitted_task_percent = serializers.SerializerMethodField()
    approved_task_percent = serializers.SerializerMethodField()
    documents = serializers.JSONField(required=False)

    class Meta:
        model = WeeklyProgress
        # Mengganti week_number dengan week_start_date dan week_end_date
        fields = [
            'id', 'project', 'project_name', 
            'week_start_date', 'week_end_date', # <-- Perubahan
            'task_description', 'target_completion', 'submitted_task', 'revised',
            'approved_task_by_comments', 'approved_task',
            'submitted_task_percent', 'approved_task_percent', 'created_at',
            'documents'
        ]

    def get_submitted_task_percent(self, obj):
        return obj.submitted_task_percent

    def get_approved_task_percent(self, obj):
        return obj.approved_task_percent

    def create(self, validated_data):
        project = self.context.get('project')
        return WeeklyProgress.objects.create(project=project, **validated_data)
    
class MinutesOfMeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = MinutesOfMeeting
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class FileSerializer(serializers.Serializer):
    name = serializers.CharField()
    size = serializers.IntegerField()
    url = serializers.URLField()

class MeetingWeekSerializer(serializers.ModelSerializer):
    meetings = MinutesOfMeetingSerializer(many=True, read_only=True)

    class Meta:
        model = MeetingWeek
        fields = ['id', 'week_number', 'name', 'created_at', 'meetings']

class ProjectSerializer(serializers.ModelSerializer):
    weekly_progress = WeeklyProgressSerializer(many=True, read_only=True)
    man_power_list = serializers.SerializerMethodField()
    meeting_weeks = MeetingWeekSerializer(many=True, read_only=True)
    total_moms_count = serializers.IntegerField(source='get_total_moms_count', read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'start_date', 'end_date', 'status', 'priority',
            'progress', 'weekly_progress', 'man_power', 'man_power_list', 'meeting_weeks', 'total_moms_count'
        ]

    def get_man_power_list(self, obj):
        if obj.man_power:
            # Misal man_power adalah string 'Andri, Budi, Cici'
            return [name.strip() for name in obj.man_power.split(',')]
        return []