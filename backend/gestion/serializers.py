# backend/gestion/serializers.py

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
    # --- CAMBIO CLAVE: Eliminamos 'write_only=True' del id_producto ---
    # y lo movemos a su propia definición para que se use al escribir.
    id_producto = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.all(), source='producto'
    )
    # Para la lectura (cuando devolvemos datos), mostramos el objeto producto completo.
    producto_data = ProductoSerializer(source='producto', read_only=True)

    class Meta:
        model = VentaDetalle
        fields = ['id', 'id_producto', 'producto_data', 'cantidad', 'precio_unitario', 'subtotal']


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

        with transaction.atomic():
            subtotal_bruto = sum(item['subtotal'] for item in detalles_data)
            
            if descuento_general > 0:
                # Ojo: Asegurarse que descuento_general sea un número para el cálculo
                importe_final = subtotal_bruto * (1 - (float(descuento_general) / 100))
            else:
                importe_final = subtotal_bruto
            
            validated_data['importe_total'] = importe_final
            
            venta = Venta.objects.create(**validated_data)

            for detalle_data in detalles_data:
                producto_instancia = detalle_data['producto']
                cantidad_vendida = detalle_data['cantidad']
                
                if producto_instancia.stock < cantidad_vendida:
                    raise serializers.ValidationError(
                        f"No hay stock suficiente para '{producto_instancia.nombre}'. Stock disponible: {producto_instancia.stock}"
                    )
                
                producto_instancia.stock -= cantidad_vendida
                producto_instancia.save()

                VentaDetalle.objects.create(venta=venta, **detalle_data)
        
        return venta