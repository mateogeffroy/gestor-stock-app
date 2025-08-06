from decimal import Decimal
from rest_framework import serializers
from django.db import transaction
from django.db.models import F
from .models import Producto, Caja, Venta, VentaDetalle

# ... (otros Serializers sin cambios) ...
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
        fields = ['id', 'producto', 'id_producto', 'cantidad', 'precio_unitario', 'descuento_individual', 'subtotal']

class VentaSerializer(serializers.ModelSerializer):
    detalles = VentaDetalleSerializer(many=True)

    class Meta:
        model = Venta
        fields = ['id', 'importe_total', 'fecha_y_hora', 'caja', 'tipo', 'estado', 'descuento_general', 'redondeo', 'detalles']
        read_only_fields = ['id', 'importe_total', 'fecha_y_hora', 'estado', 'caja']

    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        descuento_general = validated_data.get('descuento_general', 0)
        warnings = []

        with transaction.atomic():
            venta = Venta.objects.create(importe_total=0, **validated_data)
            total_venta_final = Decimal('0.0')

            for detalle_data in detalles_data:
                producto_instancia = detalle_data['producto']
                cantidad_vendida = detalle_data['cantidad']
                precio_unitario = detalle_data['precio_unitario']
                descuento_individual = detalle_data.get('descuento_individual', 0)

                subtotal_sin_descuento = precio_unitario * cantidad_vendida
                descuento_total_linea = float(descuento_individual) + float(descuento_general)
                factor_descuento = Decimal(1 - (descuento_total_linea / 100))
                subtotal_final_linea = subtotal_sin_descuento * factor_descuento
                total_venta_final += subtotal_final_linea

                producto_a_actualizar = Producto.objects.select_for_update().get(pk=producto_instancia.id)
                if producto_a_actualizar.stock < cantidad_vendida:
                    warnings.append(f"Stock insuficiente para '{producto_a_actualizar.nombre}'. Quedó en {producto_a_actualizar.stock - cantidad_vendida}.")
                
                producto_a_actualizar.stock = F('stock') - cantidad_vendida
                producto_a_actualizar.save()
                
                # --- INICIO DEL CAMBIO ---
                # Removemos el subtotal del frontend para evitar el conflicto
                detalle_data.pop('subtotal', None)
                # --- FIN DEL CAMBIO ---

                VentaDetalle.objects.create(
                    venta=venta,
                    subtotal=subtotal_final_linea,
                    **detalle_data
                )
            
            venta.importe_total = total_venta_final
            venta.save()
        
        data = self.to_representation(venta)
        data['warnings'] = warnings
        return data

    def update(self, instance, validated_data):
        # ... (método update sin cambios) ...
        detalles_data = validated_data.pop('detalles')
        descuento_general = validated_data.get('descuento_general', instance.descuento_general)
        warnings = []

        with transaction.atomic():
            for detalle_existente in instance.detalles.all():
                if detalle_existente.producto:
                    Producto.objects.filter(pk=detalle_existente.producto.id).update(stock=F('stock') + detalle_existente.cantidad)
            instance.detalles.all().delete()

            instance.tipo = validated_data.get('tipo', instance.tipo)
            instance.descuento_general = descuento_general
            total_venta_final = Decimal('0.0')

            for detalle_data in detalles_data:
                producto_instancia = detalle_data['producto']
                cantidad_vendida = detalle_data['cantidad']
                precio_unitario = detalle_data['precio_unitario']
                descuento_individual = detalle_data.get('descuento_individual', 0)
                
                producto_a_actualizar = Producto.objects.select_for_update().get(pk=producto_instancia.id)

                if producto_a_actualizar.stock < cantidad_vendida:
                    warnings.append(f"Stock insuficiente para '{producto_a_actualizar.nombre}'.")

                producto_a_actualizar.stock = F('stock') - cantidad_vendida
                producto_a_actualizar.save()
                
                subtotal_sin_descuento = precio_unitario * cantidad_vendida
                descuento_total_linea = float(descuento_individual) + float(descuento_general)
                factor_descuento = Decimal(1 - (descuento_total_linea / 100))
                subtotal_final_linea = subtotal_sin_descuento * factor_descuento
                total_venta_final += subtotal_final_linea
                
                detalle_data.pop('subtotal', None)
                VentaDetalle.objects.create(
                    venta=instance,
                    subtotal=subtotal_final_linea,
                    **detalle_data
                )

            instance.importe_total = total_venta_final
            instance.save()
        
        data = self.to_representation(instance)
        data['warnings'] = warnings
        return data