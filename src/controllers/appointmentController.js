const supabase = require('../config/database');
const { canManagePatientData } = require('../middleware/checkRelationships');

// Crear una nueva cita
const createAppointment = async (req, res) => {
    try {
        const {
            patient_id,
            doctor_name,
            specialty,
            appointment_date,
            appointment_time,
            location,
            notes
        } = req.body;

        const created_by = req.user.userId; // Usar userId del token
        const userRole = req.user.role;

        // Validar campos requeridos
        if (!patient_id || !doctor_name || !specialty || !appointment_date || !appointment_time || !location) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos obligatorios deben ser proporcionados'
            });
        }

        // Verificar permisos usando la nueva lógica
        const permission = await canManagePatientData(req.user.userId, parseInt(patient_id), userRole);

        if (!permission.allowed) {
            console.log('Permission denied:', permission.reason);
            return res.status(403).json({
                success: false,
                message: permission.reason
            });
        }

        console.log('Permission granted for appointment creation:', permission.reason);

        const { data: result, error } = await supabase
            .from('appointments')
            .insert([{
                patient_id,
                created_by,
                doctor_name,
                specialty,
                appointment_date,
                appointment_time,
                location,
                notes
            }])
            .select();

        if (error) {
            throw error;
        }

        res.status(201).json({
            success: true,
            message: 'Cita creada exitosamente',
            appointment: result[0]
        });
    } catch (error) {
        console.error('Error al crear cita:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear la cita',
            error: error.message
        });
    }
};

// Obtener todas las citas de un paciente
const getPatientAppointments = async (req, res) => {
    try {
        const { patientId } = req.params;

        // Verificar que el usuario tenga permiso para ver las citas
        if (req.user.userId !== parseInt(patientId)) {
            const { data: relationships, error: relError } = await supabase
                .from('user_relationships')
                .select('id')
                .eq('elderly_id', patientId)
                .eq('caregiver_id', req.user.userId)
                .eq('status', 'active');

            if (relError || !relationships || relationships.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para ver las citas de este paciente'
                });
            }
        }

        const { data: appointments, error } = await supabase
            .from('appointments')
            .select(`
                *,
                created_by_user:users!created_by(name, role)
            `)
            .eq('patient_id', patientId)
            .order('appointment_date', { ascending: true })
            .order('appointment_time', { ascending: true });

        if (error) {
            throw error;
        }

        // Formatear los datos para que coincidan con la estructura esperada
        const formattedAppointments = appointments.map(apt => ({
            ...apt,
            created_by_name: apt.created_by_user?.name,
            created_by_role: apt.created_by_user?.role
        }));

        res.json({
            success: true,
            appointments: formattedAppointments
        });
    } catch (error) {
        console.error('Error al obtener citas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las citas',
            error: error.message
        });
    }
};

// Obtener una cita específica
const getAppointmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: appointments, error } = await supabase
            .from('appointments')
            .select(`
                *,
                created_by_user:users!created_by(name, role)
            `)
            .eq('id', id)
            .single();

        if (error || !appointments) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }

        const appointment = {
            ...appointments,
            created_by_name: appointments.created_by_user?.name,
            created_by_role: appointments.created_by_user?.role
        };

        // Verificar permisos
        if (req.user.userId !== appointment.patient_id) {
            const { data: relationships, error: relError } = await supabase
                .from('user_relationships')
                .select('id')
                .eq('elderly_id', appointment.patient_id)
                .eq('caregiver_id', req.user.userId)
                .eq('status', 'active');

            if (relError || !relationships || relationships.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para ver esta cita'
                });
            }
        }

        res.json({
            success: true,
            appointment
        });
    } catch (error) {
        console.error('Error al obtener cita:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la cita',
            error: error.message
        });
    }
};

// Actualizar una cita
const updateAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            doctor_name,
            specialty,
            appointment_date,
            appointment_time,
            location,
            notes,
            status
        } = req.body;

        const userId = req.user.userId;
        const userRole = req.user.role;

        // Verificar que la cita existe y obtener el patient_id
        const { data: existingAppointment, error: fetchError } = await supabase
            .from('appointments')
            .select('patient_id, created_by')
            .eq('id', id)
            .single();

        if (fetchError || !existingAppointment) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }

        const { patient_id } = existingAppointment;

        // Verificar permisos usando la nueva lógica
        const permission = await canManagePatientData(userId, patient_id, userRole);

        if (!permission.allowed) {
            return res.status(403).json({
                success: false,
                message: permission.reason
            });
        }

        // Preparar datos de actualización
        const updateData = {};
        if (doctor_name !== undefined) updateData.doctor_name = doctor_name;
        if (specialty !== undefined) updateData.specialty = specialty;
        if (appointment_date !== undefined) updateData.appointment_date = appointment_date;
        if (appointment_time !== undefined) updateData.appointment_time = appointment_time;
        if (location !== undefined) updateData.location = location;
        if (notes !== undefined) updateData.notes = notes;
        if (status !== undefined) updateData.status = status;
        updateData.updated_at = new Date().toISOString();

        const { data: result, error } = await supabase
            .from('appointments')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            message: 'Cita actualizada exitosamente',
            appointment: result
        });
    } catch (error) {
        console.error('Error al actualizar cita:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la cita',
            error: error.message
        });
    }
};

// Eliminar una cita
const deleteAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        // Verificar que la cita existe
        const { data: existingAppointment, error: fetchError } = await supabase
            .from('appointments')
            .select('patient_id, created_by')
            .eq('id', id)
            .single();

        if (fetchError || !existingAppointment) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }

        const { patient_id } = existingAppointment;

        // Verificar permisos usando la nueva lógica
        const permission = await canManagePatientData(userId, patient_id, userRole);

        if (!permission.allowed) {
            return res.status(403).json({
                success: false,
                message: permission.reason
            });
        }

        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            message: 'Cita eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar cita:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la cita',
            error: error.message
        });
    }
};

// Cambiar el estado de una cita
const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido'
            });
        }

        const { data: result, error } = await supabase
            .from('appointments')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error || !result) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Estado actualizado exitosamente',
            appointment: result
        });
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el estado',
            error: error.message
        });
    }
};

module.exports = {
    createAppointment,
    getPatientAppointments,
    getAppointmentById,
    updateAppointment,
    deleteAppointment,
    updateAppointmentStatus
};
