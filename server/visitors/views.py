from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Visitor
from .serializers import VisitorSerializer

class VisitorViewSet(viewsets.ModelViewSet):
    queryset = Visitor.objects.all()
    serializer_class = VisitorSerializer

    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'])
    def checkout(self, request, pk=None):
        visitor = self.get_object()
        visitor.status = 'checked-out'
        visitor.save()
        serializer = self.get_serializer(visitor)
        return Response(serializer.data, status=status.HTTP_200_OK)
