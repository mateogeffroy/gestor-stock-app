from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductoViewSet, CajaViewSet, VentaViewSet, VentaDetalleViewSet

router = DefaultRouter()
router.register(r'productos', ProductoViewSet, basename='producto')
router.register(r'cajas', CajaViewSet, basename='caja')
router.register(r'ventas', VentaViewSet, basename='venta')
router.register(r'venta-detalles', VentaDetalleViewSet, basename='ventadetalle')

urlpatterns = [
    path('', include(router.urls)),
]