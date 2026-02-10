// frontend/src/lib/api.ts

const API_BASE_URL = "http://localhost:3001/api";

interface FetchOptions extends RequestInit {
  // Opções extras se necessário no futuro
}

export const api = async (endpoint: string, options: FetchOptions = {}) => {
  const token = localStorage.getItem('authToken');
  const companyId = localStorage.getItem('selectedCompanyId');

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // AQUI ESTÁ A MÁGICA: Injeta o ID da empresa automaticamente
  if (companyId) {
    headers["x-company-id"] = companyId;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Tratamento global de erro 401 (Token expirado) ou 403 (Acesso negado)
  if (response.status === 401) {
    // Opcional: Redirecionar para login ou limpar storage
    // window.location.href = '/login';
  }

  return response;
};