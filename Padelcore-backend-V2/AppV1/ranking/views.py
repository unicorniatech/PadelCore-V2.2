# ranking/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import RankingRecord
from .serializers import RankingRecordSerializer

class RankingRecordViewSet(viewsets.ModelViewSet):
    queryset = RankingRecord.objects.all()
    serializer_class = RankingRecordSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        date_filter = self.request.query_params.get('date')
        if date_filter:
            qs = qs.filter(date=date_filter)
        return qs
