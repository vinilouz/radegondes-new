import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Planos from '../pages/user/Planos';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

global.fetch = vi.fn();
global.alert = vi.fn();
global.confirm = vi.fn();

const mockAuthContext = {
  token: 'mock-token',
  user: { id: '1', nome: 'Test User' }
};

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Planos Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockClear();
  });

  describe('criarPlanoPersonalizado function', () => {
    it('should create personalized study successfully', async () => {
      const mockPlano = {
        _id: 'plano123',
        nome: 'Estudo Personalizado',
        editais: [{
          nome: 'EditalPersonalizado',
          instituicao: { nome: 'Personalizado', sigla: 'PERS' },
          disciplinas: []
        }]
      };

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([])
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPlano)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockPlano])
        });

      renderWithProviders(<Planos />);

      await waitFor(() => {
        expect(screen.getByText('Criar Estudo Personalizado')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Criar Estudo Personalizado');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/planos`, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nome: 'Estudo Personalizado',
            cargos: [],
            descricao: 'Estudo personalizado criado pelo usuário'
          })
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith('/planos/plano123?edit=true');
    });

    it('should handle EditalPersonalizado not configured error', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([])
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({
            message: 'Erro interno: EditalPersonalizado não configurado.'
          })
        });

      renderWithProviders(<Planos />);

      await waitFor(() => {
        expect(screen.getByText('Criar Estudo Personalizado')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Criar Estudo Personalizado');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(alert).toHaveBeenCalledWith('Erro ao criar estudo personalizado. Tente novamente.');
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should handle network error during creation', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([])
        })
        .mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(<Planos />);

      await waitFor(() => {
        expect(screen.getByText('Criar Estudo Personalizado')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Criar Estudo Personalizado');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(alert).toHaveBeenCalledWith('Erro de conexão. Verifique sua internet e tente novamente.');
      });
    });

    it('should handle server error response', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([])
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve({
            message: 'Nome e cargos são obrigatórios.'
          })
        });

      renderWithProviders(<Planos />);

      await waitFor(() => {
        expect(screen.getByText('Criar Estudo Personalizado')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Criar Estudo Personalizado');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(alert).toHaveBeenCalledWith('Erro ao criar estudo personalizado. Tente novamente.');
      });
    });

    it('should send correct request payload', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([])
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ _id: 'test-id' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([])
        });

      renderWithProviders(<Planos />);

      await waitFor(() => {
        expect(screen.getByText('Criar Estudo Personalizado')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Criar Estudo Personalizado');
      fireEvent.click(createButton);

      await waitFor(() => {
        const postCall = fetch.mock.calls.find(call => call[1]?.method === 'POST');
        expect(postCall).toBeDefined();
        expect(postCall[0]).toBe(`${API_BASE_URL}/api/planos`);
        expect(postCall[1].headers['Authorization']).toBe('Bearer mock-token');
        expect(postCall[1].headers['Content-Type']).toBe('application/json');
        
        const body = JSON.parse(postCall[1].body);
        expect(body.nome).toBe('Estudo Personalizado');
        expect(body.cargos).toEqual([]);
        expect(body.descricao).toBe('Estudo personalizado criado pelo usuário');
      });
    });

    it('should refresh plans list after successful creation', async () => {
      const mockPlano = { _id: 'plano123', nome: 'Estudo Personalizado' };
      
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([])
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPlano)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockPlano])
        });

      renderWithProviders(<Planos />);

      await waitFor(() => {
        expect(screen.getByText('Criar Estudo Personalizado')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Criar Estudo Personalizado');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(3);
        const calls = fetch.mock.calls;
        expect(calls[0][0]).toBe(`${API_BASE_URL}/api/planos`);
        expect(calls[1][1].method).toBe('POST');
        expect(calls[2][0]).toBe(`${API_BASE_URL}/api/planos`);
      });
    });
  });

  describe('Component rendering', () => {
    it('should render create personalized study button', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      });

      renderWithProviders(<Planos />);

      await waitFor(() => {
        expect(screen.getByText('Criar Estudo Personalizado')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      fetch.mockImplementation(() => new Promise(() => {}));

      renderWithProviders(<Planos />);

      expect(screen.getByTestId('skeleton-cards')).toBeInTheDocument();
    });

    it('should handle fetch plans error gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Fetch error'));

      renderWithProviders(<Planos />);

      await waitFor(() => {
        expect(screen.queryByTestId('skeleton-cards')).not.toBeInTheDocument();
      });
    });
  });
});