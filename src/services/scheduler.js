const cron = require('node-cron');
const { checkAndSendMedicineReminders } = require('./notificationService');

/**
 * Iniciar el scheduler de notificaciones
 * Se ejecuta cada minuto para verificar si hay medicamentos programados
 */
function startNotificationScheduler() {
  console.log('🚀 Iniciando scheduler de notificaciones...');

  // Ejecutar cada minuto
  cron.schedule('* * * * *', async () => {
    try {
      await checkAndSendMedicineReminders();
    } catch (error) {
      console.error('Error en scheduler:', error);
    }
  });

  console.log('✅ Scheduler iniciado - verificando cada minuto');
}

module.exports = {
  startNotificationScheduler
};
