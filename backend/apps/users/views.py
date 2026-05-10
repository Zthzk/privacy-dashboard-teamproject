from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Return information about the currently authenticated user."""
    return Response({
        "id": request.user.id,
        "username": request.user.username,
        "email": request.user.email,
    })
