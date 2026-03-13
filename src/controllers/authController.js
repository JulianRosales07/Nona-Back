const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/database');

const register = async (req, res) => {
  try {
    const { email, password, role, name, birthDate, cedula, phone } = req.body;

    if (!email || !password || !role || !name) {
      return res.status(400).json({
        error: 'Todos los campos son requeridos',
        received: { email: !!email, password: !!password, role: !!role, name: !!name }
      });
    }

    if (phone && !/^\+?[\d\s\-()]+$/.test(phone)) {
      return res.status(400).json({
        error: 'El formato del teléfono no es válido'
      });
    }

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

    const userData = {
      email,
      password: hashedPassword,
      role,
      name
    };

    if (birthDate) {
      userData.birth_date = birthDate;
      console.log('Guardando fecha de nacimiento:', birthDate);
    }
    if (cedula) {
      userData.cedula = cedula;
    }

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

module.exports = { register, login };
