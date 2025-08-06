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
  // Si la respuesta es 204 (No Content), la operación fue exitosa pero no hay cuerpo.
  // Devolvemos un objeto vacío para evitar el error de JSON.
  if (response.status === 204) {
    return {}; 
  }
  // --- FIN DEL CAMBIO ---

  const body = await response.json();

  if (!response.ok) {
    const errorMessage = body.detail || body.message || JSON.stringify(body) || response.statusText;
    throw new Error(`Error en la petición a la API: ${errorMessage}`);
  }

  return body;
}