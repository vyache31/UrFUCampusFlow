const DEFAULT_API_BASE_URL = 'http://localhost:8000';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

if (!configuredApiBaseUrl) {
  console.warn(
    '[apiConfig] VITE_API_BASE_URL не задан. Используется значение по умолчанию:',
    DEFAULT_API_BASE_URL,
  );
}

export const API_BASE_URL = (
  configuredApiBaseUrl || DEFAULT_API_BASE_URL
).replace(/\/+$/, '');