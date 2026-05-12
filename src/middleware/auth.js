const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  console.log('[AUTH] Header Authorization recibido:', authHeader ? `Bearer ${token?.substring(0, 20)}...` : 'AUSENTE');

  if (!token) {
    console.warn('[AUTH] ❌ Token no proporcionado en la petición');
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log('[AUTH] ✅ Token válido para usuario:', decoded.id || decoded.email || decoded.userId);
    next();
  } catch (error) {
    console.error('[AUTH] ❌ Token inválido:', error.message, '| JWT_SECRET configurado:', process.env.JWT_SECRET ? 'SÍ' : 'NO');
    res.status(401).json({ error: 'Token inválido', details: error.message });
  }
};

// Exportar con ambos nombres para compatibilidad
module.exports = authenticateToken;
module.exports.authenticateToken = authenticateToken;
module.exports.authMiddleware = authenticateToken;
