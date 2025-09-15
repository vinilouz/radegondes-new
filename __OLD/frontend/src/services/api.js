import { API_BASE_URL } from '../config/api';

export async function loginUser({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Erro no login.');
  }
  return data;
}
export async function registerUser(userData) {
  const response = await fetch(`${API_BASE_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Erro no cadastro.');
  }
  return data;
}
export async function getApiData(token, endpoint = '/api/dashboard-data') {
  if (!token) {
    throw new Error('Nenhum token encontrado. Faça login novamente.');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'Erro ao buscar dados da API.');
    error.status = response.status;
    throw error;
  }

  return data;
}

// Registros de Estudo
export async function salvarRegistroEstudo(token, dadosRegistro) {
  if (!token) {
    throw new Error('Nenhum token encontrado. Faça login novamente.');
  }

  console.log('=== DEBUG SALVAMENTO ===');
  console.log('URL completa:', `${API_BASE_URL}/api/registro-estudo`);
  console.log('Token:', token ? 'Presente' : 'Ausente');
  console.log('Dados enviados:', dadosRegistro);

  const response = await fetch(`${API_BASE_URL}/api/registro-estudo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(dadosRegistro),
  });

  console.log('Status da resposta:', response.status);
  console.log('Headers da resposta:', response.headers);

  const data = await response.json();
  console.log('Dados da resposta:', data);

  if (!response.ok) {
    console.error('Erro na resposta:', data);
    const error = new Error(data.message || 'Erro ao salvar registro de estudo.');
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function buscarRegistrosEstudo(token, filtros = {}) {
  if (!token) {
    throw new Error('Nenhum token encontrado. Faça login novamente.');
  }

  const params = new URLSearchParams(filtros);
  const response = await fetch(`${API_BASE_URL}/api/registros-estudo?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'Erro ao buscar registros de estudo.');
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function buscarEstatisticasDisciplina(token, disciplinaId) {
  if (!token) {
    throw new Error('Nenhum token encontrado. Faça login novamente.');
  }

  const response = await fetch(`${API_BASE_URL}/api/disciplina/${disciplinaId}/estatisticas`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'Erro ao buscar estatísticas da disciplina.');
    error.status = response.status;
    throw error;
  }

  return data;
}
