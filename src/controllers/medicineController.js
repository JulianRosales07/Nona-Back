const supabase = require('../config/database');

// Obtener todos los medicamentos de un paciente
const getPatientMedicines = async (req, res) => {
    try {
        const { patientId } = req.params;
        
        const { data, error } = await supabase
            .from('medicines')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching medicines:', error);
            return res.status(500).json({ message: 'Error al obtener medicamentos' });
        }

        res.json(data || []);
    } catch (error) {
        console.error('Error fetching medicines:', error);
        res.status(500).json({ message: 'Error al obtener medicamentos' });
    }
};

// Crear un nuevo medicamento
const createMedicine = async (req, res) => {
    try {
        const { patientId, name, dosage, frequency, time, notes, imageUrl } = req.body;
        const userId = req.user.userId; // Cambio: usar userId del token
        const userRole = req.user.role;

        console.log('Creating medicine:', { userId, userRole, patientId, name });

        // Verificar que el usuario tiene acceso al paciente
        // Puede ser familiar o cuidador
        const { data: relationData, error: relationError } = await supabase
            .from('user_relationships')
            .select('*')
            .eq('caregiver_id', userId) // Cambio: usar caregiver_id
            .eq('elderly_id', patientId); // Cambio: usar elderly_id

        if (relationError) {
            console.error('Error checking relationship:', relationError);
            return res.status(500).json({ message: 'Error al verificar permisos', details: relationError.message });
        }

        if (!relationData || relationData.length === 0) {
            console.log('No relationship found for user:', userId, 'and patient:', patientId);
            return res.status(403).json({ message: 'No tienes permiso para agregar medicamentos a este paciente' });
        }

        const { data, error } = await supabase
            .from('medicines')
            .insert([{
                patient_id: patientId,
                name,
                dosage,
                frequency,
                time,
                notes,
                image_url: imageUrl,
                added_by: userId
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating medicine:', error);
            return res.status(500).json({ message: 'Error al crear medicamento', details: error.message });
        }

        console.log('Medicine created successfully:', data);
        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating medicine:', error);
        res.status(500).json({ message: 'Error al crear medicamento', details: error.message });
    }
};

// Actualizar un medicamento
const updateMedicine = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, dosage, frequency, time, notes } = req.body;
        const userId = req.user.userId; // Cambio: usar userId del token

        // Primero obtener el medicamento para saber el patient_id
        const { data: medicineData, error: medicineError } = await supabase
            .from('medicines')
            .select('patient_id')
            .eq('id', id)
            .single();

        if (medicineError || !medicineData) {
            return res.status(404).json({ message: 'Medicamento no encontrado' });
        }

        // Verificar que el usuario tiene acceso al paciente
        const { data: relationData, error: relationError } = await supabase
            .from('user_relationships')
            .select('*')
            .eq('caregiver_id', userId) // Cambio: usar caregiver_id
            .eq('elderly_id', medicineData.patient_id); // Cambio: usar elderly_id

        if (relationError || !relationData || relationData.length === 0) {
            return res.status(403).json({ message: 'No tienes permiso para modificar este medicamento' });
        }

        const { data, error } = await supabase
            .from('medicines')
            .update({
                name,
                dosage,
                frequency,
                time,
                notes,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating medicine:', error);
            return res.status(500).json({ message: 'Error al actualizar medicamento' });
        }

        res.json(data);
    } catch (error) {
        console.error('Error updating medicine:', error);
        res.status(500).json({ message: 'Error al actualizar medicamento' });
    }
};

// Eliminar un medicamento
const deleteMedicine = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId; // Cambio: usar userId del token

        // Primero obtener el medicamento para saber el patient_id
        const { data: medicineData, error: medicineError } = await supabase
            .from('medicines')
            .select('patient_id')
            .eq('id', id)
            .single();

        if (medicineError || !medicineData) {
            return res.status(404).json({ message: 'Medicamento no encontrado' });
        }

        // Verificar que el usuario tiene acceso al paciente
        const { data: relationData, error: relationError } = await supabase
            .from('user_relationships')
            .select('*')
            .eq('caregiver_id', userId) // Cambio: usar caregiver_id
            .eq('elderly_id', medicineData.patient_id); // Cambio: usar elderly_id

        if (relationError || !relationData || relationData.length === 0) {
            return res.status(403).json({ message: 'No tienes permiso para eliminar este medicamento' });
        }

        const { error } = await supabase
            .from('medicines')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting medicine:', error);
            return res.status(500).json({ message: 'Error al eliminar medicamento' });
        }

        res.json({ message: 'Medicamento eliminado correctamente' });
    } catch (error) {
        console.error('Error deleting medicine:', error);
        res.status(500).json({ message: 'Error al eliminar medicamento' });
    }
};

module.exports = {
    getPatientMedicines,
    createMedicine,
    updateMedicine,
    deleteMedicine
};
