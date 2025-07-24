// lib/api.ts (Versión Limpia)

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

  if (!response.ok) {
    throw new Error(`Error en la petición a la API: ${response.statusText}`);
  }

  // Para métodos que no devuelven contenido, como DELETE
  if (response.status === 204) {
    return;
  }

  return response.json();
}