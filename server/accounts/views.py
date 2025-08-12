from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_str, force_bytes
from django.db.models import Q
from django.conf import settings
from .serializers import (
    UserSerializer, 
    LoginSerializer, 
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action in ['login', 'create', 'forgot_password', 'reset_password_confirm']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        queryset = User.objects.all()
        
        # Filter by role
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search)
            )
        
        return queryset
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        """Custom login endpoint"""
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def logout(self, request):
        """Logout endpoint"""
        try:
            request.user.auth_token.delete()
            return Response({'message': 'Successfully logged out'})
        except:
            return Response({'error': 'Error logging out'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user info"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def doctors(self, request):
        """Get all active doctors"""
        doctors = User.objects.filter(role='doctor', status='active')
        serializer = self.get_serializer(doctors, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def nurses(self, request):
        """Get all active nurses"""
        nurses = User.objects.filter(role='nurse', status='active')
        serializer = self.get_serializer(nurses, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def staff(self, request):
        """Get all staff members"""
        staff = User.objects.exclude(role='admin')
        serializer = self.get_serializer(staff, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get user analytics for admin"""
        if request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        total_users = User.objects.count()
        active_users = User.objects.filter(status='active').count()
        doctors_count = User.objects.filter(role='doctor').count()
        nurses_count = User.objects.filter(role='nurse').count()
        receptionists_count = User.objects.filter(role='receptionist').count()
        
        return Response({
            'total_users': total_users,
            'active_users': active_users,
            'doctors_count': doctors_count,
            'nurses_count': nurses_count,
            'receptionists_count': receptionists_count,
            'inactive_users': total_users - active_users
        })
    
    @action(detail=True, methods=['patch'])
    def activate(self, request, pk=None):
        """Activate user account"""
        if request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        user = self.get_object()
        user.status = 'active'
        user.is_active = True
        user.save()
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def deactivate(self, request, pk=None):
        """Deactivate user account"""
        if request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        user = self.get_object()
        user.status = 'inactive'
        user.is_active = False
        user.save()
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """Reset user password"""
        if request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        user = self.get_object()
        new_password = request.data.get('password', 'hospital123')
        user.set_password(new_password)
        user.save()
        
        return Response({'message': 'Password reset successfully'})

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def forgot_password(self, request):
        """Request password reset"""
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({'error': 'User with this email does not exist.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate reset token
            token = default_token_generator.make_token(user)
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Build reset URL
            reset_url = f"http://localhost:5173/reset-password/{uidb64}/{token}/"
            
            # Send email
            subject = "Password Reset - Hospital Management System"
            message = f"""
            Hello {user.first_name or user.username},
            
            You have requested a password reset for your account.
            
            Please click the following link to reset your password:
            {reset_url}
            
            If you did not request this password reset, please ignore this email.
            
            This link will expire in 24 hours.
            
            Best regards,
            Hospital Management System
            """
            
            import logging
            import requests
            from django.conf import settings
            logger = logging.getLogger(__name__)
            try:
                response = requests.post(
                    'https://api.resend.com/emails',
                    headers={
                        'Authorization': f'Bearer {settings.RESEND_API_KEY}',
                        'Content-Type': 'application/json',
                    },
                    json={
                        'from': settings.DEFAULT_FROM_EMAIL,
                        'to': [email],
                        'subject': subject,
                        'text': message,
                    }
                )
                if response.status_code == 200 or response.status_code == 202:
                    return Response({
                        'message': 'Password reset instructions have been sent to your email'
                    })
                else:
                    logger.error(f"Resend API error: {response.status_code} - {response.text}")
                    return Response(
                        {'error': 'Failed to send email via Resend API.'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            except Exception as e:
                logger.error(f"Exception sending email via Resend API: {str(e)}")
                return Response(
                    {'error': 'Failed to send email. Please try again later.'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def reset_password_confirm(self, request):
        """Confirm password reset"""
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            try:
                uid = force_str(urlsafe_base64_decode(serializer.validated_data['uidb64']))
                user = User.objects.get(pk=uid)
                
                if default_token_generator.check_token(user, serializer.validated_data['token']):
                    user.set_password(serializer.validated_data['new_password'])
                    user.save()
                    return Response({'message': 'Password has been reset successfully'})
                else:
                    return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)
                    
            except (User.DoesNotExist, ValueError, TypeError):
                return Response({'error': 'Invalid reset link'}, status=status.HTTP_400_BAD_REQUEST)
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def reset_password_confirm(self, request):
        """Confirm password reset"""
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            try:
                uid = force_str(urlsafe_base64_decode(serializer.validated_data['uidb64']))
                user = User.objects.get(pk=uid)
                
                if default_token_generator.check_token(user, serializer.validated_data['token']):
                    user.set_password(serializer.validated_data['new_password'])
                    user.save()
                    return Response({'message': 'Password has been reset successfully'})
                else:
                    return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)
                    
            except (User.DoesNotExist, ValueError, TypeError):
                return Response({'error': 'Invalid reset link'}, status=status.HTTP_400_BAD_REQUEST)
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
