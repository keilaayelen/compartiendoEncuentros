export const CONFIG = {
  marca: "Encuentros",
  whatsapp: "2234376766",
  direccion: "Padre Dutto 352, Mar del Plata, Buenos Aires, Argentina",
  mercadopago: "https://link.mercadopago.com.ar/keilaayelenlima",
  precioCampo: "Precio_por_persona",
  precioDefault: 10000,
  maxCupos: 9,

  fuentes: {
    // Airtable: pegá la URL de CSV de la "vista compartida".
    airtable: {
      activo: true,
      csvUrl: "REEMPLAZAR_URL_CSV_AIRTABLE"
    },
    // Fallback local (funciona sin tocar nada)
    jsonLocal: {
      activo: true,
      url: "./data/disponibilidad.json"
    }
  },

  // Webhook de Make (opcional)
  makeWebhook: "https://hook.eu2.make.com/qpx4pxr4u494qvkugvqfd9j2u5olp8lk"
};
