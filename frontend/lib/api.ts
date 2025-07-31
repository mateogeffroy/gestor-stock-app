// frontend/lib/api.ts

const API_URL = "http://127.0.0.1:8000";

export async function fetchFromAPI(endpoint: string, options: RequestInit = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // --- INICIO DEL CAMBIO ---
  // Leemos el cuerpo de la respuesta primero para poder analizarlo
  const body = await response.json();

  // Si la respuesta no es OK (ej: error 400, 500), lanzamos un error con el mensaje del backend si existe
  if (!response.ok) {
    // Intentamos obtener un mensaje de error más detallado del cuerpo de la respuesta
    const errorMessage = body.detail || body.message || JSON.stringify(body) || response.statusText;
    throw new Error(`Error en la petición a la API: ${errorMessage}`);
  }

  // Para métodos como DELETE que devuelven 204 No Content, el body puede estar vacío
  if (response.status === 204) {
    return;
  }
  
  // Devolvemos el cuerpo completo de la respuesta (que puede contener datos y 'warnings')
  return body;
  // --- FIN DEL CAMBIO ---
}