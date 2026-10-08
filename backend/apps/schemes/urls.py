from django.urls import path
from .views import (
    SchemeListView,
    SchemeDetailView,
    SavedSchemeListView,
    SavedSchemeDetailView,
    ToggleSaveSchemeView,
    SchemeCompareView
)
from .admin_views import (
    AdminSchemeCreateView,
    AdminSchemeListView,
    AdminNotificationListView
)

urlpatterns = [
    path('', SchemeListView.as_view(), name='scheme_list'),
    path('saved/', SavedSchemeListView.as_view(), name='saved_schemes_list'),
    path('saved/<int:pk>/', SavedSchemeDetailView.as_view(), name='saved_scheme_detail'),
    path('compare/', SchemeCompareView.as_view(), name='scheme_compare'),

    # Admin endpoints
    path('admin/create/', AdminSchemeCreateView.as_view(), name='admin_scheme_create'),
    path('admin/list/', AdminSchemeListView.as_view(), name='admin_scheme_list'),
    path('admin/notifications/', AdminNotificationListView.as_view(), name='admin_notifications'),

    path('<str:scheme_id>/', SchemeDetailView.as_view(), name='scheme_detail'),
    path('<str:scheme_id>/save/', ToggleSaveSchemeView.as_view(), name='toggle_save_scheme'),
]
