from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import MinValueValidator
from django.db import models

# Custom User Manager
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

# Custom User Model
class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return self.email

# Project Model
class Project(models.Model):
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=[
            ('Not Started', 'Not Started'),
            ('In Progress', 'In Progress'),
            ('Completed', 'Completed')
        ]
    )
    priority = models.CharField(
        max_length=10,
        choices=[
            ('Low', 'Low'),
            ('Medium', 'Medium'),
            ('High', 'High')
        ]
    )
    progress = models.PositiveIntegerField(default=0)
    man_power = models.CharField(
        max_length=255,
        blank=True, 
        null=True,
        help_text="List nama orang yang terlibat (pisahkan dengan koma)"
    )
    
    def get_total_moms_count(self):
        """Menghitung total MOMs dari semua meeting week terkait."""
        # Ini adalah cara yang lebih efisien daripada menghitung di frontend
        return MinutesOfMeeting.objects.filter(week__project=self).count()

    def __str__(self):
        return self.name

# Weekly Progress Model
class WeeklyProgress(models.Model):
    project = models.ForeignKey(Project, related_name='weekly_progress', on_delete=models.CASCADE)
    week_number = models.PositiveIntegerField()
    task_description = models.CharField(max_length=255)  # Tambahkan
    target_completion = models.PositiveIntegerField()  # Tambahkan
    submitted_task = models.PositiveIntegerField(default=0)  # Tambahkan
    revised = models.PositiveIntegerField(default=0)  # Tambahkan
    approved_task_by_comments = models.PositiveIntegerField(default=0)  # Tambahkan
    approved_task = models.PositiveIntegerField(default=0)  # Tambahkan
    created_at = models.DateTimeField(auto_now_add=True)

    # Property untuk nilai persentase
    @property
    def submitted_task_percent(self):
        if self.target_completion == 0:
            return 0
        return round((self.submitted_task / self.target_completion) * 100, 2)
    
    @property
    def approved_task_percent(self):
        if self.target_completion == 0:
            return 0
        return round((self.approved_task / self.target_completion) * 100, 2)

    def __str__(self):
        return f"Week {self.week_number} - {self.project.name}"

 # Meeting Week Model   
class MeetingWeek(models.Model):
    project = models.ForeignKey(Project, related_name='meeting_weeks', on_delete=models.CASCADE)
    week_number = models.PositiveIntegerField(validators=[MinValueValidator(1)])  # Tambah validasi
    name = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['project', 'week_number']  # Pastikan week number unik per project

    def __str__(self):
        return f"Week {self.week_number} - {self.project.name}"

# Minutes of Meeting Model
class MinutesOfMeeting(models.Model):
    week = models.ForeignKey(MeetingWeek, related_name='meetings', on_delete=models.CASCADE)
    date = models.DateField()
    pic = models.CharField(max_length=100)  # Person in charge
    status = models.CharField(
        max_length=20,
        choices=[
            ('Open', 'Open'),
            ('In Progress', 'In Progress'),
            ('Closed', 'Closed')
        ],
        default='Open'
    )
    description = models.TextField()
    documents = models.JSONField(default=list, blank=True)  # Store list of document metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"MOM for {self.week} on {self.date}"