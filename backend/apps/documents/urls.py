from django.urls import path
from .views import (
    DocumentListView,
    DocumentScanView,
    MyDocumentListView,
    MyDocumentDeleteView,
    MyDocumentFileView,
    SchemeReadinessView,
)

urlpatterns = [
    path('', DocumentListView.as_view(), name='document_list'),
    path('scan/', DocumentScanView.as_view(), name='document_scan'),
    path('mine/', MyDocumentListView.as_view(), name='my_documents'),
    path('mine/<int:pk>/', MyDocumentDeleteView.as_view(), name='my_document_delete'),
    path('mine/<int:pk>/file/', MyDocumentFileView.as_view(), name='my_document_file'),
    path('readiness/<str:scheme_id>/', SchemeReadinessView.as_view(), name='scheme_readiness'),
]
