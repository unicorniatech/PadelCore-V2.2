# Generated by Django 5.1.4 on 2024-12-28 23:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='usuario',
            name='rating_inicial',
            field=models.DecimalField(decimal_places=2, max_digits=6),
        ),
    ]
