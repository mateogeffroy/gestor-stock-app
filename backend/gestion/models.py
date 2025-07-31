from django.db import models

class Producto(models.Model):
    nombre = models.CharField(max_length=255)
    stock = models.IntegerField(default=0)
    precio_lista = models.DecimalField(max_digits=10, decimal_places=2)
    utilidad_porcentual = models.DecimalField(max_digits=5, decimal_places=2)
    precio_final = models.DecimalField(max_digits=10, decimal_places=2)
    codigo_barras = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre

class Caja(models.Model):
    total_recaudado = models.DecimalField(max_digits=12, decimal_places=2)
    fecha_y_hora_cierre = models.DateTimeField()

    def __str__(self):
        return f"Caja cerrada el {self.fecha_y_hora_cierre.strftime('%d/%m/%Y %H:%M')}"
    
class Venta(models.Model):
    class TipoVenta(models.TextChoices):
        ORDEN_COMPRA = 'orden_compra', 'Orden de Compra'
        FACTURA_B = 'factura_b', 'Factura B'

    importe_total = models.DecimalField(max_digits=12, decimal_places=2)
    fecha_y_hora = models.DateTimeField(auto_now_add=True)
    caja = models.ForeignKey(Caja, on_delete=models.SET_NULL, null=True, blank=True)
    tipo = models.CharField(max_length=20, choices=TipoVenta.choices, default=TipoVenta.ORDEN_COMPRA)
    estado = models.CharField(max_length=50, default='completada')
    descuento_general = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    redondeo = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    def __str__(self):
        return f"Venta #{self.id} del {self.fecha_y_hora.strftime('%d/%m/%Y')}"
    
class VentaDetalle(models.Model):
    venta = models.ForeignKey(Venta, related_name='detalles', on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, on_delete=models.SET_NULL, null=True)
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    # --- CAMBIO CLAVE: Agregamos el campo para el descuento individual ---
    descuento_individual = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Detalle de Venta #{self.venta.id} - Producto: {self.producto.nombre if self.producto else 'N/A'}"