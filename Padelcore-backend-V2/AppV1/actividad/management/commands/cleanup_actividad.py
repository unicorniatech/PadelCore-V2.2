from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from actividad.models import ActividadReciente

class Command(BaseCommand):
    help = 'Elimina actividades que tengan más de 2 días de creadas.'

    def handle(self, *args, **options):
        # 1) Calcula la fecha límite (hace 2 días)
        limite = timezone.now() - timedelta(days=2)

        # 2) Filtra las actividades con fecha <= (hace 2 días)
        viejas = ActividadReciente.objects.filter(fecha__lte=limite)
        total = viejas.count()

        # 3) Las elimina
        viejas.delete()

        # 4) Mensaje en consola
        self.stdout.write(self.style.SUCCESS(
            f'Se eliminaron {total} actividades con más de 2 días'
        ))