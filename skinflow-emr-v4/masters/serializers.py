from rest_framework import serializers
from .models import ProcedureCategory, ProcedureType, ProcedureRoom, MedicineMaster, LabTestMaster

class ProcedureCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcedureCategory
        fields = '__all__'
        read_only_fields = ['organization']

class ProcedureTypeSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    class Meta:
        model = ProcedureType
        fields = '__all__'
        read_only_fields = ['organization']

class ProcedureRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcedureRoom
        fields = '__all__'
        read_only_fields = ['organization']

class MedicineMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicineMaster
        fields = '__all__'
        read_only_fields = ['organization']

class LabTestMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabTestMaster
        fields = '__all__'
        read_only_fields = ['organization']
