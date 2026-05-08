from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Project
from .serializers import ProjectSerializer

@api_view(["GET", "POST"])
def project_list(request):
    if request.method == "GET":
        projects = Project.objects.all().order_by("-created_at")
        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        serializer = ProjectSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)