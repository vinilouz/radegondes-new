import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import PlanoDetalhes from '../pages/user/PlanoDetalhes';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

const mockNavigate = vi.fn();
const mockParams = { id: 'plano123' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
    useLocation: () => ({ search: '' })
  };
});

global.fetch = vi.fn();
global.console = {
  ...console,
  log: vi.fn()
};

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

describe('PlanoDetalhes Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockClear();
    console.log.mockClear();
  });

  describe('isPlanoPersonalizado function', () => {
    const createMockPlano = (editais) => ({
      _id: 'plano123',
      nome: 'Test Plano',
      editais,
      disciplinas: [],
      totalDisciplinas: 0,
      totalTopicos: 0
    });

    it('should return true for plano with no editais', async () => {
      const plano = createMockPlano(undefined);
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(plano)
      });

      renderWithProviders(<PlanoDetalhes />);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith(
          '🔍 Verificando se é plano personalizado:',
          expect.objectContaining({
            editais: undefined,
            editaisLength: undefined,
            isArray: false
          })
        );
        expect(console.log).toHaveBeenCalledWith('✅ É personalizado: sem editais ou array vazio');
      });
    });

    it('should return true for plano with empty editais array', async () => {
      const plano = createMockPlano([]);
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(plano)
      });

      renderWithProviders(<PlanoDetalhes />);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith(
          '🔍 Verificando se é plano personalizado:',
          expect.objectContaining({
            editais: [],
            editaisLength: 0,
            isArray: true
          })
        );
        expect(console.log).toHaveBeenCalledWith('✅ É personalizado: sem editais ou array vazio');
      });
    });

    it('should return true for plano with EditalPersonalizado', async () => {
      const plano = createMockPlano([
        {
          nome: 'EditalPersonalizado',
          instituicao: { nome: 'Personalizado', sigla: 'PERS' }
        }
      ]);
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(plano)
      });

      renderWithProviders(<PlanoDetalhes />);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith(
          '🔍 Verificando edital:',
          expect.objectContaining({
            nome: 'EditalPersonalizado',
            nomeEdital: 'editalpersonalizado',
            isPersonalizado: true
          })
        );
        expect(console.log).toHaveBeenCalledWith('🎯 Resultado final isPlanoPersonalizado:', true);
      });
    });

    it('should return true for plano with "Personalizado" edital name', async () => {
      const plano = createMockPlano([
        {
          nome: 'Personalizado',
          instituicao: { nome: 'Custom', sigla: 'CUST' }
        }
      ]);
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(plano)
      });

      renderWithProviders(<PlanoDetalhes />);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith(
          '🔍 Verificando edital:',
          expect.objectContaining({
            nome: 'Personalizado',
            nomeEdital: 'personalizado',
            isPersonalizado: true
          })
        );
        expect(console.log).toHaveBeenCalledWith('🎯 Resultado final isPlanoPersonalizado:', true);
      });
    });

    it('should return false for plano with regular edital', async () => {
      const plano = createMockPlano([
        {
          nome: 'Concurso Público XYZ',
          instituicao: { nome: 'Prefeitura ABC', sigla: 'PABC' }
        }
      ]);
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(plano)
      });

      renderWithProviders(<PlanoDetalhes />);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith(
          '🔍 Verificando edital:',
          expect.objectContaining({
            nome: 'Concurso Público XYZ',
            nomeEdital: 'concurso público xyz',
            isPersonalizado: false
          })
        );
        expect(console.log).toHaveBeenCalledWith('🎯 Resultado final isPlanoPersonalizado:', false);
      });
    });

    it('should return true for plano with invalid edital object', async () => {
      const plano = createMockPlano([
        null,
        { nome: null },
        { nome: '' },
        'invalid-edital'
      ]);
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(plano)
      });

      renderWithProviders(<PlanoDetalhes />);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('✅ É personalizado: edital inválido');
        expect(console.log).toHaveBeenCalledWith('🎯 Resultado final isPlanoPersonalizado:', true);
      });
    });

    it('should handle case insensitive edital names', async () => {
      const plano = createMockPlano([
        {
          nome: '  EDITALPERSONALIZADO  ',
          instituicao: { nome: 'Test', sigla: 'TEST' }
        }
      ]);
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(plano)
      });

      renderWithProviders(<PlanoDetalhes />);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith(
          '🔍 Verificando edital:',
          expect.objectContaining({
            nome: '  EDITALPERSONALIZADO  ',
            nomeEdital: 'editalpersonalizado',
            isPersonalizado: true
          })
        );
        expect(console.log).toHaveBeenCalledWith('🎯 Resultado final isPlanoPersonalizado:', true);
      });
    });

    it('should return true if any edital in array is personalized', async () => {
      const plano = createMockPlano([
        {
          nome: 'Concurso Regular',
          instituicao: { nome: 'Prefeitura', sigla: 'PREF' }
        },
        {
          nome: 'EditalPersonalizado',
          instituicao: { nome: 'Personalizado', sigla: 'PERS' }
        },
        {
          nome: 'Outro Concurso',
          instituicao: { nome: 'Outro', sigla: 'OUT' }
        }
      ]);
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(plano)
      });

      renderWithProviders(<PlanoDetalhes />);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('🎯 Resultado final isPlanoPersonalizado:', true);
      });
    });

    it('should return false if no editais are personalized', async () => {
      const plano = createMockPlano([
        {
          nome: 'Concurso A',
          instituicao: { nome: 'Instituição A', sigla: 'IA' }
        },
        {
          nome: 'Concurso B',
          instituicao: { nome: 'Instituição B', sigla: 'IB' }
        }
      ]);
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(plano)
      });

      renderWithProviders(<PlanoDetalhes />);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('🎯 Resultado final isPlanoPersonalizado:', false);
      });
    });
  });

  describe('Component behavior with personalized plans', () => {
    it('should handle personalized plan correctly', async () => {
      const personalizedPlano = {
        _id: 'plano123',
        nome: 'Estudo Personalizado',
        editais: [{
          nome: 'EditalPersonalizado',
          instituicao: { nome: 'Personalizado', sigla: 'PERS' },
          disciplinas: []
        }],
        disciplinas: [],
        totalDisciplinas: 0,
        totalTopicos: 0
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(personalizedPlano)
      });

      renderWithProviders(<PlanoDetalhes />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/planos/plano123`,
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-token'
            })
          })
        );
      });
    });

    it('should handle regular plan correctly', async () => {
      const regularPlano = {
        _id: 'plano123',
        nome: 'Concurso Regular',
        editais: [{
          nome: 'Concurso Público ABC',
          instituicao: { nome: 'Prefeitura ABC', sigla: 'PABC' },
          disciplinas: []
        }],
        disciplinas: [],
        totalDisciplinas: 0,
        totalTopicos: 0
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(regularPlano)
      });

      renderWithProviders(<PlanoDetalhes />);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('🎯 Resultado final isPlanoPersonalizado:', false);
      });
    });
  });
});