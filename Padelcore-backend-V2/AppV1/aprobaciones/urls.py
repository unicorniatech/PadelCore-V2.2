from rest_framework.routers import DefaultRouter
from .views import AprobacionViewSet

router = DefaultRouter()
router.register(r'aprobaciones', AprobacionViewSet, basename='aprobacion')

urlpatterns = router.urls
