# backend/gestion/serializers.py

from decimal import Decimal
from rest_framework import serializers
from django.db import transaction
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
        fields = [
            'id', 'importe_total', 'fecha_y_hora', 'caja', 
            'tipo', 'estado', 'descuento_general', 'redondeo', 'detalles'
        ]
        read_only_fields = ['id', 'importe_total', 'fecha_y_hora', 'estado', 'caja']

    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        descuento_general = validated_data.get('descuento_general', 0)
        
        # --- INICIO DEL CAMBIO ---
        # Lista para guardar las advertencias de stock
        warnings = [] 
        # --- FIN DEL CAMBIO ---

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

                # --- INICIO DEL CAMBIO ---
                # Ya no lanzamos un error, solo guardamos una advertencia
                if producto_instancia.stock < cantidad_vendida:
                    warnings.append(f"Stock insuficiente para '{producto_instancia.nombre}'. Quedó en {producto_instancia.stock - cantidad_vendida}.")
                # --- FIN DEL CAMBIO ---
                
                producto_instancia.stock -= cantidad_vendida
                producto_instancia.save()

                VentaDetalle.objects.create(
                    venta=venta,
                    subtotal=subtotal_final_linea,
                    **detalle_data
                )
            
            venta.importe_total = total_venta_final
            venta.save()
        
        # --- INICIO DEL CAMBIO ---
        # Añadimos las advertencias a los datos de la venta que se devuelven al frontend
        # El método to_representation convierte la instancia de la venta a un diccionario JSON
        data = self.to_representation(venta)
        data['warnings'] = warnings
        return data
        # --- FIN DEL CAMBIO ---