# ranking/management/commands/generate_daily_ranking.py

from django.core.management.base import BaseCommand
from django.utils import timezone
import datetime

from usuarios.models import Usuario
from ranking.models import RankingRecord

class Command(BaseCommand):
    help = "Genera un ranking diario para la fecha actual (o fecha dada)."

    def add_arguments(self, parser):
        # Argumento opcional para fecha, formato YYYY-MM-DD
        parser.add_argument('--date', type=str, help='Fecha del ranking, formato YYYY-MM-DD')

    def handle(self, *args, **options):
        # 1) Obtener fecha. Si no se pasa --date, usamos hoy.
        date_str = options['date']
        if date_str:
            ranking_date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
        else:
            ranking_date = timezone.localdate()  # La fecha de hoy en zona local

        # 2) Obtener todos los usuarios con rating > 0, ordenados desc
        usuarios = Usuario.objects.filter(rating_inicial__gt=0).order_by('-rating_inicial')

        # 3) Recorremos y creamos RankingRecord
        position = 1
        for u in usuarios:
            RankingRecord.objects.create(
                user=u,
                date=ranking_date,
                rating_snapshot=u.rating_inicial,  # guardamos su rating actual
                position=position,
            )
            position += 1

        self.stdout.write(self.style.SUCCESS(
            f"Ranking diario para {ranking_date} generado. {position - 1} usuarios con rating > 0."
        ))
