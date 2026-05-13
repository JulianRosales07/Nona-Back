const supabase = require('../config/database');
const { canManagePatientData } = require('../middleware/checkRelationships');

const XLSX = require('xlsx');

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
        const { patientId, name, dosage, frequency, time, notes, drugId } = req.body;
        const imageUrl = req.body.imageUrl || req.body.image_url;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const isAdmin = ['admin', 'Admin'].includes(userRole);

        console.log('Creating medicine:', { userId, userRole, patientId, name });

        // Si es admin y no hay patientId, estamos creando en el catálogo global
        if (isAdmin && !patientId) {
            const { data, error } = await supabase
                .from('drug_database')
                .insert([{
                    name: name,
                    image_url: imageUrl,
                    description: 'Agregado por administrador'
                }])
                .select()
                .single();

            if (error) {
                console.error('Error creating global medicine:', error);
                return res.status(500).json({ message: 'Error al crear medicamento en catálogo', details: error.message });
            }
            return res.status(201).json(data);
        }


        console.log('Creating medicine:', { userId, userRole, patientId, name });

        // El admin puede crear medicamentos sin patient_id asociado
        if (!isAdmin && !patientId) {
            return res.status(400).json({ message: 'El campo patientId es requerido' });
        }

        // Verificar permisos usando la nueva lógica
        const permission = await canManagePatientData(userId, patientId ? parseInt(patientId) : null, userRole);

        if (!permission.allowed) {
            console.log('Permission denied:', permission.reason);
            return res.status(403).json({ message: permission.reason });
        }

        console.log('Permission granted:', permission.reason);

        let finalDrugId = drugId;

        // ALIMENTAR LA BASE DE DATOS GLOBAL (drug_database)
        try {
            const { data: existingDrug } = await supabase
                .from('drug_database')
                .select('id, image_url')
                .ilike('name', name)
                .maybeSingle();

            if (!existingDrug) {
                console.log('New drug detected, feeding drug_database:', name);
                const { data: newDbDrug, error: dbInsError } = await supabase
                    .from('drug_database')
                    .insert([{
                        name: name,
                        strength: dosage,
                        description: notes || 'Agregado por usuario',
                        generic_name: name,
                        image_url: imageUrl // Guardar imagen también en la base global
                    }])
                    .select('id')
                    .single();
                
                if (!dbInsError && newDbDrug) {
                    finalDrugId = newDbDrug.id;
                }
            } else {
                finalDrugId = existingDrug.id;
                // Si ya existe pero no tiene imagen y ahora sí enviamos una, la actualizamos globalmente
                if (imageUrl && !existingDrug.image_url) {
                    await supabase
                        .from('drug_database')
                        .update({ image_url: imageUrl })
                        .eq('id', existingDrug.id);
                }
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
                added_by: userId,
                drug_id: finalDrugId // Guardar la relación formal
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
        const { name, dosage, frequency, time, notes, drugId } = req.body;
        const imageUrl = req.body.imageUrl || req.body.image_url;
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
        let finalDrugId = req.body.drugId;
        if (name) {
            try {
                const { data: existingDrug } = await supabase
                    .from('drug_database')
                    .select('id, image_url')
                    .ilike('name', name)
                    .maybeSingle();

                if (!existingDrug) {
                    const { data: newDbDrug, error: dbInsError } = await supabase
                        .from('drug_database')
                        .insert([{
                            name: name,
                            strength: dosage || '',
                            description: notes || 'Actualizado por usuario',
                            generic_name: name,
                            image_url: imageUrl || null
                        }])
                        .select('id')
                        .single();
                    if (!dbInsError && newDbDrug) finalDrugId = newDbDrug.id;
                } else {
                    finalDrugId = existingDrug.id;
                    if (imageUrl && !existingDrug.image_url) {
                        await supabase
                            .from('drug_database')
                            .update({ image_url: imageUrl })
                            .eq('id', existingDrug.id);
                    }
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
                image_url: imageUrl,
                drug_id: finalDrugId,
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

// Obtener TODOS los medicamentos del catálogo global (Para Admin)
const getAllMedicines = async (req, res) => {
    try {
        // Obtenemos del catálogo global (drug_database) para que no dependa de relaciones
        const { data, error } = await supabase
            .from('drug_database')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching all medicines from catalog:', error);
            return res.status(500).json({ message: 'Error al obtener el catálogo de medicamentos' });
        }

        res.json(data || []);
    } catch (error) {
        console.error('Error fetching all medicines:', error);
        res.status(500).json({ message: 'Error al obtener los medicamentos' });
    }
};

// Descargar plantilla de Excel
const downloadMedicineTemplate = async (req, res) => {
    try {
        const workbook = XLSX.utils.book_new();
        const data = [
            ['nombre', 'imagen_url'],
            ['Acetaminofén', 'https://ejemplo.com/acetaminofen.jpg'],
            ['Ibuprofeno', 'https://ejemplo.com/ibuprofeno.jpg']
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Medicamentos');
        
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=plantilla_medicamentos.xlsx');
        res.send(buffer);
    } catch (error) {
        console.error('Error generating template:', error);
        res.status(500).json({ message: 'Error al generar la plantilla' });
    }
};

// Importar medicamentos desde Excel
const importMedicinesExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ningún archivo' });
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return res.status(400).json({ message: 'El archivo está vacío' });
        }

        const medicinesToInsert = data.map(row => ({
            name: row.nombre || row.Nombre,
            image_url: row.imagen_url || row.Imagen || null,
            description: 'Importado vía Excel'
        })).filter(m => m.name);

        const { data: inserted, error } = await supabase
            .from('drug_database')
            .upsert(medicinesToInsert, { onConflict: 'name' });

        if (error) {
            console.error('Error importing medicines:', error);
            return res.status(500).json({ message: 'Error al importar medicamentos', details: error.message });
        }

        res.json({ message: `Se importaron ${medicinesToInsert.length} medicamentos correctamente` });
    } catch (error) {
        console.error('Error importing medicines:', error);
        res.status(500).json({ message: 'Error al importar medicamentos' });
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
        try {
            const { data, error } = await supabase
                .from('drug_database')
                .select('id, name, generic_name, dosage_form, strength, manufacturer, description, contraindications, side_effects, image_url')
                .or(`name.ilike.%${searchTerm}%,generic_name.ilike.%${searchTerm}%`)
                .limit(20);

            if (!error && data && data.length > 0) {
                console.log('Backend - Buscador (DB):', searchTerm, 'Encontrados:', data.length);
                return res.json(data);
            }
            
            if (error) console.log('Nota: Error en búsqueda drug_database (posible columna faltante):', error.message);
        } catch (err) {
            console.log('Error crítico consultando drug_database:', err.message);
        }

        // Fallback: lista de medicamentos comunes si no existe la tabla o no hay resultados
        const commonMedicines = [
            { id: 'f1', name: 'Losartán', generic_name: 'Losartán Potásico', dosage_form: 'Comprimido', strength: '50 mg', description: 'Antihipertensivo. Bloqueador de los receptores AT1 de angiotensina II.', contraindications: 'Hipersensibilidad, embarazo.', side_effects: 'Mareos, hiperpotasemia, elevación de creatinina.', image_url: null },
            { id: 'f2', name: 'Metformina', generic_name: 'Metformina HCl', dosage_form: 'Comprimido', strength: '850 mg', description: 'Antidiabético oral. Reduce la producción hepática de glucosa.', contraindications: 'Insuficiencia renal severa, alcoholismo.', side_effects: 'Náuseas, diarrea, dolor abdominal.', image_url: null },
            { id: 'f3', name: 'Atorvastatina', generic_name: 'Atorvastatina Cálcica', dosage_form: 'Comprimido', strength: '20 mg', description: 'Hipolipemiante. Inhibe la HMG-CoA reductasa.', contraindications: 'Enfermedad hepática activa, embarazo.', side_effects: 'Mialgia, elevación de transaminasas.', image_url: null },
            { id: 'f4', name: 'Omeprazol', generic_name: 'Omeprazol', dosage_form: 'Cápsula', strength: '20 mg', description: 'Inhibidor de la bomba de protones. Reduce la secreción de ácido gástrico.', contraindications: 'Hipersensibilidad a benzimidazoles.', side_effects: 'Cefalea, diarrea, náuseas.', image_url: null },
            { id: 'f5', name: 'Amlodipino', generic_name: 'Amlodipino Besilato', dosage_form: 'Comprimido', strength: '5 mg', description: 'Antihipertensivo, antianginoso. Bloqueador de canales de calcio.', contraindications: 'Shock cardiogénico, estenosis aórtica severa.', side_effects: 'Edema periférico, rubor, cefalea.', image_url: null },
            { id: 'f6', name: 'Aspirina', generic_name: 'Ácido Acetilsalicílico', dosage_form: 'Comprimido', strength: '100 mg', description: 'Antiagregante plaquetario. Prevención de eventos cardiovasculares.', contraindications: 'Úlcera péptica activa, alergia a AINEs.', side_effects: 'Sangrado gastrointestinal, tinnitus.', image_url: null },
            { id: 'f7', name: 'Levotiroxina', generic_name: 'Levotiroxina Sódica', dosage_form: 'Comprimido', strength: '50 mcg', description: 'Hormona tiroidea. Tratamiento del hipotiroidismo.', contraindications: 'Hipertiroidismo no tratado, insuficiencia suprarrenal.', side_effects: 'Palpitaciones, insomnio, pérdida de peso.', image_url: null },
            { id: 'f8', name: 'Furosemida', generic_name: 'Furosemida', dosage_form: 'Comprimido', strength: '40 mg', description: 'Diurético de asa. Reduce la retención de líquidos.', contraindications: 'Anuria, hipersensibilidad a sulfonamidas.', side_effects: 'Hipopotasemia, deshidratación, hipotensión.', image_url: null },
            { id: 'f9', name: 'Metoprolol', generic_name: 'Succinato de Metoprolol', dosage_form: 'Comprimido', strength: '50 mg', description: 'Betabloqueante cardioselectivo. Tratamiento de hipertensión y angina.', contraindications: 'Bradicardia severa, bloqueo AV grado 2-3.', side_effects: 'Bradicardia, fatiga, frialdad de extremidades.', image_url: null },
            { id: 'f10', name: 'Warfarina', generic_name: 'Warfarina Sódica', dosage_form: 'Comprimido', strength: '5 mg', description: 'Anticoagulante oral. Prevención de tromboembolismo.', contraindications: 'Sangrado activo, embarazo, hemofilia.', side_effects: 'Hemorragias, hematomas, sangrado prolongado.', image_url: null },
            { id: 'f11', name: 'Glibenclamida', generic_name: 'Glibenclamida', dosage_form: 'Comprimido', strength: '5 mg', description: 'Hipoglucemiante oral. Estimula la secreción de insulina.', contraindications: 'Diabetes tipo 1, insuficiencia renal/hepática severa.', side_effects: 'Hipoglucemia, náuseas, aumento de peso.', image_url: null },
            { id: 'f12', name: 'Calcio + Vitamina D3', generic_name: 'Carbonato de Calcio + Colecalciferol', dosage_form: 'Comprimido masticable', strength: '500 mg / 200 UI', description: 'Suplemento. Prevención y tratamiento de deficiencias de calcio.', contraindications: 'Hipercalcemia, urolitiasis cálcica grave.', side_effects: 'Estreñimiento, distensión abdominal.', image_url: null },
            { id: 'f13', name: 'Alprazolam', generic_name: 'Alprazolam', dosage_form: 'Comprimido', strength: '0.5 mg', description: 'Ansiolítico benzodiacepínico. Tratamiento de trastornos de ansiedad.', contraindications: 'Glaucoma de ángulo cerrado, miastenia gravis.', side_effects: 'Somnolencia, dependencia, deterioro cognitivo.', image_url: null },
            { id: 'f14', name: 'Tramadol', generic_name: 'Clorhidrato de Tramadol', dosage_form: 'Cápsula', strength: '50 mg', description: 'Analgésico opiáceo de acción central para dolor moderado a severo.', contraindications: 'Epilepsia no controlada, uso de IMAO.', side_effects: 'Náuseas, estreñimiento, mareos, somnolencia.', image_url: null },
            { id: 'f15', name: 'Pantoprazol', generic_name: 'Pantoprazol Sódico', dosage_form: 'Comprimido', strength: '40 mg', description: 'Inhibidor de la bomba de protones. Tratamiento de ERGE y úlceras.', contraindications: 'Hipersensibilidad a benzimidazoles.', side_effects: 'Cefalea, diarrea, hipomagnesemia prolongada.', image_url: null },
            { id: 'f16', name: 'Enalapril', generic_name: 'Maleato de Enalapril', dosage_form: 'Comprimido', strength: '10 mg', description: 'IECA. Antihipertensivo y protector renal.', contraindications: 'Angioedema hereditario, embarazo (2do-3er trim.).', side_effects: 'Tos seca persistente, hiperpotasemia, hipotensión.', image_url: null },
            { id: 'f17', name: 'Ibuprofeno', generic_name: 'Ibuprofeno', dosage_form: 'Comprimido', strength: '400 mg', description: 'AINE. Analgésico, antipirético y antiinflamatorio.', contraindications: 'Úlcera péptica activa, insuficiencia renal severa.', side_effects: 'Dispepsia, sangrado GI, retención de líquidos.', image_url: null },
            { id: 'f18', name: 'Paracetamol', generic_name: 'Acetaminofén', dosage_form: 'Comprimido', strength: '500 mg', description: 'Analgésico y antipirético. Primera línea para dolor leve-moderado.', contraindications: 'Insuficiencia hepática severa, alcoholismo crónico.', side_effects: 'Raramente hepatotoxicidad a dosis altas.', image_url: null },
            { id: 'f19', name: 'Prednisona', generic_name: 'Prednisona', dosage_form: 'Comprimido', strength: '10 mg', description: 'Corticosteroide. Antiinflamatorio e inmunosupresor.', contraindications: 'Infecciones sistémicas no tratadas.', side_effects: 'Hiperglucemia, osteoporosis, retención de líquidos.', image_url: null },
            { id: 'f20', name: 'Clonazepam', generic_name: 'Clonazepam', dosage_form: 'Comprimido', strength: '0.5 mg', description: 'Benzodiacepina. Antiepiléptico y ansiolítico.', contraindications: 'Miastenia gravis, insuficiencia hepática severa.', side_effects: 'Somnolencia, ataxia, problemas de memoria.', image_url: null },
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
    searchDrugDatabase,
    downloadMedicineTemplate,
    importMedicinesExcel
};

