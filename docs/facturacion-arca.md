# Facturación electrónica con ARCA

Estado al 1/10/2026. Las reglas fiscales cambian seguido: revisar las fuentes antes de cada temporada fiscal
y validar con un contador lo marcado como **(validar)**.

## 1. Modelo elegido: delegación a un único certificado

```
Comercio (CUIT A) ──delega "Facturación Electrónica"──▶ Tu CUIT ──certificado del sistema──▶ ARCA WSFEv1
Comercio (CUIT B) ──delega──────────────────────────────▲
```

- Hay **un solo certificado digital**, el tuyo, guardado en variables de entorno del servidor.
- Cada comercio **delega** el web service de facturación a tu CUIT desde su Administrador de Relaciones.
- En cada pedido a ARCA va el CUIT del comercio (`Auth.Cuit`), firmado con tu certificado.
- No guardás claves privadas ni claves fiscales de clientes: menos riesgo legal y menos soporte.

Por qué no "certificado por comercio": cada cliente tendría que generar una clave con OpenSSL y subirla, y vos
custodiarías claves privadas ajenas (si se filtran, alguien podría facturar en nombre del cliente).

### Costos

| Concepto | Costo |
|---|---|
| Web service de facturación de ARCA (homologación y producción) | $0 |
| Certificados digitales de ARCA | $0 |
| Clave fiscal nivel 3 | $0 |
| Delegación de servicios | $0 |
| Librería `@arcasdk/core` (MIT, conexión directa sin intermediarios) | $0 |
| Alternativa descartada: Afip SDK (intermediario) | USD 25/mes desde 2 CUIT |

El costo de facturar es cero. Lo que sí cuesta es operar como proveedor (sección 5) y la infraestructura (sección 6).

### Clave fiscal nivel 3

Es el nivel de seguridad de tu clave en ARCA. El nivel 3 se obtiene **gratis** validando identidad:
con la app Mi Argentina (validación biométrica), por home banking en bancos adheridos, o en una dependencia
de ARCA con DNI. Hace falta para administrar relaciones y certificados. Los comercios que ya facturan
normalmente ya lo tienen.

## 2. Reglas fiscales implementadas

Código: `frontend/lib/arca/fiscal.ts` (probado en `fiscal.check.ts`).

| Regla | Implementación | Fuente |
|---|---|---|
| Monotributo y Exento emiten **Factura C** | `tipoComprobante` | RG 1415 |
| Responsable Inscripto emite **A** a RI y monotributistas, **B** al resto | `tipoComprobante` | RG 1415, RG 5003 |
| Condición IVA del receptor obligatoria (`CondicionIVAReceptorId`) | se envía siempre | RG 5616 · manual WSFEv1 v4.7/4.8 |
| Consumidor final sin identificar (`DocTipo 99`) hasta **$10.000.000**; desde ahí, DNI o CUIT | `documentoReceptor` | RG 5700/2025 |
| CUIT del cliente con dígito verificador válido | `cuitValido` | — |
| A y B: neto + IVA discriminados; neto + IVA = total exacto | `importes` | WSFEv1 |
| C: neto = total, IVA 0, sin array `Iva` | `importes` | WSFEv1 |
| Numeración correlativa por punto de venta y tipo (último + 1, reintenta si otro tomó el número) | `createNextVoucher` + reintento por error 10016 | WSFEv1 |
| **QR** en el comprobante impreso | `urlQr` + PDF | RG 4291 |
| Factura B muestra **IVA contenido** y otros impuestos nacionales indirectos | PDF | Ley 27.743 (Transparencia Fiscal al Consumidor) |
| Venta sin factura impresa como "Documento no válido como factura" | PDF | RG 1415 |
| Una factura autorizada **no se borra**: se anula con nota de crédito | bloqueo en `deleteVenta` | RG 1415 |
| Fecha del comprobante en hora argentina | `fechaArca` | — |

### Flujo de una venta con factura

