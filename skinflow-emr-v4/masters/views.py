from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.decorators import method_decorator
from rest_framework.decorators import action
from rest_framework.response import Response
import requests
from django.conf import settings

from .models import ProcedureCategory, ProcedureType, ProcedureRoom, MedicineMaster, LabTestMaster
from .serializers import (
    ProcedureCategorySerializer, ProcedureTypeSerializer, ProcedureRoomSerializer,
    MedicineMasterSerializer, LabTestMasterSerializer
)
from core.api_auth import get_current_org
from core.permissions import HasRolePermission
from patients.views import StandardResultsSetPagination

# A base viewset for all masters to apply common logic
class MasterBaseViewSet(viewsets.ModelViewSet):
    permission_classes = [HasRolePermission]
    permission_module = 'clinical'
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        org = get_current_org(self.request)
        return self.queryset.filter(organization=org)

    def perform_create(self, serializer):
        org = get_current_org(self.request)
        serializer.save(organization=org)

class ProcedureCategoryViewSet(MasterBaseViewSet):
    queryset = ProcedureCategory.objects.all()
    serializer_class = ProcedureCategorySerializer

class ProcedureTypeViewSet(MasterBaseViewSet):
    queryset = ProcedureType.objects.all()
    serializer_class = ProcedureTypeSerializer

class ProcedureRoomViewSet(MasterBaseViewSet):
    queryset = ProcedureRoom.objects.all()
    serializer_class = ProcedureRoomSerializer

class MedicineMasterViewSet(MasterBaseViewSet):
    queryset = MedicineMaster.objects.all()
    serializer_class = MedicineMasterSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['generic_name', 'brand_name']

    @action(detail=False, methods=['get'], url_path='pharmaseed-search')
    def pharmaseed_search(self, request):
        query = request.query_params.get('search', '')
        if not query:
            return Response([])

        api_key = getattr(settings, 'PHARMASEED_API_KEY', '')
        if not api_key:
            return Response({"error": "PHARMASEED_API_KEY not configured"}, status=500)

        url = "https://pharmaseed.p.rapidapi.com/medicines/search"
        querystring = {"query": query}
        headers = {
            "x-rapidapi-key": api_key,
            "x-rapidapi-host": "pharmaseed.p.rapidapi.com"
        }
        
        try:
            response = requests.get(url, headers=headers, params=querystring, timeout=10)
            if response.status_code == 200:
                results = response.json()
                return Response(results)
            return Response({"error": f"Upstream API error: {response.status_code}"}, status=response.status_code)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
class LabTestMasterViewSet(MasterBaseViewSet):
    queryset = LabTestMaster.objects.all()
    serializer_class = LabTestMasterSerializer
