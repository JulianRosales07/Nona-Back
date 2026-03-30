const supabase = require('../config/database');
const { linkByCedula, getMyPatients } = require('../controllers/relationshipController');

// Mock de Supabase
jest.mock('../config/database', () => ({
  from: jest.fn(),
}));

describe('relationshipController', () => {
  let req, res;

  beforeEach(() => {
    req = { 
      body: {}, 
      user: { userId: 1, role: 'cuidador' }, // Simular usuario autenticado
      query: {} 
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  const mockSupabaseChain = (finalResult) => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(finalResult),
    insert: jest.fn().mockReturnThis(),
  });

  describe('linkByCedula (HU-01 Linking)', () => {
    test('404 si no se encuentra el adulto mayor por cédula', async () => {
      req.body = { cedula: '9999', relationshipType: 'cuidador' };
      
      const elderlyChain = mockSupabaseChain({ data: null, error: { message: 'Not found' } });
      supabase.from.mockReturnValue(elderlyChain);

      await linkByCedula(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
        message: 'No se encontró un adulto mayor con esa cédula' 
      }));
    });

    test('201 vinculación exitosa', async () => {
      req.body = { cedula: '12345', relationshipType: 'cuidador' };
      
      const elderlyData = { id: 10, name: 'Abuelo', role: 'adulto_mayor', cedula: '12345' };
      
      // 1. Mock buscar adulto mayor
      const findElderlyChain = mockSupabaseChain({ data: elderlyData, error: null });
      // 2. Mock buscar relación existente (que no haya)
      const existingRelChain = mockSupabaseChain({ data: null, error: null });
      // 3. Mock insertar relación
      const insertRelChain = {
        ...mockSupabaseChain(null),
        single: jest.fn().mockResolvedValue({ 
          data: { id: 100, elderly_id: 10, caregiver_id: 1 }, 
          error: null 
        })
      };

      supabase.from
        .mockReturnValueOnce(findElderlyChain)
        .mockReturnValueOnce(existingRelChain)
        .mockReturnValueOnce(insertRelChain);

      await linkByCedula(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
        success: true,
        message: 'Vinculación exitosa'
      }));
    });
  });

  describe('getMyPatients (HU-25 Visualizar info)', () => {
    test('200 obtener lista de pacientes (adultos mayores)', async () => {
      const mockPatients = [
        { 
          id: 101, 
          elderly: { id: 10, name: 'Abuelo', email: 'a@a.com', profile_image_url: 'url' } 
        }
      ];
      
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        mockResolvedValue: jest.fn().mockResolvedValue({ data: mockPatients, error: null })
      };
      
      // Ajustar mock para el select encadenado complejo
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        // Usar null para indicar que el resultado viene del chain anterior o mockear la promesa
      });
      // Forma más simple:
      supabase.from.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          then: jest.fn().mockImplementation(callback => callback({ data: mockPatients, error: null }))
      });

      await getMyPatients(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    });
  });
});
