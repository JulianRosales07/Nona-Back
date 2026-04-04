const supabase = require('../config/database');

// Registrar o actualizar un token de push notification
const registerPushToken = async (req, res) => {
  const { token, device_type, device_name } = req.body;
  const user_id = req.user.userId;

  try {
    console.log('Registrando push token:', { user_id, token, device_type });

    // Verificar si el token ya existe
    const { data: existing, error: checkError } = await supabase
      .from('push_tokens')
      .select('*')
      .eq('user_id', user_id)
      .eq('token', token)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw checkError;
    }

    if (existing) {
      // Actualizar token existente
      const { data, error } = await supabase
        .from('push_tokens')
        .update({
          is_active: true,
          device_type,
          device_name,
          last_used_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;

      return res.json({
        message: 'Token actualizado exitosamente',
        token: data
      });
    }

    // Insertar nuevo token
    const { data, error } = await supabase
      .from('push_tokens')
      .insert({
        user_id,
        token,
        device_type,
        device_name,
        is_active: true,
        last_used_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Token registrado exitosamente',
      token: data
    });
  } catch (error) {
    console.error('Error registering push token:', error);
    res.status(500).json({ error: 'Error al registrar el token' });
  }
};

// Desactivar un token (cuando el usuario cierra sesión o desinstala)
const deactivatePushToken = async (req, res) => {
  const { token } = req.body;
  const user_id = req.user.userId;

  try {
    const { data, error } = await supabase
      .from('push_tokens')
      .update({ is_active: false })
      .eq('user_id', user_id)
      .eq('token', token)
      .select();

    if (error) throw error;

    res.json({
      message: 'Token desactivado exitosamente',
      count: data.length
    });
  } catch (error) {
    console.error('Error deactivating push token:', error);
    res.status(500).json({ error: 'Error al desactivar el token' });
  }
};

// Obtener tokens activos de un usuario
const getUserTokens = async (req, res) => {
  const { userId } = req.params;

  try {
    const { data, error } = await supabase
      .from('push_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    res.status(500).json({ error: 'Error al obtener los tokens' });
  }
};

// Enviar una notificación de prueba al usuario actual
const testPushNotification = async (req, res) => {
  const user_id = req.user.userId;
  const { sendPushNotification } = require('../services/notificationService');

  try {
    console.log(`Enviando notificación de prueba al usuario ${user_id}`);
    
    const result = await sendPushNotification(
      user_id,
      '🧪 Prueba de Nona',
      '¡Genial! Las notificaciones están funcionando correctamente en tu dispositivo.',
      { type: 'test_notification', sent_at: new Date().toISOString() }
    );

    if (!result.success) {
      return res.status(400).json({ 
        error: 'No se pudo enviar la notificación', 
        details: result.message 
      });
    }

    res.json({ message: 'Notificación de prueba enviada', result });
  } catch (error) {
    console.error('Error in testPushNotification:', error);
    res.status(500).json({ error: 'Error interno al enviar prueba' });
  }
};

module.exports = {
  registerPushToken,
  deactivatePushToken,
  getUserTokens,
  testPushNotification
};
