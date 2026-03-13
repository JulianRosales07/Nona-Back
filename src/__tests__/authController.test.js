// Mock de supabase ANTES de importar el controlador
jest.mock('../config/database', () => ({
  from: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/database');
const { register, login } = require('../controllers/authController');

// Helper para crear mocks de req y res
const mockReqRes = (body = {}, params = {}, user = null) => {
  const req = { body, params, user };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return { req, res };
};

// Helper para encadenar llamadas de supabase fluently
const mockSupabaseChain = (finalResult) => {
  const chain = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(finalResult),
    maybeSingle: jest.fn().mockResolvedValue(finalResult),
  };
  return chain;
};

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────────────────────
describe('authController › register', () => {
  afterEach(() => jest.clearAllMocks());

  test('400 si faltan campos requeridos (email, password, role, name)', async () => {
    const { req, res } = mockReqRes({ email: 'a@b.com' }); // faltan password, role, name
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Todos los campos son requeridos' })
    );
  });

  test('400 si el teléfono tiene formato inválido', async () => {
    const { req, res } = mockReqRes({
      email: 'test@test.com',
      password: '123456',
      role: 'cuidador',
      name: 'Test',
      phone: 'abc-invalido',
    });
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'El formato del teléfono no es válido' })
    );
  });

  test('400 si el rol es adulto_mayor y falta fecha de nacimiento', async () => {
    const { req, res } = mockReqRes({
      email: 'adulto@test.com',
      password: '123456',
      role: 'adulto_mayor',
      name: 'Abuela',
      cedula: '123456789',
    });
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'La fecha de nacimiento es requerida para adultos mayores' })
    );
  });

  test('400 si el rol es adulto_mayor y falta la cédula', async () => {
    const { req, res } = mockReqRes({
      email: 'adulto@test.com',
      password: '123456',
      role: 'adulto_mayor',
      name: 'Abuela',
      birthDate: '1950-01-01',
    });
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'La cédula es requerida para adultos mayores' })
    );
  });

  test('400 si el correo ya está registrado', async () => {
    const chain = mockSupabaseChain({ data: { id: 1, email: 'existing@test.com' }, error: null });
    supabase.from.mockReturnValue(chain);

    const { req, res } = mockReqRes({
      email: 'existing@test.com',
      password: '123456',
      role: 'cuidador',
      name: 'Test',
    });
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'El correo electrónico ya está registrado' })
    );
  });

  test('201 registro exitoso de cuidador', async () => {
    // Primera llamada a maybeSingle: usuario no existe
    const noUserChain = mockSupabaseChain({ data: null, error: null });
    // Segunda llamada a single: inserción exitosa
    const insertChain = {
      ...mockSupabaseChain(null),
      single: jest.fn().mockResolvedValue({
        data: { id: 99, email: 'nuevo@test.com', role: 'cuidador', name: 'Nuevo' },
        error: null,
      }),
    };

    supabase.from
      .mockReturnValueOnce(noUserChain)  // check email
      .mockReturnValueOnce(insertChain); // insert

    bcrypt.hash.mockResolvedValue('hashed_password');
    jwt.sign.mockReturnValue('fake_token');

    const { req, res } = mockReqRes({
      email: 'nuevo@test.com',
      password: 'segura123',
      role: 'cuidador',
      name: 'Nuevo',
    });

    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'fake_token' })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────
describe('authController › login', () => {
  afterEach(() => jest.clearAllMocks());

  test('401 si el usuario no existe en la BD', async () => {
    const chain = mockSupabaseChain({ data: null, error: { message: 'not found' } });
    supabase.from.mockReturnValue(chain);

    const { req, res } = mockReqRes({ email: 'noexiste@test.com', password: '123456' });
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Credenciales inválidas' });
  });

  test('401 si la contraseña es incorrecta', async () => {
    const chain = mockSupabaseChain({
      data: { id: 1, email: 'user@test.com', password: 'hashed', role: 'cuidador', name: 'Test' },
      error: null,
    });
    supabase.from.mockReturnValue(chain);
    bcrypt.compare.mockResolvedValue(false);

    const { req, res } = mockReqRes({ email: 'user@test.com', password: 'wrong' });
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Credenciales inválidas' });
  });

  test('200 login exitoso devuelve token y datos de usuario', async () => {
    const fakeUser = {
      id: 1,
      email: 'user@test.com',
      password: 'hashed',
      role: 'cuidador',
      name: 'Test',
      birth_date: null,
      cedula: null,
      profile_image_url: null,
    };
    const chain = mockSupabaseChain({ data: fakeUser, error: null });
    supabase.from.mockReturnValue(chain);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('valid_token');

    const { req, res } = mockReqRes({ email: 'user@test.com', password: 'correcta' });
    await login(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'valid_token', user: expect.objectContaining({ id: 1 }) })
    );
  });
});
