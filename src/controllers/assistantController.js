const Groq = require('groq-sdk');
const supabase = require('../config/database');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Cargar contexto del paciente desde la BD
const loadPatientContext = async (patientId) => {
    const ctx = { medications: [], appointments: [], stats: { total: 0, taken: 0, streak: 0 }, patient: null };
    try {
        // Datos del paciente
        const { data: patient } = await supabase.from('users').select('*').eq('id', patientId).single();
        ctx.patient = patient;

        // Medicamentos
        const { data: meds } = await supabase.from('medicines').select('*').eq('patient_id', patientId);
        ctx.medications = meds || [];

        // Logs de hoy
        const today = new Date().toISOString().split('T')[0];
        const { data: logs } = await supabase.from('medicine_logs').select('*').eq('patient_id', patientId).gte('taken_at', today);
        const takenIds = (logs || []).map(l => l.medicine_id);
        ctx.stats.total = (meds || []).length;
        ctx.stats.taken = takenIds.length;

        // Citas
        const { data: apts } = await supabase.from('appointments').select('*').eq('patient_id', patientId).order('appointment_date', { ascending: true });
        ctx.appointments = apts || [];
    } catch (e) {
        console.error('Error loading patient context:', e);
    }
    return ctx;
};

// Construir el system prompt según el rol
const buildSystemPrompt = (ctx, role, userName) => {
    const { medications, appointments, stats, patient } = ctx;
    const patientName = patient?.name || 'el paciente';
    const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    let medsInfo = 'No hay medicamentos registrados.';
    if (medications.length > 0) {
        medsInfo = medications.map(m => `- ${m.name} (${m.dosage || 'sin dosis'}): ${m.frequency || 'sin frecuencia'}${m.time ? ', horario: ' + m.time : ''}${m.notes ? ', notas: ' + m.notes : ''}`).join('\n');
    }

    let aptsInfo = 'No hay citas programadas.';
    if (appointments.length > 0) {
        aptsInfo = appointments.slice(0, 5).map(a => {
            const d = a.appointment_date ? a.appointment_date.split('T')[0] : 'sin fecha';
            return `- Dr. ${a.doctor_name} (${a.specialty}): ${d} a las ${a.appointment_time || 'sin hora'}, en ${a.location || 'sin ubicación'} [Estado: ${a.status}]`;
        }).join('\n');
    }

    const baseContext = `
Fecha de hoy: ${today}
Paciente: ${patientName}
Medicamentos registrados (${medications.length}):
${medsInfo}

Estadísticas de hoy: ${stats.taken}/${stats.total} medicamentos tomados

Citas médicas:
${aptsInfo}
`;

    if (role === 'adultoMayor') {
        return `Eres Nona AI, un asistente virtual cariñoso y paciente para adultos mayores. Hablas en español de forma clara, sencilla y con emojis amigables. Tu usuario se llama ${userName}.

Tienes acceso a la siguiente información real del paciente:
${baseContext}

Reglas:
- Responde SIEMPRE en español
- Usa lenguaje simple y cálido, como si hablaras con un abuelo
- Usa emojis para hacer las respuestas más amigables
- Si preguntan por medicamentos, muestra los datos reales
- Si preguntan por citas, muestra las citas reales
- Si preguntan algo que no sabes, sugiere contactar a su familiar o cuidador
- Sé breve pero informativo
- Nunca inventes datos médicos que no tengas`;
    }

    return `Eres Nona AI, un asistente virtual profesional para ${role === 'familiar' ? 'familiares' : 'cuidadores'} de adultos mayores. Hablas en español de forma clara y profesional. Tu usuario se llama ${userName} y cuida a ${patientName}.

Tienes acceso a la siguiente información real del paciente ${patientName}:
${baseContext}

Reglas:
- Responde SIEMPRE en español
- Sé profesional pero cercano
- Usa emojis moderadamente
- Si preguntan por medicamentos del paciente, muestra los datos reales
- Si preguntan por citas del paciente, muestra las citas reales
- Proporciona información útil para el cuidado
- Sé breve pero informativo
- Nunca inventes datos médicos que no tengas`;
};

// Endpoint principal del chat
const chat = async (req, res) => {
    try {
        const { message, patientId, role, userName, conversationHistory } = req.body;

        if (!message || !patientId) {
            return res.status(400).json({ error: 'Se requiere message y patientId' });
        }

        // Cargar contexto del paciente
        const ctx = await loadPatientContext(patientId);
        const systemPrompt = buildSystemPrompt(ctx, role || 'adultoMayor', userName || 'Usuario');

        // Construir mensajes para Groq
        const messages = [
            { role: 'system', content: systemPrompt },
        ];

        // Agregar historial de conversación (últimos 10 mensajes)
        if (conversationHistory && Array.isArray(conversationHistory)) {
            const recent = conversationHistory.slice(-10);
            recent.forEach(msg => {
                messages.push({
                    role: msg.isBot ? 'assistant' : 'user',
                    content: msg.text,
                });
            });
        }

        // Agregar mensaje actual
        messages.push({ role: 'user', content: message });

        // Llamar a Groq
        const completion = await groq.chat.completions.create({
            messages,
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 500,
        });

        const reply = completion.choices[0]?.message?.content || 'Lo siento, no pude procesar tu pregunta. Intenta de nuevo.';

        res.json({ success: true, reply });
    } catch (error) {
        console.error('Error en assistant chat:', error);
        res.status(500).json({ error: 'Error al procesar la consulta', details: error.message });
    }
};

module.exports = { chat };
