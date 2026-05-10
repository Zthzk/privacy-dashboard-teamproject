from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def project_list(request):
    return Response({
        "message": "Project list is only visible for authenticated users"
    })
   
@api_view(["GET"])
def health_check(request):
    return Response({
        "message": "Privacy Dashboard backend is running"
    })
