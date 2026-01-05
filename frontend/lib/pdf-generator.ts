import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Definimos tipos mínimos para no tener problemas de TS
interface BusinessData {
  name: string;
  cuit: string;
  logoUrl?: string | null;
  startActivity?: string; // Inicio de actividades
  address?: string;
}

export const generateInvoicePDF = async (venta: any, business: BusinessData) => {
  const doc = new jsPDF();

  // --- CONFIGURACIÓN ---
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 10;
  
  // Colores y Estilos
  doc.setFont("helvetica");
  
  // --- 1. ENCABEZADO (CAJA GRIS DE FONDO) ---
  // Dibujamos un rectángulo bordeado para el encabezado
  // doc.setDrawColor(0);
  // doc.rect(margin, margin, pageWidth - (margin * 2), 40); // Caja contenedora

  // --- 2. LOGO Y DATOS DEL EMISOR (IZQUIERDA) ---
  const leftX = margin + 5;
  let currentY = margin + 10;

  // Intentar cargar logo si existe
  if (business.logoUrl) {
    try {
        // Convertir imagen a Base64 o usarla directamente si el navegador lo permite
        // Por simplicidad, aquí dibujamos un cuadro placeholder si falla, 
        // pero jsPDF soporta URLs si no hay problemas de CORS.
        const img = new Image();
        img.src = business.logoUrl;
        // Esperamos un poco a que cargue (truco rápido) o dibujamos
        doc.addImage(img, "PNG", leftX, currentY, 20, 20);
        currentY += 25; 
    } catch (e) {
        // Si falla, solo texto
    }
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(business.name || "Mi Negocio", leftX, currentY);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  currentY += 5;
  doc.text(business.address || "Dirección del negocio", leftX, currentY);
  currentY += 5;
  doc.text("Condición IVA: Responsable Inscripto", leftX, currentY); // O lo que corresponda

  // --- 3. CUADRO DE TIPO DE FACTURA (CENTRO) ---
  // El famoso cuadradito con la letra "A", "B" o "C"
  const centerX = pageWidth / 2;
  const boxSize = 12;
  
  doc.setDrawColor(0);
  doc.setFillColor(255, 255, 255);
  doc.rect(centerX - (boxSize/2), margin, boxSize, boxSize, "FD"); // Cuadro
  
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  // Extraemos la letra del tipo de comprobante (Ej: "Factura B" -> "B")
  const letra = venta.tipo_comprobante ? venta.tipo_comprobante.slice(-1) : "X";
  doc.text(letra, centerX - 2.5, margin + 8);
  
  doc.setFontSize(7);
  doc.text(`COD. ${letra === 'A' ? '001' : letra === 'B' ? '006' : '011'}`, centerX - 5, margin + 16);


  // --- 4. DATOS DE LA FACTURA (DERECHA) ---
  const rightX = pageWidth / 2 + 20;
  let rightY = margin + 10;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURA", rightX, rightY);
  
  rightY += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  // Formato: 00001-00000023
  const numeroComp = venta.nro_comprobante || `00001-${venta.id.toString().padStart(8, '0')}`;
  doc.text(`Nº: ${numeroComp}`, rightX, rightY);
  
  rightY += 6;
  doc.setFont("helvetica", "normal");
  // Formatear fecha (YYYY-MM-DD a DD/MM/YYYY)
  const [anio, mes, dia] = (venta.fecha || "").split('-');
  doc.text(`Fecha: ${dia}/${mes}/${anio}`, rightX, rightY);
  
  rightY += 6;
  doc.text(`CUIT: ${business.cuit || "20-12345678-9"}`, rightX, rightY);
  
  rightY += 6;
  doc.text(`Ingresos Brutos: ${business.cuit || "-"}`, rightX, rightY);
  
  rightY += 6;
  doc.text(`Inicio de Actividades: ${business.startActivity || "01/01/2024"}`, rightX, rightY);

  // --- 5. DATOS DEL CLIENTE ---
  const clientY = margin + 45;
  doc.line(margin, clientY, pageWidth - margin, clientY); // Línea divisoria
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENTE:", margin, clientY + 5);
  
  doc.setFont("helvetica", "normal");
  // Aquí pondrías los datos reales del cliente si los tuvieras
  doc.text("Nombre: Consumidor Final", margin + 20, clientY + 5);
  doc.text("CUIT/DNI: 00-00000000-0", margin + 100, clientY + 5);
  doc.text("Condición IVA: Consumidor Final", margin + 20, clientY + 10);
  doc.text("Domicilio: -", margin + 100, clientY + 10);


  // --- 6. TABLA DE PRODUCTOS ---
  const tableY = clientY + 15;
  
  const tableBody = venta.venta_detalle.map((item: any) => [
    item.producto?.codigo || "-",
    (item.descripcion || item.producto?.nombre || "").substring(0, 30), // Cortar nombres largos
    item.cantidad,
    `$${Number(item.precio_unitario).toLocaleString("es-AR", {minimumFractionDigits: 2})}`,
    `$${Number(item.subtotal).toLocaleString("es-AR", {minimumFractionDigits: 2})}`
  ]);

  autoTable(doc, {
    startY: tableY,
    head: [['Código', 'Descripción', 'Cant.', 'Precio Unit.', 'Subtotal']],
    body: tableBody,
    theme: 'plain', // Estilo limpio tipo factura
    styles: { fontSize: 9 },
    headStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold' }, // Gris claro
    columnStyles: {
        0: { cellWidth: 25 },
        2: { cellWidth: 15, halign: 'right' }, // Cantidad alineada a derecha
        3: { cellWidth: 30, halign: 'right' }, // Precio alineado a derecha
        4: { cellWidth: 30, halign: 'right' }  // Subtotal alineado a derecha
    }
  });

  // --- 7. TOTALES ---
  // Obtenemos la posición Y donde terminó la tabla
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL: $${Number(venta.total).toLocaleString("es-AR", {minimumFractionDigits: 2})}`, pageWidth - margin - 50, finalY);

  // --- 8. PIE DE PÁGINA (CAE y VENCIMIENTO) ---
  // Esto es lo que le da validez legal
  if (venta.cae) {
      const footerY = pageHeight - 30;
      doc.setDrawColor(0);
      doc.line(margin, footerY, pageWidth - margin, footerY);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("CAE Nº:", pageWidth - 80, footerY + 7);
      doc.setFont("helvetica", "normal");
      doc.text(venta.cae, pageWidth - 60, footerY + 7);
      
      doc.setFont("helvetica", "bold");
      doc.text("Fecha Vto. CAE:", pageWidth - 80, footerY + 14);
      doc.setFont("helvetica", "normal");
      // Formatear fecha de vto (YYYY-MM-DD -> DD/MM/YYYY)
      const [vAnio, vMes, vDia] = (venta.vto_cae || "").split('-');
      const vtoFormat = vDia ? `${vDia}/${vMes}/${vAnio}` : venta.vto_cae;
      doc.text(vtoFormat || "", pageWidth - 50, footerY + 14);

      // Código de Barras (Simulado visualmente con texto por ahora)
      doc.setFontSize(6);
      doc.text(`Comprobante Autorizado`, margin, footerY + 7);
  }

  // --- 9. DESCARGAR ---
  doc.save(`Factura-${venta.nro_comprobante || venta.id}.pdf`);
};