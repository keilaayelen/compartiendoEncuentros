# Encuentros — Landing Mobile‑First (Airtable + Fallback JSON)

## Qué incluye
- Diseño mobile‑first con responsive a desktop.
- IDs y clases en español: portada, sobre‑nosotros, platillos, servicios, reservas, pie.
- Animaciones al hacer scroll (IntersectionObserver).
- Fondo global fotográfico con paneles oscuros (look & feel “Nobu” + paleta propia).
- Galería con lightbox.
- Reservas con total calculado, MP, WhatsApp y webhook Make.
- **Airtable** como fuente de disponibilidad (CSV de vista compartida) con **fallback** automático a `data/disponibilidad.json` si falla.

## Cómo activar Airtable
1. En Airtable, tabla **Disponibilidad** con campos recomendados:
   - `Fecha` (Date), `Hora` (Single select o texto), `Cupos` (Number),
     `Precio_por_persona` (Currency), `Activo` (Checkbox opcional).
2. Crear **Vista compartida** (Share view) filtrada a `Activo = true` y `Cupos > 0`.
3. Activar **Allow viewers to download CSV** y copiar el **CSV URL**.
4. En `config.js` poner:
   - `fuentes.airtable.activo = true`
   - `fuentes.airtable.csvUrl = "<TU_URL_DE_CSV>"`

> Si la URL falla o Airtable está inactivo, la app usa automáticamente `data/disponibilidad.json`.

## Campos esperados (encabezados del CSV)
`Fecha, Hora, Cupos, Precio_por_persona, Activo` (Activo es opcional)

## Servir el proyecto
Usar un servidor local (VSCode Live Server / Vite preview / http-server). No abrir como `file://` porque los módulos ES y `fetch()` pueden fallar.

