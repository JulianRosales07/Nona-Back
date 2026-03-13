const supabase = require('../config/database');

// Registrar una toma de medicamento
const logMedicineTaken = async (req, res) => {
  const { medicine_id, scheduled_time, status, notes } = req.body;
  const patient_id = req.user.userId; // Cambio: usar userId en lugar de id

  try {
    console.log('=== REGISTRANDO TOMA DE MEDICAMENTO ===');
    console.log('Body recibido:', req.body);
    console.log('Usuario autenticado:', req.user);
    console.log('Patient ID extraído:', patient_id);

    if (!patient_id) {
      throw new Error('No se pudo obtener el ID del usuario del token');
    }

    // Preparar datos para insertar
    const insertData = {
      medicine_id: parseInt(medicine_id),
      patient_id: parseInt(patient_id),
      taken_at: new Date().toISOString(),
      scheduled_time: scheduled_time || null,
      status: status || 'taken',
      notes: notes || null
    };

    console.log('Datos preparados:', insertData);

    const { data, error } = await supabase
      .from('medicine_logs')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error de Supabase:', error);
      console.error('Código de error:', error.code);
      console.error('Mensaje:', error.message);
      console.error('Detalles:', error.details);
      throw error;
    }

    console.log('✅ Toma registrada exitosamente:', data);

    res.status(201).json({
      message: 'Toma de medicamento registrada exitosamente',
      log: data
    });
  } catch (error) {
    console.error('❌ Error logging medicine:', error);
    res.status(500).json({ 
      error: 'Error al registrar la toma del medicamento',
      details: error.message,
      code: error.code
    });
  }
};

// Obtener logs de medicamentos de un paciente para un día específico
const getMedicineLogs = async (req, res) => {
  const { patientId } = req.params;
  const { date } = req.query; // Formato: YYYY-MM-DD

  try {
    let query = supabase
      .from('medicine_logs')
      .select(`
        *,
        medicines:medicine_id (
          name,
          dosage,
          time
        )
      `)
      .eq('patient_id', patientId)
      .order('taken_at', { ascending: false });

    if (date) {
      // Filtrar por fecha específica
      const startOfDay = `${date}T00:00:00`;
      const endOfDay = `${date}T23:59:59`;
      query = query.gte('taken_at', startOfDay).lte('taken_at', endOfDay);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Formatear la respuesta para que sea compatible con el frontend
    const formattedData = data.map(log => ({
      ...log,
      medicine_name: log.medicines?.name,
      dosage: log.medicines?.dosage,
      time: log.medicines?.time
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching medicine logs:', error);
    res.status(500).json({ error: 'Error al obtener los registros de medicamentos' });
  }
};

// Obtener estadísticas de medicamentos tomados hoy
const getTodayStats = async (req, res) => {
  const { patientId } = req.params;

  try {
    // Total de medicamentos programados
    const { count: totalMeds, error: totalError } = await supabase
      .from('medicines')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId);

    if (totalError) throw totalError;

    // Medicamentos tomados hoy (únicos)
    const today = new Date().toISOString().split('T')[0];
    const { data: logsToday, error: logsError } = await supabase
      .from('medicine_logs')
      .select('medicine_id')
      .eq('patient_id', patientId)
      .eq('status', 'taken')
      .gte('taken_at', `${today}T00:00:00`)
      .lte('taken_at', `${today}T23:59:59`);

    if (logsError) throw logsError;

    // Contar medicamentos únicos tomados hoy
    const uniqueMedicinesTaken = new Set(logsToday.map(log => log.medicine_id)).size;

    // Calcular racha (simplificado - días consecutivos con al menos una toma)
    // Para una implementación completa, necesitarías una query más compleja
    const { data: recentLogs, error: recentError } = await supabase
      .from('medicine_logs')
      .select('taken_at')
      .eq('patient_id', patientId)
      .eq('status', 'taken')
      .order('taken_at', { ascending: false })
      .limit(100);

    if (recentError) throw recentError;

    // Calcular racha simple
    let streak = 0;
    const dates = new Set();
    for (const log of recentLogs) {
      const logDate = new Date(log.taken_at).toISOString().split('T')[0];
      dates.add(logDate);
    }

    // Contar días consecutivos desde hoy hacia atrás
    const sortedDates = Array.from(dates).sort().reverse();
    const todayDate = new Date().toISOString().split('T')[0];
    
    if (sortedDates.length > 0 && sortedDates[0] === todayDate) {
      streak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i]);
        const previousDate = new Date(sortedDates[i - 1]);
        const diffDays = Math.floor((previousDate - currentDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          streak++;
        } else {
          break;
        }
      }
    }

    res.json({
      total: totalMeds || 0,
      taken: uniqueMedicinesTaken,
      streak: streak
    });
  } catch (error) {
    console.error('Error fetching today stats:', error);
    res.status(500).json({ error: 'Error al obtener las estadísticas' });
  }
};

// Verificar si un medicamento fue tomado hoy
const checkMedicineTakenToday = async (req, res) => {
  const { medicineId, patientId } = req.params;

  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('medicine_logs')
      .select('*')
      .eq('medicine_id', medicineId)
      .eq('patient_id', patientId)
      .gte('taken_at', `${today}T00:00:00`)
      .lte('taken_at', `${today}T23:59:59`)
      .order('taken_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    res.json({
      taken: data && data.length > 0,
      log: data && data.length > 0 ? data[0] : null
    });
  } catch (error) {
    console.error('Error checking medicine taken:', error);
    res.status(500).json({ error: 'Error al verificar el medicamento' });
  }
};

module.exports = {
  logMedicineTaken,
  getMedicineLogs,
  getTodayStats,
  checkMedicineTakenToday
};
