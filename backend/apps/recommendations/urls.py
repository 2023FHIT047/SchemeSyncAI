from django.urls import path
from .views import PersonalizedRecommendationsView

urlpatterns = [
    path('personalized/', PersonalizedRecommendationsView.as_view(), name='personalized_recommendations'),
]
