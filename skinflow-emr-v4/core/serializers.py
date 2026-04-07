from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Organization, Provider, ClinicSettings, BookingSettings, Role, ClinicStaff

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = '__all__'
        read_only_fields = ['kiosk_token']

class ProviderSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = Provider
        fields = '__all__'

class ClinicSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClinicSettings
        fields = '__all__'

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'permissions', 'organization', 'created_at']
        read_only_fields = ['organization', 'created_at']

class BookingSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingSettings
        fields = '__all__'
        read_only_fields = ['organization']

class ClinicStaffSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    role_name = serializers.CharField(source='role.name', read_only=True)

    class Meta:
        model = ClinicStaff
        fields = ['id', 'user', 'user_details', 'role', 'role_name', 'organization', 'is_active', 'created_at']
        read_only_fields = ['user', 'organization', 'created_at']