1. La venta se guarda con `estado_fiscal = pendiente` (si ARCA no responde, la venta no se pierde).
2. El servidor (`/api/ventas/[id]/facturar`) reserva la venta (`procesando`) para no pedir dos CAE.
3. Calcula letra, documento e importes, y pide el CAE a ARCA.
4. Guarda CAE, vencimiento, número, tipo y desglose (`autorizada`), o el motivo del rechazo (`error`).
5. Desde el detalle de la venta se puede reintentar, o facturar una venta que se hizo sin factura.

## 3. Lo que falta (ordenado por impacto)

1. **Nota de crédito**, para anular facturas o hacer devoluciones. Sin ella, una factura mal emitida no se corrige desde el sistema.
2. **IVA por producto.** Hoy se usa una alícuota por comercio (21 % por defecto). Un RI que venda productos de distintas alícuotas necesita la alícuota en cada producto.
3. **Consulta al padrón** (servicio `ws_sr_padron_a13`) para completar nombre y condición IVA a partir del CUIT. Requiere que el comercio también delegue ese servicio.
4. **Contingencia CAEA** para cortes largos de ARCA. Hoy la venta queda pendiente y se reintenta.
5. **Recuperación de "procesando".** Si el servidor se cae entre recibir el CAE y guardarlo, la venta queda en `procesando`. Antes de reintentar, hay que verificar en "Comprobantes en línea" (o con `getVoucherInfo`).

## 4. Configuración inicial (la hacés una vez)

### 4.1 Base de datos
Correr `supabase/migrations/20261001000000_facturacion_arca.sql` en Supabase → SQL Editor.

Verificar además que **todas** las tablas (`venta`, `venta_detalle`, `producto`, `caja`) tengan RLS por usuario.
Con varios comercios, sin RLS cualquiera puede leer los datos de los otros. Cómo revisarlo:
```sql
select tablename, rowsecurity from pg_tables where schemaname = 'public';
select * from pg_policies where schemaname = 'public';
```

### 4.2 Certificado de homologación (pruebas)
```bash
openssl genrsa -out arca-homo.key 2048
openssl req -new -key arca-homo.key -subj "/C=AR/O=TU NOMBRE/CN=gestor-stock/serialNumber=CUIT 20XXXXXXXXX" -out arca-homo.csr
```
1. ARCA → Administrador de Relaciones → adherir el servicio **WSASS** (Autoservicio de acceso a APIs de homologación).
2. En WSASS: nuevo certificado con el contenido de `arca-homo.csr`, guardar el `.crt` que devuelve, y crear autorización al servicio `wsfe` para tu CUIT.
3. En homologación probá con **tu propio CUIT** como comercio, con un punto de venta cualquiera (por ejemplo 1).

### 4.3 Certificado de producción
1. Generar otra clave y otro CSR igual que arriba (`arca-prod.key`, `arca-prod.csr`).
2. ARCA → **Administración de Certificados Digitales** → agregar alias, subir el CSR y descargar el `.crt`.
3. Administrador de Relaciones → Nueva relación → servicio **Facturación Electrónica** → representante: el alias del certificado (computador fiscal).

### 4.4 Variables de entorno (Vercel → Settings → Environment Variables)
```
ARCA_CERT_HOMO   contenido de arca-homo.crt
ARCA_KEY_HOMO    contenido de arca-homo.key
ARCA_CERT        contenido de arca-prod.crt
ARCA_KEY         contenido de arca-prod.key
NEXT_PUBLIC_ARCA_CUIT_SISTEMA   tu CUIT (se muestra en las instrucciones para los comercios)
SUPABASE_SERVICE_ROLE_KEY       (ya existía) para guardar el ticket de acceso de ARCA
```
Las `.key` son secretas: nunca al repo (que hoy es **público**).

### 4.5 Por cada comercio nuevo
1. El comercio crea su punto de venta "RECE para aplicativo y web services" y te delega "Facturación Electrónica" (instrucciones dentro de Mi cuenta).
2. Vos aceptás la delegación en tu ARCA y relacionás el servicio de ese representado con tu computador fiscal. **(validar con el primer cliente real: el paso exacto puede variar)**
3. El comercio carga sus datos fiscales y toca "Probar conexión".
4. Primero en modo prueba; cuando todo da bien, activa "Facturas reales".

