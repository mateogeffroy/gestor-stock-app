# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class Cajas(models.Model):
    total_recaudado = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_y_hora_cierre = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'cajas'


class Producto(models.Model):
    nombre = models.CharField(max_length=255)
    stock = models.IntegerField()
    precio_lista = models.DecimalField(max_digits=10, decimal_places=2)
    utilidad_porcentual = models.DecimalField(max_digits=5, decimal_places=2)
    precio_final = models.DecimalField(max_digits=10, decimal_places=2)
    codigo_barras = models.TextField(unique=True, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'producto'


class VentaDetalles(models.Model):
    id_venta = models.ForeignKey('Ventas', models.DO_NOTHING, db_column='id_venta', blank=True, null=True)
    id_producto = models.ForeignKey(Producto, models.DO_NOTHING, db_column='id_producto', blank=True, null=True)
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        managed = False
        db_table = 'venta_detalles'


class Ventas(models.Model):
    importe_total = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_y_hora = models.DateTimeField(blank=True, null=True)
    id_caja = models.ForeignKey(Cajas, models.DO_NOTHING, db_column='id_caja', blank=True, null=True)
    tipo = models.TextField(blank=True, null=True)  # This field type is a guess.
    estado = models.TextField(blank=True, null=True)
    descuento_general = models.DecimalField(max_digits=65535, decimal_places=65535)
    redondeo = models.DecimalField(max_digits=65535, decimal_places=65535)

    class Meta:
        managed = False
        db_table = 'ventas'
