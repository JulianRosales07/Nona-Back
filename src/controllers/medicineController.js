const supabase = require('../config/database');
const { canManagePatientData } = require('../middleware/checkRelationships');

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
        const userId = req.user.userId;
        const userRole = req.user.role;

        console.log('Creating medicine:', { userId, userRole, patientId, name });

        // Verificar permisos usando la nueva lógica
        const permission = await canManagePatientData(userId, parseInt(patientId), userRole);

        if (!permission.allowed) {
            console.log('Permission denied:', permission.reason);
            return res.status(403).json({ message: permission.reason });
        }

        console.log('Permission granted:', permission.reason);

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
        const userId = req.user.userId;
        const userRole = req.user.role;

        // Primero obtener el medicamento para saber el patient_id
        const { data: medicineData, error: medicineError } = await supabase
            .from('medicines')
            .select('patient_id')
            .eq('id', id)
            .single();

        if (medicineError || !medicineData) {
            return res.status(404).json({ message: 'Medicamento no encontrado' });
        }

        // Verificar permisos usando la nueva lógica
        const permission = await canManagePatientData(userId, medicineData.patient_id, userRole);

        if (!permission.allowed) {
            return res.status(403).json({ message: permission.reason });
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
        const userId = req.user.userId;
        const userRole = req.user.role;

        // Primero obtener el medicamento para saber el patient_id
        const { data: medicineData, error: medicineError } = await supabase
            .from('medicines')
            .select('patient_id')
            .eq('id', id)
            .single();

        if (medicineError || !medicineData) {
            return res.status(404).json({ message: 'Medicamento no encontrado' });
        }

        // Verificar permisos usando la nueva lógica
        const permission = await canManagePatientData(userId, medicineData.patient_id, userRole);

        if (!permission.allowed) {
            return res.status(403).json({ message: permission.reason });
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
