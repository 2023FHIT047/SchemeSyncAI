from django.urls import path
from .views import RegisterView, ProfileView, UserMeView, ChangePasswordView, ProfileCompletionView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('me/', UserMeView.as_view(), name='auth_me'),
    path('profile/', ProfileView.as_view(), name='auth_profile'),
    path('profile/completion/', ProfileCompletionView.as_view(), name='auth_profile_completion'),
    path('change-password/', ChangePasswordView.as_view(), name='auth_change_password'),
]
