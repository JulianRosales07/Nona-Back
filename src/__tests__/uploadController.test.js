const supabase = require('../config/database');
const { uploadProfileImage, deleteProfileImage } = require('../controllers/uploadController');

// Mock de Supabase
jest.mock('../config/database', () => ({
  from: jest.fn(),
  storage: {
    from: jest.fn().mockReturnThis(),
    upload: jest.fn(),
    getPublicUrl: jest.fn(),
    remove: jest.fn(),
  },
}));

describe('uploadController', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('uploadProfileImage', () => {
    test('400 si faltan campos requeridos', async () => {
      req.body = { userId: '1' }; // Faltan imageBase64 y fileName
      await uploadProfileImage(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    test('200 subida exitosa de imagen de perfil', async () => {
      req.body = {
        userId: 'user123',
        imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        fileName: 'profile.png'
      };

      // Mock Storage Upload
      supabase.storage.from().upload.mockResolvedValue({ data: { path: 'path/to/file' }, error: null });
      
      // Mock Public URL
      supabase.storage.from().getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://supabase.com/avatar.png' } });

      // Mock DB Update
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { id: 'user123', profile_image_url: 'http://supabase.com/avatar.png' }, 
          error: null 
        })
      };
      supabase.from.mockReturnValue(mockChain);

      await uploadProfileImage(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Imagen subida exitosamente',
        imageUrl: 'http://supabase.com/avatar.png'
      }));
    });
  });

  describe('deleteProfileImage', () => {
    test('200 eliminación exitosa de imagen', async () => {
      req.body = { userId: 'user123' };

      // 1. Mock Fetch Current Image
      const fetchChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { profile_image_url: 'http://supabase.com/avatars/profile-images/old.png' }, 
          error: null 
        })
      };
      // 2. Mock DB Update to null
      const updateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { id: 'user123', profile_image_url: null }, 
          error: null 
        })
      };

      supabase.from
        .mockReturnValueOnce(fetchChain)
        .mockReturnValueOnce(updateChain);

      // Mock Storage Remove
      supabase.storage.from().remove.mockResolvedValue({ data: [], error: null });

      await deleteProfileImage(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Imagen eliminada exitosamente'
      }));
      expect(supabase.storage.from().remove).toHaveBeenCalledWith(expect.arrayContaining([expect.stringContaining('old.png')]));
    });
  });
});
