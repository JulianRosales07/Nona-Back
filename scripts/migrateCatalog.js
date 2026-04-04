const supabase = require('../src/config/database');

async function migrateCatalog() {
    console.log('--- INICIANDO MIGRACIÓN DE CATÁLOGO ---');
    try {
        // 1. Obtener todos los medicamentos registrados en las fichas de pacientes
        const { data: medicines, error: medsError } = await supabase
            .from('medicines')
            .select('name, dosage, notes, image_url');

        if (medsError) throw medsError;
        if (!medicines || medicines.length === 0) {
            console.log('No se encontraron medicamentos en la tabla "medicines" para migrar.');
            return;
        }

        console.log(`Se encontraron ${medicines.length} registros. Procesando únicos...`);

        // 2. Extraer medicamentos únicos por nombre
        const uniqueMedMap = {};
        medicines.forEach(m => {
            const name = m.name?.trim();
            if (!name) return;
            const key = name.toLowerCase();
            
            // Si ya existe en el mapa, priorizamos el que tenga imagen
            if (!uniqueMedMap[key] || (!uniqueMedMap[key].image_url && m.image_url)) {
                uniqueMedMap[key] = {
                    name: name,
                    generic_name: name,
                    strength: m.dosage || '',
                    description: m.notes || 'Migrado del catálogo local',
                    image_url: m.image_url || null
                };
            }
        });

        const uniqueMeds = Object.values(uniqueMedMap);
        console.log(`Identificados ${uniqueMeds.length} medicamentos únicos. Insertando en drug_database...`);

        // 3. Insertar uno por uno (o verificar existencia)
        let insertedCount = 0;
        let updatedCount = 0;

        for (const med of uniqueMeds) {
            const { data: existing, error: existError } = await supabase
                .from('drug_database')
                .select('id, image_url')
                .ilike('name', med.name)
                .maybeSingle();

            if (existError) {
                console.error(`Error verificando ${med.name}:`, existError.message);
                continue;
            }

            if (!existing) {
                // INSERTAR NUEVO
                const { error: insError } = await supabase
                    .from('drug_database')
                    .insert([med]);
                if (!insError) insertedCount++;
                else console.error(`Error insertando ${med.name}:`, insError.message);
            } else if (med.image_url && !existing.image_url) {
                // ACTUALIZAR IMAGEN SI FALTA
                const { error: updError } = await supabase
                    .from('drug_database')
                    .update({ image_url: med.image_url })
                    .eq('id', existing.id);
                if (!updError) updatedCount++;
                else console.error(`Error actualizando imagen de ${med.name}:`, updError.message);
            }
        }

        console.log('--- MIGRACIÓN COMPLETADA ---');
        console.log(`Registros nuevos en catálogo: ${insertedCount}`);
        console.log(`Imágenes actualizadas en catálogo: ${updatedCount}`);

    } catch (err) {
        console.error('ERROR CRÍTICO EN MIGRACIÓN:', err.message);
    }
}

migrateCatalog();
