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

  console.log('✅ Scheduler iniciado - verificando medicamentos y citas cada minuto');
}

module.exports = {
  startNotificationScheduler
};
