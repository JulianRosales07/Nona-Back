const jwt = require('jsonwebtoken');
const authenticateToken = require('../middleware/auth');

describe('Middleware › authenticateToken', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    process.env.JWT_SECRET = 'test_secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('401 si el header Authorization no está presente', () => {
    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token no proporcionado' });
  });

  test('401 si el token es inválido', () => {
    req.headers.authorization = 'Bearer token-invalido';
    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido' });
  });

  test('Llama a next() y decodifica el usuario si el token es válido', () => {
    const payload = { userId: 123, role: 'cuidador' };
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    req.headers.authorization = `Bearer ${token}`;

    authenticateToken(req, res, next);

    expect(req.user).toMatchObject(payload);
    expect(next).toHaveBeenCalled();
  });
});
