# Generated by Django 5.1.4 on 2025-01-28 22:08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0004_usuario_date_joined_usuario_groups_usuario_is_active_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='usuario',
            name='rol',
            field=models.CharField(choices=[('admin', 'Admin'), ('sponsor', 'Sponsor'), ('player', 'Player'), ('usuario', 'Usuario')], default='usuario', max_length=50),
        ),
    ]
