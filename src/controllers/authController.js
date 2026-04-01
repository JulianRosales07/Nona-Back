const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/database');
const crypto = require('crypto');

// Almacenamiento temporal de códigos de recuperación (en producción usar Redis o base de datos)
const resetCodes = new Map();

const register = async (req, res) => {
  try {
    const { email, password, role, name, birthDate, cedula, phone } = req.body;

    // Validar campos requeridos
    if (!email || !password || !role || !name) {
      return res.status(400).json({
        error: 'Todos los campos son requeridos',
        received: { email: !!email, password: !!password, role: !!role, name: !!name }
      });
    }

    // Validar teléfono (opcional pero recomendado)
    if (phone && !/^\+?[\d\s\-()]+$/.test(phone)) {
      return res.status(400).json({
        error: 'El formato del teléfono no es válido'
      });
    }

    // Validar fecha de nacimiento y cédula para adulto mayor
    if (role === 'adulto_mayor' && !birthDate) {
      return res.status(400).json({
        error: 'La fecha de nacimiento es requerida para adultos mayores'
      });
    }

    if (role === 'adulto_mayor' && !cedula) {
      return res.status(400).json({
        error: 'La cédula es requerida para adultos mayores'
      });
    }

    // Verificar si el usuario ya existe por email
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking user:', checkError);
      return res.status(500).json({ error: 'Error al verificar usuario', details: checkError.message });
    }

    if (existingUser) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }

    // Verificar si la cédula ya existe (solo para adulto mayor)
    if (role === 'adulto_mayor' && cedula) {
      const { data: existingCedula, error: cedulaError } = await supabase
        .from('users')
        .select('*')
        .eq('cedula', cedula)
        .maybeSingle();

      if (cedulaError) {
        console.error('Error checking cedula:', cedulaError);
        return res.status(500).json({ error: 'Error al verificar cédula', details: cedulaError.message });
      }

      if (existingCedula) {
        return res.status(400).json({ error: 'La cédula ya está registrada' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Preparar datos para insertar
    const userData = {
      email,
      password: hashedPassword,
      role,
      name
    };

    // Agregar fecha de nacimiento solo si se proporciona
    if (birthDate) {
      userData.birth_date = birthDate;
      console.log('Guardando fecha de nacimiento:', birthDate);
    }

    // Agregar cédula solo si se proporciona
    if (cedula) {
      userData.cedula = cedula;
    }

    // Agregar teléfono solo si se proporciona
    if (phone) {
      userData.phone = phone;
    }

    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select('id, email, role, name, birth_date, cedula, phone, profile_image_url')
      .single();

    if (error) {
      console.error('Error inserting user:', error);
      return res.status(400).json({ error: 'Error al crear usuario', details: error.message });
    }

    const token = jwt.sign(
      { userId: data.id, role: data.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ user: data, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        birth_date: user.birth_date,
        cedula: user.cedula,
        profile_image_url: user.profile_image_url
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'El correo electrónico es requerido' });
    }

    // Verificar si el usuario existe
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .single();

    if (error || !user) {
      // Por seguridad, no revelar si el email existe o no
      return res.json({
        message: 'Si el correo existe, recibirás un código de recuperación'
      });
    }

    // Generar código de 6 dígitos
    const code = crypto.randomInt(100000, 999999).toString();

    // Guardar código con expiración de 15 minutos
    resetCodes.set(email, {
      code,
      expiresAt: Date.now() + 15 * 60 * 1000,
      userId: user.id
    });

    // Enviar email con el código usando Supabase Auth
    try {
      // Nota: Supabase Auth maneja el envío de emails automáticamente
      // Para desarrollo, también logueamos el código
      console.log(`Código de recuperación para ${email}: ${code}`);

      // En producción, aquí enviarías el email con un servicio como SendGrid, AWS SES, etc.
      // Por ahora, retornamos el código en desarrollo
      if (process.env.NODE_ENV === 'development') {
        return res.json({
          message: 'Código enviado',
          code // Solo en desarrollo
        });
      }

      res.json({
        message: 'Si el correo existe, recibirás un código de recuperación'
      });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      res.status(500).json({ error: 'Error al enviar el código' });
    }
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({ error: error.message });
  }
};

const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email y código son requeridos' });
    }

    const resetData = resetCodes.get(email);

    if (!resetData) {
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    if (Date.now() > resetData.expiresAt) {
      resetCodes.delete(email);
      return res.status(400).json({ error: 'El código ha expirado' });
    }

    if (resetData.code !== code) {
      return res.status(400).json({ error: 'Código incorrecto' });
    }

    // Código válido
    res.json({
      message: 'Código verificado correctamente',
      valid: true
    });
  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({ error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        error: 'Email, código y nueva contraseña son requeridos'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const resetData = resetCodes.get(email);

    if (!resetData) {
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    if (Date.now() > resetData.expiresAt) {
      resetCodes.delete(email);
      return res.status(400).json({ error: 'El código ha expirado' });
    }

    if (resetData.code !== code) {
      return res.status(400).json({ error: 'Código incorrecto' });
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña en la base de datos
    const { error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', resetData.userId);

    if (error) {
      console.error('Error updating password:', error);
      return res.status(500).json({ error: 'Error al actualizar la contraseña' });
    }

    // Eliminar el código usado
    resetCodes.delete(email);

    res.json({
      message: 'Contraseña actualizada correctamente'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  register,
  login,
  requestPasswordReset,
  verifyResetCode,
  resetPassword
};
