from django.contrib import admin
from django.urls import path, include, reverse_lazy
from django.views.generic import RedirectView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('', RedirectView.as_view(url='/admin/', permanent=False), name='root'),
    path('admin/', admin.site.urls),
    
    # Auth JWT Endpoints
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # App API Endpoints
    path('api/users/', include('apps.users.urls')),
    path('api/schemes/', include('apps.schemes.urls')),
    path('api/eligibility/', include('apps.eligibility.urls')),
    path('api/documents/', include('apps.documents.urls')),
    path('api/chatbot/', include('apps.chatbot.urls')),
    path('api/recommendations/', include('apps.recommendations.urls')),
]
