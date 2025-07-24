# gestion/serializers.py (Versión Corregida)

from rest_framework import serializers
from .models import Producto, Caja, Venta, VentaDetalle

class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'

class CajaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Caja
        fields = '__all__'

class VentaDetalleSerializer(serializers.ModelSerializer):
    # 👇 CAMBIO 1: Mapeamos 'id_producto' a 'producto'
    # Le decimos a DRF que el campo 'id_producto' que esperamos del frontend
    # corresponde al campo 'producto' de nuestro modelo.
    id_producto = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.all(), source='producto'
    )

    class Meta:
        model = VentaDetalle
        # 👇 CAMBIO 2: Usamos 'id_producto' en la lista de campos.
        fields = ['id', 'id_producto', 'cantidad', 'precio_unitario', 'subtotal']

class VentaSerializer(serializers.ModelSerializer):
    detalles = VentaDetalleSerializer(many=True)

    class Meta:
        model = Venta
        fields = [
            'id', 'importe_total', 'fecha_y_hora', 'caja', 
            'tipo', 'estado', 'descuento_general', 'redondeo', 'detalles'
        ]

    def create(self, validated_data):
        # 👇 CAMBIO 3: Simplificamos el método create
        detalles_data = validated_data.pop('detalles')
        venta = Venta.objects.create(**validated_data)
        
        # Ahora el serializador ya ha convertido 'id_producto' en una instancia de Producto,
        # así que la creación es más directa.
        for detalle_data in detalles_data:
            VentaDetalle.objects.create(venta=venta, **detalle_data)
            
        return venta