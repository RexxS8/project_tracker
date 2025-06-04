from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from .models import CustomUser, Project, WeeklyProgress

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('email', 'first_name', 'last_name', 'is_active', 'is_staff')
    list_filter = ('is_active', 'is_staff', 'is_superuser')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}), 
        (_('Personal info'), {'fields': ('first_name', 'last_name')}), 
        (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}), 
        (_('Important dates'), {'fields': ('last_login',)}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email', 'first_name', 'last_name', 'password1', 'password2',
                'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'
            ),
        }),
    )

class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'display_man_power')
    search_fields = ('name', 'man_power')

    def display_man_power(self, obj):
        if obj.man_power:
            if isinstance(obj.man_power, list):
                man_power_str = ", ".join(obj.man_power)
            else:
                man_power_str = obj.man_power
        else:
            man_power_str = "No man power assigned"
    
        return format_html(
            '<div class="man-power-info bg-blue-50 p-3 rounded-lg mb-4"><strong>Man Power:</strong> {}</div>',
            man_power_str
        )
    display_man_power.short_description = 'Man Power'
    display_man_power.admin_order_field = 'man_power'


class WeeklyProgressAdmin(admin.ModelAdmin):
    list_display = ('project', 'week_number', 'submitted_task', 'approved_task', 'created_at')
    list_filter = ('week_number',)
    search_fields = ('project__name',)

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Project, ProjectAdmin)
admin.site.register(WeeklyProgress, WeeklyProgressAdmin)
