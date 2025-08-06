from rest_framework import viewsets, filters, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum, Q, F
from .models import Producto, Caja, Venta, VentaDetalle
from .serializers import ProductoSerializer, CajaSerializer, VentaSerializer, VentaDetalleSerializer

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all().order_by('nombre')
    serializer_class = ProductoSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['nombre', 'codigo_barras']

class CajaViewSet(viewsets.ModelViewSet):
    queryset = Caja.objects.all().order_by('-fecha_y_hora_cierre')
    serializer_class = CajaSerializer

    @action(detail=False, methods=['get'])
    def resumen_diario(self, request):
        ventas_sin_caja = Venta.objects.filter(caja__isnull=True, estado=Venta.EstadoVenta.PENDIENTE)
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
    @transaction.atomic
    def cerrar_caja(self, request):
        ventas_a_cerrar = Venta.objects.filter(caja__isnull=True, estado=Venta.EstadoVenta.PENDIENTE)
        if not ventas_a_cerrar.exists():
            return Response({'message': 'No hay ventas pendientes para cerrar.'}, status=status.HTTP_400_BAD_REQUEST)
        total_recaudado = ventas_a_cerrar.aggregate(total=Sum('importe_total'))['total'] or 0
        nueva_caja = Caja.objects.create(
            total_recaudado=total_recaudado,
            fecha_y_hora_cierre=timezone.now()
        )
        ventas_a_cerrar.update(caja=nueva_caja, estado=Venta.EstadoVenta.CERRADA)
        serializer = self.get_serializer(nueva_caja)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def ventas(self, request, pk=None):
        caja = self.get_object()
        ventas = caja.venta_set.all().order_by('fecha_y_hora')
        serializer = VentaSerializer(ventas, many=True)
        return Response(serializer.data)

class VentaViewSet(viewsets.ModelViewSet):
    queryset = Venta.objects.all().order_by('-fecha_y_hora')
    serializer_class = VentaSerializer

    @action(detail=False, methods=['get'])
    def ultimas(self, request):
        ultimas_ventas = Venta.objects.order_by('-fecha_y_hora')[:5]
        serializer = self.get_serializer(ultimas_ventas, many=True)
        return Response(serializer.data)

    def perform_update(self, serializer):
        if serializer.instance.estado == Venta.EstadoVenta.CERRADA:
            raise serializers.ValidationError("No se puede editar una venta que ya está cerrada.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.estado == Venta.EstadoVenta.CERRADA:
            raise serializers.ValidationError("No se puede eliminar una venta que ya está cerrada.")
        with transaction.atomic():
            for detalle in instance.detalles.all():
                producto = detalle.producto
                if producto:
                    producto.stock += detalle.cantidad
                    producto.save()
            instance.delete()

class VentaDetalleViewSet(viewsets.ModelViewSet):
    queryset = VentaDetalle.objects.all()
    serializer_class = VentaDetalleSerializer