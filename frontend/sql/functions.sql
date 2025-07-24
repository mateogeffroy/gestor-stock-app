-- Función para actualizar el stock de un producto
CREATE OR REPLACE FUNCTION actualizar_stock(p_id_producto INT, p_cantidad INT)
RETURNS VOID AS $$
BEGIN
  UPDATE producto
  SET stock = stock - p_cantidad
  WHERE id = p_id_producto;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular el subtotal en venta_detalles
CREATE OR REPLACE FUNCTION calcular_subtotal()
RETURNS TRIGGER AS $$
BEGIN
  NEW.subtotal = NEW.cantidad * NEW.precio_unitario;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_subtotal
BEFORE INSERT OR UPDATE ON venta_detalles
FOR EACH ROW
EXECUTE FUNCTION calcular_subtotal();

-- Trigger para calcular el importe total de una venta
CREATE OR REPLACE FUNCTION actualizar_importe_total()
RETURNS TRIGGER AS $$
DECLARE
  v_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(subtotal), 0) INTO v_total
  FROM venta_detalles
  WHERE id_venta = NEW.id_venta;
  
  UPDATE ventas
  SET importe_total = v_total
  WHERE id = NEW.id_venta;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_importe_total
AFTER INSERT OR UPDATE OR DELETE ON venta_detalles
FOR EACH ROW
EXECUTE FUNCTION actualizar_importe_total();

-- Trigger para calcular precio_final o utilidad_porcentual en producto
CREATE OR REPLACE FUNCTION calcular_precio_utilidad()
RETURNS TRIGGER AS $$
BEGIN
  -- Si tenemos precio_lista y utilidad_porcentual pero no precio_final, calcularlo
  IF NEW.precio_lista IS NOT NULL AND NEW.utilidad_porcentual IS NOT NULL AND NEW.precio_final IS NULL THEN
    NEW.precio_final = NEW.precio_lista * (1 + NEW.utilidad_porcentual / 100);
  END IF;
  
  -- Si tenemos precio_lista y precio_final pero no utilidad_porcentual, calcularlo
  IF NEW.precio_lista IS NOT NULL AND NEW.precio_final IS NOT NULL AND NEW.utilidad_porcentual IS NULL THEN
    NEW.utilidad_porcentual = ((NEW.precio_final / NEW.precio_lista) - 1) * 100;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_precio_utilidad
BEFORE INSERT OR UPDATE ON producto
FOR EACH ROW
EXECUTE FUNCTION calcular_precio_utilidad();

