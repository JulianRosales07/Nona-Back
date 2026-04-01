const cron = require('node-cron');
const { checkAndSendMedicineReminders, checkAndSendAppointmentReminders } = require('./notificationService');

/**
 * Iniciar el scheduler de notificaciones
 * Se ejecuta cada minuto para verificar si hay medicamentos o citas programadas
 */
function startNotificationScheduler() {
  console.log('🚀 Iniciando scheduler de notificaciones...');

  // Ejecutar cada minuto
  cron.schedule('* * * * *', async () => {
    try {
      await Promise.all([
        checkAndSendMedicineReminders(),
        checkAndSendAppointmentReminders()
      ]);
    } catch (error) {
      console.error('Error en scheduler:', error);
    }
  });

  // Self-ping para evitar cold starts (ej. en Render/Heroku)
  // Hace una petición a sí mismo cada 14 minutos para mantener la API activa
  cron.schedule('*/14 * * * *', async () => {
    // Usamos RENDER_EXTERNAL_URL de Render, SERVER_URL, o localhost
    const url = process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3000}`;
    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) {
        console.log(`⚡ [Self-Ping] Mantenimiento activo exitoso (${url}/api/health)`);
      }
    } catch (error) {
      console.error(`❌ [Self-Ping] Error falló el ping a ${url}:`, error.message);
    }
  });

  console.log('✅ Scheduler iniciado - verificando medicamentos, citas cada minuto y self-ping cada 14 mins');
}

module.exports = {
  startNotificationScheduler
};
