from django.db import models
from django.utils import timezone

# 1. Tabla TIPOVENTA (Nueva, según UML)
class TipoVenta(models.Model):
    # En el UML se pide "Factura B" y "Orden de compra"
    descripcion = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.descripcion

# 2. Tabla CAJA
class Caja(models.Model):
    fecha = models.DateField(default=timezone.now)
    total = models.FloatField(default=0.0) # UML pide float

    def __str__(self):
        return f"Caja {self.id} - {self.fecha}"

# 3. Tabla PRODUCTO
class Producto(models.Model):
    codigo = models.IntegerField(unique=True) # UML pide int y unique
    nombre = models.CharField(max_length=255) # UML pide char
    porcentaje_utilidad = models.FloatField() # UML pide float
    precio = models.FloatField() # Este sería tu precio de venta
    precio_lista = models.FloatField() # Precio de costo/lista
    stock = models.IntegerField(default=0) # UML pide int

    # Campos extra de tu modelo anterior que NO están en el UML.
    # Los mantengo opcionales o comentados, pero el UML manda.
    # codigo_barras = models.TextField(blank=True, null=True) 

    def __str__(self):
        return self.nombre

# 4. Tabla VENTA
class Venta(models.Model):
    # El UML separa fecha y hora
    fecha = models.DateField(default=timezone.now)
    hora = models.TimeField(auto_now_add=True)
    total = models.FloatField(default=0.0)
    
    # Relaciones del UML
    tipo_venta = models.ForeignKey(TipoVenta, on_delete=models.PROTECT)
    caja = models.ForeignKey(Caja, on_delete=models.PROTECT)

    # --- ADAPTACIÓN DE TUS CAMPOS ANTERIORES ---
    # El UML NO tiene 'estado', 'descuento_general' ni 'redondeo'.
    # Sin embargo, tu serializer los usa. Para que el código compile y funcione
    # "lo mejor posible", suelo recomendar mantenerlos, pero si la consigna es 
    # ESTRICTA UML, deberías borrarlos. Aquí los dejo para que no falle tu lógica.
    
    class EstadoVenta(models.TextChoices):
        PENDIENTE = 'pendiente', 'Pendiente'
        CERRADA = 'cerrada', 'Cerrada'

    estado = models.CharField(
        max_length=20, 
        choices=EstadoVenta.choices, 
        default=EstadoVenta.PENDIENTE
    )
    descuento_general = models.FloatField(default=0.0) 
    redondeo = models.FloatField(default=0.0)

    def __str__(self):
        return f"Venta {self.id} - Total: {self.total}"

# 5. Tabla VENTADETALLE
class VentaDetalle(models.Model):
    cantidad = models.IntegerField()
    subtotal = models.FloatField()
    
    # Relaciones
    venta = models.ForeignKey(Venta, related_name='detalles', on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)

    # Campos auxiliares para tu lógica (descuento individual)
    # No están en el UML, pero necesarios para tu cálculo matemático anterior
    precio_unitario = models.FloatField(default=0.0) 
    descuento_individual = models.FloatField(default=0.0)

    def __str__(self):
        return f"Detalle {self.id} - Venta {self.venta.id}"