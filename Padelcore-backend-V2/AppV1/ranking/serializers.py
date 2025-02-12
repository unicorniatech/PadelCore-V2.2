from rest_framework import serializers
from .models import RankingRecord

class RankingRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = RankingRecord
        fields = '__all__'