### 4.6 Pruebas en homologación antes de salir
- [ ] Factura C (monotributo) a consumidor final sin identificar
- [ ] Factura B (RI) a consumidor final con DNI
- [ ] Factura A (RI) a responsable inscripto y a monotributista
- [ ] CUIT inválido: debe mostrar error sin llamar a ARCA
- [ ] Venta ≥ $10.000.000 sin DNI: debe pedir identificación
- [ ] Dos ventas facturadas casi a la vez: números correlativos sin huecos
- [ ] PDF: QR escaneable que abre la verificación de ARCA

## 5. Lo legal de prestar el servicio **(validar con contador)**

- **Inscripción:** para cobrarle a los comercios necesitás CUIT e inscripción, normalmente monotributo con actividad de software/servicios informáticos. Les facturás con Factura C (podés usar tu propio sistema).
- **Responsabilidad fiscal:** cada comercio es responsable de sus datos fiscales y de lo que factura. El sistema solo transmite. Ponelo por escrito en términos y condiciones que el comercio acepte.
- **Datos personales (Ley 25.326):** guardás datos de los clientes de tus clientes (nombre, DNI, CUIT). El comercio es el responsable de esa base y vos el encargado del tratamiento. Necesitás un contrato o cláusula de tratamiento de datos, medidas de seguridad, y evaluar la inscripción de la base ante la AAIP.
- **Conservación:** los comprobantes deben conservarse al menos durante el plazo de prescripción más 2 años (RG 1415). No borres ventas facturadas.
- **Software homologado:** WSFE no exige homologar el software (eso aplica a controladores fiscales). Lo que se exige es el certificado y la autorización del servicio.

## 6. Infraestructura y costo mínimo

| Pieza | Hoy | Límite del plan gratis | Cuándo pagar |
|---|---|---|---|
| Vercel (frontend + API de facturación) | Hobby | **El plan Hobby no permite uso comercial** | Al cobrar el primer cliente: Pro USD 20/mes, o mover el frontend a Cloudflare Pages (gratis, permite uso comercial) |
| Supabase (base, autenticación, archivos) | Free | 500 MB de base · se pausa tras 7 días sin uso · 2 proyectos | Al acercarse a 500 MB o si un cliente deja de usarlo una semana: Pro USD 25/mes, o backend propio (ver `docs/backend-nube.md` cuando exista) |
| Dominio .com.ar en NIC Argentina | — | — | Arancel anual de NIC.ar |

## Fuentes
- RG 5616 y manual WSFEv1 v4.7: https://www.signature.ar/novedades/actualizaci%C3%B3n-arca:-lanzamiento-del-wsfev1-v4.7-y-obligatoriedad-del-iva-receptor
- RG 5894/2026, manual WSFEv1 v4.8: https://gosocket.net/centro-de-recursos/argentina-arca-publica-la-v4-8-del-manual-del-desarrollador-wsfev1/
- RG 5700/2025 (umbral de $10.000.000): https://blogdelcontador.com.ar/news-45898-arca-eleva-a-10-millones-el-limite-para-identificar-al-consumidor-final-en-comprobantes
- Delegación de servicios: https://developargentina.com/blog/delegaciones-afip-guia-practica · https://www.argentina.gob.ar/sites/default/files/instructivo_adhesion_servicio_afip.pdf
- WSASS (homologación): https://www.afip.gob.ar/ws/WSASS/WSASS_como_adherirse.pdf
- @arcasdk/core: https://github.com/ralcorta/arcasdk
- Vercel Hobby, solo uso no comercial: https://vercel.com/docs/plans/hobby · https://vercel.com/docs/limits/fair-use-guidelines
- Precios de Afip SDK: https://afipsdk.com/en/pricing/
- Límites de Supabase Free: https://uibakery.io/blog/supabase-pricing
