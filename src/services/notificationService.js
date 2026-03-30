const { Expo } = require('expo-server-sdk');
const supabase = require('../config/database');

// Crear una instancia de Expo
const expo = new Expo();

/**
 * Enviar notificación push a un usuario específico
 */
async function sendPushNotification(userId, title, body, data = {}) {
  try {
    // Obtener tokens activos del usuario
    const { data: tokens, error } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;

    if (!tokens || tokens.length === 0) {
      console.log(`No hay tokens activos para el usuario ${userId}`);
      return { success: false, message: 'No tokens found' };
    }

    // Preparar mensajes
    const messages = [];
    for (const tokenData of tokens) {
      const pushToken = tokenData.token;

      // Verificar que el token sea válido
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Token inválido: ${pushToken}`);
        continue;
      }

      messages.push({
        to: pushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data,
        priority: 'high',
        channelId: 'medicine-reminders'
      });
    }

    if (messages.length === 0) {
      return { success: false, message: 'No valid tokens' };
    }

    // Enviar notificaciones en lotes
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error enviando chunk de notificaciones:', error);
      }
    }

    console.log(`✅ Notificaciones enviadas a usuario ${userId}:`, tickets.length);
    return { success: true, tickets };

  } catch (error) {
    console.error('Error en sendPushNotification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Enviar notificación a múltiples usuarios
 */
async function sendPushNotificationToMultipleUsers(userIds, title, body, data = {}) {
  const results = [];

  for (const userId of userIds) {
    const result = await sendPushNotification(userId, title, body, data);
    results.push({ userId, ...result });
  }

  return results;
}

/**
 * Enviar recordatorio de medicamento al paciente y sus cuidadores
 */
async function sendMedicineReminder(patientId, medicineName, medicineTime) {
  try {
    const userIds = [patientId];

    // Obtener cuidadores y familiares del paciente
    const { data: relationships, error } = await supabase
      .from('user_relationships')
      .select('caregiver_id')
      .eq('elderly_id', patientId)
      .eq('status', 'active');

    if (!error && relationships) {
      relationships.forEach(rel => userIds.push(rel.caregiver_id));
    }

    // Enviar notificaciones
    const title = '💊 Recordatorio de Medicamento';
    const body = `En 10 minutos: ${medicineName} (${medicineTime})`;
    const data = {
      type: 'medicine_reminder',
      patientId,
      medicineName,
      medicineTime,
      minutesBefore: 10
    };

    const results = await sendPushNotificationToMultipleUsers(userIds, title, body, data);

    console.log(`📬 Recordatorio enviado para ${medicineName}:`, results.length, 'usuarios');
    return results;

  } catch (error) {
    console.error('Error en sendMedicineReminder:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verificar y enviar recordatorios de medicamentos programados
 * Envía notificaciones 10 minutos antes de la hora programada
 */
async function checkAndSendMedicineReminders() {
  try {
    console.log('🔍 Verificando medicamentos programados...');

    // Obtener todos los medicamentos con horario
    const { data: medicines, error } = await supabase
      .from('medicines')
      .select(`
        id,
        name,
        time,
        patient_id,
        users:patient_id (
          name,
          email
        )
      `)
      .not('time', 'is', null);

    if (error) throw error;

    const now = new Date();
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    console.log(`⏰ Hora actual: ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);

    let sentCount = 0;

    for (const medicine of medicines) {
      // Parsear el horario del medicamento (puede estar en varios formatos)
      const medicineTime = parseMedicineTime(medicine.time);

      if (!medicineTime) continue;

      // Calcular la hora de notificación (10 minutos antes)
      const [medHour, medMinute] = medicineTime.split(':').map(Number);
      const medicineTotalMinutes = medHour * 60 + medMinute;
      let notificationTotalMinutes = medicineTotalMinutes - 10;
      if (notificationTotalMinutes < 0) notificationTotalMinutes += 1440; // Wrap al día anterior

      // Comparar con un margen de ±1 minuto para no perder notificaciones
      const diff = Math.abs(currentTotalMinutes - notificationTotalMinutes);
      const isTimeToNotify = diff <= 1 || diff >= 1439; // También cubre el wrap de medianoche

      const notificationHour = Math.floor(notificationTotalMinutes / 60);
      const notificationMinute = notificationTotalMinutes % 60;
      console.log(`📋 ${medicine.name}: Hora programada ${medicineTime}, notificación ${notificationHour.toString().padStart(2, '0')}:${notificationMinute.toString().padStart(2, '0')}`);

      if (isTimeToNotify) {
        // Verificar si ya se tomó hoy
        const today = new Date().toISOString().split('T')[0];
        const { data: logs } = await supabase
          .from('medicine_logs')
          .select('id')
          .eq('medicine_id', medicine.id)
          .eq('patient_id', medicine.patient_id)
          .gte('taken_at', `${today}T00:00:00`)
          .lte('taken_at', `${today}T23:59:59`)
          .limit(1);

        if (!logs || logs.length === 0) {
          // No se ha tomado, enviar recordatorio
          await sendMedicineReminder(
            medicine.patient_id,
            medicine.name,
            medicine.time
          );
          sentCount++;
          console.log(`✅ Recordatorio enviado para ${medicine.name}`);
        } else {
          console.log(`⏭️  ${medicine.name} ya fue tomado hoy`);
        }
      }
    }

    console.log(`📬 Total de recordatorios enviados: ${sentCount}`);
    return { success: true, sent: sentCount };

  } catch (error) {
    console.error('Error en checkAndSendMedicineReminders:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Parsear tiempo del medicamento a formato HH:MM
 */
function parseMedicineTime(timeString) {
  if (!timeString) return null;

  // Intentar extraer HH:MM del string
  const timeMatch = timeString.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const hour = parseInt(timeMatch[1]);
    const minute = parseInt(timeMatch[2]);

    // Manejar formato 12 horas (AM/PM)
    if (timeString.toLowerCase().includes('pm') && hour < 12) {
      return `${(hour + 12).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }
    if (timeString.toLowerCase().includes('am') && hour === 12) {
      return `00:${minute.toString().padStart(2, '0')}`;
    }

    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  return null;
}

/**
 * Verificar y enviar recordatorios de citas programadas
 * Envía notificaciones 30 minutos antes de la hora de la cita
 */
async function checkAndSendAppointmentReminders() {
  try {
    console.log('🔍 Verificando citas programadas...');

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    // Obtener citas de hoy que no estén canceladas
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('id, title, date, time, patient_id, doctor_name')
      .eq('date', today)
      .neq('status', 'cancelled');

    if (error) throw error;
    if (!appointments || appointments.length === 0) {
      console.log('📅 No hay citas para hoy');
      return { success: true, sent: 0 };
    }

    let sentCount = 0;

    for (const appointment of appointments) {
      if (!appointment.time) continue;

      const timeMatch = appointment.time.match(/(\d{1,2}):(\d{2})/);
      if (!timeMatch) continue;

      const appointmentTotalMinutes = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
      // Notificar 30 minutos antes
      let notifyAt = appointmentTotalMinutes - 30;
      if (notifyAt < 0) notifyAt += 1440;

      const diff = Math.abs(currentTotalMinutes - notifyAt);
      const isTimeToNotify = diff <= 1 || diff >= 1439;

      if (isTimeToNotify) {
        const title = '📅 Recordatorio de Cita';
        const doctorInfo = appointment.doctor_name ? ` con ${appointment.doctor_name}` : '';
        const body = `En 30 minutos: ${appointment.title || 'Cita médica'}${doctorInfo} (${appointment.time})`;

        const userIds = [appointment.patient_id];

        // También notificar a cuidadores/familiares
        const { data: relationships } = await supabase
          .from('user_relationships')
          .select('caregiver_id')
          .eq('elderly_id', appointment.patient_id)
          .eq('status', 'active');

        if (relationships) {
          relationships.forEach(rel => userIds.push(rel.caregiver_id));
        }

        await sendPushNotificationToMultipleUsers(userIds, title, body, {
          type: 'appointment_reminder',
          appointmentId: appointment.id,
        });

        sentCount++;
        console.log(`✅ Recordatorio de cita enviado: ${appointment.title}`);
      }
    }

    console.log(`📅 Total recordatorios de citas enviados: ${sentCount}`);
    return { success: true, sent: sentCount };

  } catch (error) {
    console.error('Error en checkAndSendAppointmentReminders:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendPushNotification,
  sendPushNotificationToMultipleUsers,
  sendMedicineReminder,
  checkAndSendMedicineReminders,
  checkAndSendAppointmentReminders
};
