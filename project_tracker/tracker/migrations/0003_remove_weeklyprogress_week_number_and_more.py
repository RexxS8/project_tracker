# Generated by Django 5.2 on 2025-06-24 05:29

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tracker', '0002_weeklyprogress_documents'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='weeklyprogress',
            name='week_number',
        ),
        migrations.AddField(
            model_name='weeklyprogress',
            name='week_end_date',
            field=models.DateField(default=datetime.date.today),
        ),
        migrations.AddField(
            model_name='weeklyprogress',
            name='week_start_date',
            field=models.DateField(default=datetime.date.today),
        ),
    ]
