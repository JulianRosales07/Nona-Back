const Groq = require('groq-sdk');
const supabase = require('../config/database');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Tools que Groq puede llamar ──
const tools = [
    {
        type: 'function',
        function: {
            name: 'create_medicine',
            description: 'Crear/agregar un nuevo medicamento para el paciente',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Nombre del medicamento' },
                    dosage: { type: 'string', description: 'Dosis (ej: 50mg, 1 comprimido)' },
                    frequency: { type: 'string', description: 'Frecuencia (ej: Una vez al día, Cada 8 horas)' },
                    time: { type: 'string', description: 'Horario (ej: 8:00 AM, 2:00 PM)' },
                    notes: { type: 'string', description: 'Notas o instrucciones adicionales' },
                },
                required: ['name'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'delete_medicine',
            description: 'Eliminar un medicamento del paciente por nombre',
            parameters: {
                type: 'object',
                properties: {
                    medicine_name: { type: 'string', description: 'Nombre del medicamento a eliminar' },
                },
                required: ['medicine_name'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'create_appointment',
            description: 'Crear/agendar una nueva cita médica para el paciente',
            parameters: {
                type: 'object',
                properties: {
                    doctor_name: { type: 'string', description: 'Nombre del doctor' },
                    specialty: { type: 'string', description: 'Especialidad médica' },
                    appointment_date: { type: 'string', description: 'Fecha en formato YYYY-MM-DD' },
                    appointment_time: { type: 'string', description: 'Hora (ej: 10:00 AM)' },
                    location: { type: 'string', description: 'Ubicación/hospital/clínica' },
                    notes: { type: 'string', description: 'Notas adicionales' },
                },
                required: ['doctor_name', 'specialty', 'appointment_date'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'cancel_appointment',
            description: 'Cancelar una cita médica existente por nombre del doctor o especialidad',
            parameters: {
                type: 'object',
                properties: {
                    doctor_name: { type: 'string', description: 'Nombre del doctor de la cita a cancelar' },
                    appointment_date: { type: 'string', description: 'Fecha de la cita a cancelar en formato YYYY-MM-DD' },
                },
                required: ['doctor_name'],
            },
        },
    },
];

// ── Ejecutar las funciones ──
const executeTool = async (toolName, args, patientId, userId) => {
    console.log(`🔧 Ejecutando tool: ${toolName}`, JSON.stringify(args));
    try {
        switch (toolName) {
            case 'create_medicine': {
                const { data, error } = await supabase.from('medicines').insert({
                    patient_id: patientId,
                    name: args.name,
                    dosage: args.dosage || null,
                    frequency: args.frequency || null,
                    time: args.time || null,
                    notes: args.notes || null,
                }).select().single();
                if (error) { console.error('❌ Error create_medicine:', error); return { success: false, error: error.message }; }
                return { success: true, message: `Medicamento "${args.name}" agregado correctamente.` };
            }
            case 'delete_medicine': {
                const { data: meds } = await supabase.from('medicines').select('*').eq('patient_id', patientId).ilike('name', `%${args.medicine_name}%`);
                if (!meds || meds.length === 0) return { success: false, error: `No se encontró el medicamento "${args.medicine_name}".` };
                const { error } = await supabase.from('medicines').delete().eq('id', meds[0].id);
                if (error) { console.error('❌ Error delete_medicine:', error); return { success: false, error: error.message }; }
                return { success: true, message: `Medicamento "${meds[0].name}" eliminado correctamente.` };
            }
            case 'create_appointment': {
                const { data, error } = await supabase.from('appointments').insert({
                    patient_id: patientId,
                    created_by: userId || patientId,
                    doctor_name: args.doctor_name,
                    specialty: args.specialty || 'General',
                    appointment_date: args.appointment_date,
                    appointment_time: args.appointment_time || '09:00 AM',
                    location: args.location || 'Por definir',
                    notes: args.notes || null,
                    status: 'pending',
                }).select().single();
                if (error) { console.error('❌ Error create_appointment:', error); return { success: false, error: error.message }; }
                return { success: true, message: `Cita con Dr. ${args.doctor_name} agendada para el ${args.appointment_date} a las ${args.appointment_time || '09:00 AM'}.` };
            }
            case 'cancel_appointment': {
                let query = supabase.from('appointments').select('*').eq('patient_id', patientId).ilike('doctor_name', `%${args.doctor_name}%`).neq('status', 'cancelled');
                if (args.appointment_date) query = query.eq('appointment_date', args.appointment_date);
                const { data: apts } = await query;
                if (!apts || apts.length === 0) return { success: false, error: `No se encontró una cita con "${args.doctor_name}".` };
                const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', apts[0].id);
                if (error) { console.error('❌ Error cancel_appointment:', error); return { success: false, error: error.message }; }
                return { success: true, message: `Cita con ${apts[0].doctor_name} cancelada.` };
            }
            default:
                return { success: false, error: 'Función no reconocida.' };
        }
    } catch (e) {
        console.error(`❌ Error ejecutando ${toolName}:`, e);
        return { success: false, error: e.message };
    }
};

// ── Cargar contexto del paciente ──
const loadPatientContext = async (patientId) => {
    const ctx = { medications: [], appointments: [], stats: { total: 0, taken: 0, streak: 0 }, patient: null, relationships: [] };
    try {
        const { data: patient } = await supabase.from('users').select('*').eq('id', patientId).single();
        ctx.patient = patient;

        const { data: meds } = await supabase.from('medicines').select('*').eq('patient_id', patientId);
        ctx.medications = meds || [];

        const today = new Date().toISOString().split('T')[0];
        const { data: logs } = await supabase.from('medicine_logs').select('*').eq('patient_id', patientId).gte('taken_at', today);
        ctx.stats.total = (meds || []).length;
        ctx.stats.taken = (logs || []).length;

        const { data: apts } = await supabase.from('appointments').select('*').eq('patient_id', patientId).order('appointment_date', { ascending: true });
        ctx.appointments = apts || [];

        const { data: rels } = await supabase.from('user_relationships').select('*').eq('elderly_id', patientId).eq('status', 'active');
        if (rels && rels.length > 0) {
            const ids = rels.map(r => r.caregiver_id);
            const { data: caregivers } = await supabase.from('users').select('id, name, email, phone, role').in('id', ids);
            ctx.relationships = (caregivers || []).map(c => {
                const rel = rels.find(r => r.caregiver_id === c.id);
                return { ...c, relationshipType: rel?.relationship_type || 'familiar' };
            });
        }
    } catch (e) { console.error('Error loading patient context:', e); }
    return ctx;
};

// ── System prompt ──
const buildSystemPrompt = (ctx, role, userName) => {
    const { medications, appointments, stats, patient, relationships } = ctx;
    const pName = patient?.name || 'el paciente';
    const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const medsInfo = medications.length > 0
        ? medications.map(m => `- ${m.name} (${m.dosage || 'sin dosis'}): ${m.frequency || ''}${m.time ? ', ' + m.time : ''}${m.notes ? ' | ' + m.notes : ''}`).join('\n')
        : 'No hay medicamentos registrados.';

    const aptsInfo = appointments.length > 0
        ? appointments.slice(0, 5).map(a => `- Dr. ${a.doctor_name} (${a.specialty}): ${(a.appointment_date || '').split('T')[0]} a las ${a.appointment_time || 'sin hora'}, ${a.location || ''} [${a.status}]`).join('\n')
        : 'No hay citas programadas.';

    const relsInfo = relationships.length > 0
        ? relationships.map(r => `- ${r.name} (${r.relationshipType}): tel: ${r.phone || 'N/A'}, email: ${r.email || 'N/A'}`).join('\n')
        : 'Sin familiares vinculados.';

    const context = `
Fecha: ${today}
Paciente: ${pName} | Tel: ${patient?.phone || 'N/A'} | Email: ${patient?.email || 'N/A'} | Nacimiento: ${patient?.birth_date || 'N/A'} | Cédula: ${patient?.cedula || 'N/A'}

Familiares/Cuidadores:
${relsInfo}

Medicamentos (${medications.length}):
${medsInfo}

Hoy: ${stats.taken}/${stats.total} tomados

Citas:
${aptsInfo}`;

    const roleDesc = role === 'adultoMayor'
        ? `Eres Nona AI, asistente cariñoso para adultos mayores. Hablas simple, cálido y con emojis. Usuario: ${userName}.`
        : `Eres Nona AI, asistente profesional para ${role === 'familiar' ? 'familiares' : 'cuidadores'}. Usuario: ${userName}, cuida a ${pName}.`;

    return `${roleDesc}

Datos reales:
${context}

Reglas:
- SIEMPRE en español
- Usa los datos reales, nunca inventes
- Si el usuario quiere agregar medicamento o cita, USA las funciones disponibles
- Si quiere eliminar o cancelar, USA las funciones disponibles
- Para fechas, SIEMPRE usa formato YYYY-MM-DD (ej: 2026-04-05). El año actual es ${new Date().getFullYear()}
- Si el usuario dice "el 5 de abril", convierte a ${new Date().getFullYear()}-04-05
- Si no especifica año, usa ${new Date().getFullYear()}
- Confirma siempre al usuario qué acción realizaste
- Sé breve e informativo`;
};

// ── Endpoint principal ──
const chat = async (req, res) => {
    try {
        const { message, patientId, role, userName, conversationHistory } = req.body;
        if (!message || !patientId) return res.status(400).json({ error: 'Se requiere message y patientId' });

        // userId es el usuario autenticado (del token JWT)
        const userId = req.user?.id || patientId;

        const ctx = await loadPatientContext(patientId);
        const systemPrompt = buildSystemPrompt(ctx, role || 'adultoMayor', userName || 'Usuario');

        const messages = [{ role: 'system', content: systemPrompt }];
        if (conversationHistory && Array.isArray(conversationHistory)) {
            conversationHistory.slice(-10).forEach(msg => {
                messages.push({ role: msg.isBot ? 'assistant' : 'user', content: msg.text });
            });
        }
        messages.push({ role: 'user', content: message });

        // Primera llamada a Groq con tools
        const completion = await groq.chat.completions.create({
            messages,
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 500,
            tools,
            tool_choice: 'auto',
        });

        const choice = completion.choices[0];

        // Si Groq quiere llamar funciones
        if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
            const toolResults = [];
            for (const toolCall of choice.message.tool_calls) {
                const args = JSON.parse(toolCall.function.arguments);
                console.log(`🔧 Ejecutando: ${toolCall.function.name}`, args);
                const result = await executeTool(toolCall.function.name, args, patientId, userId);
                toolResults.push({ tool_call_id: toolCall.id, role: 'tool', content: JSON.stringify(result) });
            }

            // Segunda llamada para que Groq genere respuesta con los resultados
            messages.push(choice.message);
            messages.push(...toolResults);

            const followUp = await groq.chat.completions.create({
                messages,
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7,
                max_tokens: 500,
            });

            const reply = followUp.choices[0]?.message?.content || 'Acción completada.';
            return res.json({ success: true, reply, actionsExecuted: true });
        }

        // Respuesta normal sin tool calls
        const reply = choice.message?.content || 'Lo siento, no pude procesar tu pregunta.';
        res.json({ success: true, reply });
    } catch (error) {
        console.error('Error en assistant chat:', error);
        res.status(500).json({ error: 'Error al procesar la consulta', details: error.message });
    }
};

module.exports = { chat };
