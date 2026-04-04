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

        // ALIMENTAR LA BASE DE DATOS GLOBAL (drug_database)
        try {
            const { data: existingDrug } = await supabase
                .from('drug_database')
                .select('id')
                .ilike('name', name)
                .maybeSingle();

            if (!existingDrug) {
                console.log('New drug detected, feeding drug_database:', name);
                await supabase
                    .from('drug_database')
                    .insert([{
                        name: name,
                        strength: dosage,
                        description: notes || 'Agregado por usuario',
                        generic_name: name
                    }]);
            }
        } catch (dbError) {
            console.error('Error feeding drug_database (non-critical):', dbError.message);
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

        // ALIMENTAR LA BASE DE DATOS GLOBAL (drug_database) al actualizar
        if (name) {
            try {
                const { data: existingDrug } = await supabase
                    .from('drug_database')
                    .select('id')
                    .ilike('name', name)
                    .maybeSingle();

                if (!existingDrug) {
                    console.log('New drug detected on update, feeding drug_database:', name);
                    await supabase
                        .from('drug_database')
                        .insert([{
                            name: name,
                            strength: dosage || '',
                            description: notes || 'Actualizado por usuario',
                            generic_name: name
                        }]);
                }
            } catch (dbError) {
                console.error('Error feeding drug_database (non-critical):', dbError.message);
            }
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

// Obtener TODOS los medicamentos de todo el sistema (Para Admin)
const getAllMedicines = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('medicines')
            .select(`
                *,
                users!medicines_patient_id_fkey(name, email)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching all medicines:', error);
            return res.status(500).json({ message: 'Error al obtener todos los medicamentos' });
        }

        res.json(data || []);
    } catch (error) {
        console.error('Error fetching all medicines:', error);
        res.status(500).json({ message: 'Error al obtener todos los medicamentos' });
    }
};

// Buscar medicamentos en la base de datos de medicamentos (drug_database)
const searchDrugDatabase = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim().length < 2) {
            return res.json([]);
        }

        const searchTerm = q.trim().toLowerCase();

        // Intentar buscar en la tabla drug_database de Supabase
        const { data, error } = await supabase
            .from('drug_database')
            .select('id, name, generic_name, dosage_form, strength, manufacturer, description, contraindications, side_effects')
            .or(`name.ilike.%${searchTerm}%,generic_name.ilike.%${searchTerm}%`)
            .limit(20);

        if (!error && data && data.length > 0) {
            return res.json(data);
        }

        // Fallback: lista de medicamentos comunes si no existe la tabla o no hay resultados
        const commonMedicines = [
            { id: 'f1', name: 'Losartán', generic_name: 'Losartán Potásico', dosage_form: 'Comprimido', strength: '50 mg', description: 'Antihipertensivo. Bloqueador de los receptores AT1 de angiotensina II.', contraindications: 'Hipersensibilidad, embarazo.', side_effects: 'Mareos, hiperpotasemia, elevación de creatinina.' },
            { id: 'f2', name: 'Metformina', generic_name: 'Metformina HCl', dosage_form: 'Comprimido', strength: '850 mg', description: 'Antidiabético oral. Reduce la producción hepática de glucosa.', contraindications: 'Insuficiencia renal severa, alcoholismo.', side_effects: 'Náuseas, diarrea, dolor abdominal.' },
            { id: 'f3', name: 'Atorvastatina', generic_name: 'Atorvastatina Cálcica', dosage_form: 'Comprimido', strength: '20 mg', description: 'Hipolipemiante. Inhibe la HMG-CoA reductasa.', contraindications: 'Enfermedad hepática activa, embarazo.', side_effects: 'Mialgia, elevación de transaminasas.' },
            { id: 'f4', name: 'Omeprazol', generic_name: 'Omeprazol', dosage_form: 'Cápsula', strength: '20 mg', description: 'Inhibidor de la bomba de protones. Reduce la secreción de ácido gástrico.', contraindications: 'Hipersensibilidad a benzimidazoles.', side_effects: 'Cefalea, diarrea, náuseas.' },
            { id: 'f5', name: 'Amlodipino', generic_name: 'Amlodipino Besilato', dosage_form: 'Comprimido', strength: '5 mg', description: 'Antihipertensivo, antianginoso. Bloqueador de canales de calcio.', contraindications: 'Shock cardiogénico, estenosis aórtica severa.', side_effects: 'Edema periférico, rubor, cefalea.' },
            { id: 'f6', name: 'Aspirina', generic_name: 'Ácido Acetilsalicílico', dosage_form: 'Comprimido', strength: '100 mg', description: 'Antiagregante plaquetario. Prevención de eventos cardiovasculares.', contraindications: 'Úlcera péptica activa, alergia a AINEs.', side_effects: 'Sangrado gastrointestinal, tinnitus.' },
            { id: 'f7', name: 'Levotiroxina', generic_name: 'Levotiroxina Sódica', dosage_form: 'Comprimido', strength: '50 mcg', description: 'Hormona tiroidea. Tratamiento del hipotiroidismo.', contraindications: 'Hipertiroidismo no tratado, insuficiencia suprarrenal.', side_effects: 'Palpitaciones, insomnio, pérdida de peso.' },
            { id: 'f8', name: 'Furosemida', generic_name: 'Furosemida', dosage_form: 'Comprimido', strength: '40 mg', description: 'Diurético de asa. Reduce la retención de líquidos.', contraindications: 'Anuria, hipersensibilidad a sulfonamidas.', side_effects: 'Hipopotasemia, deshidratación, hipotensión.' },
            { id: 'f9', name: 'Metoprolol', generic_name: 'Succinato de Metoprolol', dosage_form: 'Comprimido', strength: '50 mg', description: 'Betabloqueante cardioselectivo. Tratamiento de hipertensión y angina.', contraindications: 'Bradicardia severa, bloqueo AV grado 2-3.', side_effects: 'Bradicardia, fatiga, frialdad de extremidades.' },
            { id: 'f10', name: 'Warfarina', generic_name: 'Warfarina Sódica', dosage_form: 'Comprimido', strength: '5 mg', description: 'Anticoagulante oral. Prevención de tromboembolismo.', contraindications: 'Sangrado activo, embarazo, hemofilia.', side_effects: 'Hemorragias, hematomas, sangrado prolongado.' },
            { id: 'f11', name: 'Glibenclamida', generic_name: 'Glibenclamida', dosage_form: 'Comprimido', strength: '5 mg', description: 'Hipoglucemiante oral. Estimula la secreción de insulina.', contraindications: 'Diabetes tipo 1, insuficiencia renal/hepática severa.', side_effects: 'Hipoglucemia, náuseas, aumento de peso.' },
            { id: 'f12', name: 'Calcio + Vitamina D3', generic_name: 'Carbonato de Calcio + Colecalciferol', dosage_form: 'Comprimido masticable', strength: '500 mg / 200 UI', description: 'Suplemento. Prevención y tratamiento de deficiencias de calcio.', contraindications: 'Hipercalcemia, urolitiasis cálcica grave.', side_effects: 'Estreñimiento, distensión abdominal.' },
            { id: 'f13', name: 'Alprazolam', generic_name: 'Alprazolam', dosage_form: 'Comprimido', strength: '0.5 mg', description: 'Ansiolítico benzodiacepínico. Tratamiento de trastornos de ansiedad.', contraindications: 'Glaucoma de ángulo cerrado, miastenia gravis.', side_effects: 'Somnolencia, dependencia, deterioro cognitivo.' },
            { id: 'f14', name: 'Tramadol', generic_name: 'Clorhidrato de Tramadol', dosage_form: 'Cápsula', strength: '50 mg', description: 'Analgésico opiáceo de acción central para dolor moderado a severo.', contraindications: 'Epilepsia no controlada, uso de IMAO.', side_effects: 'Náuseas, estreñimiento, mareos, somnolencia.' },
            { id: 'f15', name: 'Pantoprazol', generic_name: 'Pantoprazol Sódico', dosage_form: 'Comprimido', strength: '40 mg', description: 'Inhibidor de la bomba de protones. Tratamiento de ERGE y úlceras.', contraindications: 'Hipersensibilidad a benzimidazoles.', side_effects: 'Cefalea, diarrea, hipomagnesemia prolongada.' },
            { id: 'f16', name: 'Enalapril', generic_name: 'Maleato de Enalapril', dosage_form: 'Comprimido', strength: '10 mg', description: 'IECA. Antihipertensivo y protector renal.', contraindications: 'Angioedema hereditario, embarazo (2do-3er trim.).', side_effects: 'Tos seca persistente, hiperpotasemia, hipotensión.' },
            { id: 'f17', name: 'Ibuprofeno', generic_name: 'Ibuprofeno', dosage_form: 'Comprimido', strength: '400 mg', description: 'AINE. Analgésico, antipirético y antiinflamatorio.', contraindications: 'Úlcera péptica activa, insuficiencia renal severa.', side_effects: 'Dispepsia, sangrado GI, retención de líquidos.' },
            { id: 'f18', name: 'Paracetamol', generic_name: 'Acetaminofén', dosage_form: 'Comprimido', strength: '500 mg', description: 'Analgésico y antipirético. Primera línea para dolor leve-moderado.', contraindications: 'Insuficiencia hepática severa, alcoholismo crónico.', side_effects: 'Raramente hepatotoxicidad a dosis altas.' },
            { id: 'f19', name: 'Prednisona', generic_name: 'Prednisona', dosage_form: 'Comprimido', strength: '10 mg', description: 'Corticosteroide. Antiinflamatorio e inmunosupresor.', contraindications: 'Infecciones sistémicas no tratadas.', side_effects: 'Hiperglucemia, osteoporosis, retención de líquidos.' },
            { id: 'f20', name: 'Clonazepam', generic_name: 'Clonazepam', dosage_form: 'Comprimido', strength: '0.5 mg', description: 'Benzodiacepina. Antiepiléptico y ansiolítico.', contraindications: 'Miastenia gravis, insuficiencia hepática severa.', side_effects: 'Somnolencia, ataxia, problemas de memoria.' },
        ];

        const filtered = commonMedicines.filter(m =>
            m.name.toLowerCase().includes(searchTerm) ||
            m.generic_name.toLowerCase().includes(searchTerm)
        );

        res.json(filtered);
    } catch (error) {
        console.error('Error searching drug database:', error);
        res.status(500).json({ message: 'Error al buscar medicamentos' });
    }
};

module.exports = {
    getPatientMedicines,
    getAllMedicines,
    createMedicine,
    updateMedicine,
    deleteMedicine,
    searchDrugDatabase
};
