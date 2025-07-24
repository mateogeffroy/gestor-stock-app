# gestion/views.py (Versión con acciones personalizadas)

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum, Q, F

# Importamos todos los modelos y serializadores
from .models import Producto, Caja, Venta, VentaDetalle
from .serializers import ProductoSerializer, CajaSerializer, VentaSerializer, VentaDetalleSerializer

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all().order_by('nombre')
    serializer_class = ProductoSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['nombre', 'codigo_barras']

class CajaViewSet(viewsets.ModelViewSet):
    # El queryset principal ahora ordena por fecha de cierre descendente
    queryset = Caja.objects.all().order_by('-fecha_y_hora_cierre')
    serializer_class = CajaSerializer

    @action(detail=False, methods=['get'])
    def resumen_diario(self, request):
        """
        Calcula el total de ventas del día que aún no han sido asignadas a una caja.
        URL: /api/cajas/resumen_diario/
        """
        ventas_sin_caja = Venta.objects.filter(caja__isnull=True)
        
        # Usamos aggregate para sumar los importes filtrando por tipo
        resumen = ventas_sin_caja.aggregate(
            totalOrdenesCompra=Sum('importe_total', filter=Q(tipo='orden_compra')),
            totalFacturasB=Sum('importe_total', filter=Q(tipo='factura_b'))
        )
        
        total_oc = resumen['totalOrdenesCompra'] or 0
        total_fb = resumen['totalFacturasB'] or 0
        
        return Response({
            'totalOrdenesCompra': total_oc,
            'totalFacturasB': total_fb,
            'totalDia': total_oc + total_fb
        })

    @action(detail=False, methods=['post'])
    @transaction.atomic # Asegura que todas las operaciones se completen o ninguna
    def cerrar_caja(self, request):
        """
        Crea una nueva caja con el total de las ventas pendientes y las asocia.
        URL: /api/cajas/cerrar_caja/
        """
        ventas_a_cerrar = Venta.objects.filter(caja__isnull=True)
        
        if not ventas_a_cerrar.exists():
            return Response({'message': 'No hay ventas pendientes para cerrar.'}, status=status.HTTP_400_BAD_REQUEST)

        total_recaudado = ventas_a_cerrar.aggregate(total=Sum('importe_total'))['total'] or 0
        
        nueva_caja = Caja.objects.create(
            total_recaudado=total_recaudado,
            fecha_y_hora_cierre=timezone.now()
        )
        
        ventas_a_cerrar.update(caja=nueva_caja)
        
        serializer = self.get_serializer(nueva_caja)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def ventas(self, request, pk=None):
        """
        Devuelve todas las ventas asociadas a una caja específica.
        URL: /api/cajas/1/ventas/
        """
        caja = self.get_object()
        # Usamos la relación inversa 'venta_set' para obtener las ventas
        ventas = caja.venta_set.all().order_by('fecha_y_hora')
        serializer = VentaSerializer(ventas, many=True)
        return Response(serializer.data)


class VentaViewSet(viewsets.ModelViewSet):
    queryset = Venta.objects.all().order_by('-fecha_y_hora')
    serializer_class = VentaSerializer

class VentaDetalleViewSet(viewsets.ModelViewSet):
    queryset = VentaDetalle.objects.all()
    serializer_class = VentaDetalleSerializer