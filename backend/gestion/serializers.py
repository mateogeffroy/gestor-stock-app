from decimal import Decimal
from rest_framework import serializers
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from .models import Producto, Caja, Venta, VentaDetalle, TipoVenta

# Serializer simple para TipoVenta
class TipoVentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoVenta
        fields = '__all__'

class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'

class CajaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Caja
        fields = '__all__'

class VentaDetalleSerializer(serializers.ModelSerializer):
    producto = ProductoSerializer(read_only=True)
    id_producto = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.all(), source='producto', write_only=True
    )

    class Meta:
        model = VentaDetalle
        # Mapeamos los campos del nuevo modelo
        fields = ['id', 'producto', 'id_producto', 'cantidad', 'precio_unitario', 'descuento_individual', 'subtotal']

class VentaSerializer(serializers.ModelSerializer):
    detalles = VentaDetalleSerializer(many=True)
    # Ahora tipo_venta espera un ID de la tabla TipoVenta, no un string 'factura_b'
    id_tipo_venta = serializers.PrimaryKeyRelatedField(
        queryset=TipoVenta.objects.all(), source='tipo_venta', write_only=True
    )
    # Para mostrar el objeto completo al leer
    tipo_venta_detalle = TipoVentaSerializer(source='tipo_venta', read_only=True)

    class Meta:
        model = Venta
        fields = [
            'id', 'total', 'fecha', 'hora', 'caja', 
            'id_tipo_venta', 'tipo_venta_detalle', 'estado', 
            'descuento_general', 'redondeo', 'detalles'
        ]
        read_only_fields = ['id', 'total', 'fecha', 'hora', 'estado']

    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        descuento_general = validated_data.get('descuento_general', 0)
        
        # Asignamos fecha y hora actuales automáticamente si no vienen
        now = timezone.now()
        validated_data['fecha'] = now.date()
        validated_data['hora'] = now.time()

        warnings = []

        with transaction.atomic():
            # Creamos la venta con total 0 inicial
            venta = Venta.objects.create(total=0, **validated_data)
            total_venta_final = 0.0 # Usamos float porque el modelo UML pide float

            for detalle_data in detalles_data:
                producto_instancia = detalle_data['producto']
                cantidad_vendida = detalle_data['cantidad']
                precio_unitario = float(detalle_data['precio_unitario'])
                descuento_individual = float(detalle_data.get('descuento_individual', 0))

                # Lógica de cálculo
                subtotal_sin_descuento = precio_unitario * cantidad_vendida
                descuento_total_linea = descuento_individual + float(descuento_general)
                
                # Cálculo matemático seguro
                factor_descuento = 1 - (descuento_total_linea / 100)
                subtotal_final_linea = subtotal_sin_descuento * factor_descuento
                
                total_venta_final += subtotal_final_linea

                # Actualización de Stock (Lógica original conservada)
                producto_a_actualizar = Producto.objects.select_for_update().get(pk=producto_instancia.id)
                if producto_a_actualizar.stock < cantidad_vendida:
                    warnings.append(f"Stock insuficiente para '{producto_a_actualizar.nombre}'.")
                
                producto_a_actualizar.stock = F('stock') - cantidad_vendida
                producto_a_actualizar.save()

                # Ignoramos si viene subtotal del front, lo calculamos nosotros
                detalle_data.pop('subtotal', None)

                VentaDetalle.objects.create(
                    venta=venta,
                    subtotal=subtotal_final_linea,
                    **detalle_data
                )
            
            # Actualizamos el total de la venta
            venta.total = total_venta_final
            venta.save()
        
        # Preparamos la respuesta
        data = self.to_representation(venta)
        data['warnings'] = warnings
        return data