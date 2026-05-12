const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: TTS
 *   description: Text to Speech (Generación de voz con ElevenLabs)
 */

/**
 * @swagger
 * /api/tts:
 *   post:
 *     summary: Convertir texto a voz usando ElevenLabs
 *     tags: [TTS]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Texto a convertir en voz
 *     responses:
 *       200:
 *         description: Audio generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 audio:
 *                   type: string
 *                   description: Audio en base64
 *                 provider:
 *                   type: string
 *                   example: elevenlabs
 *                 voiceId:
 *                   type: string
 *       400:
 *         description: Texto inválido o vacío
 *       500:
 *         description: Error generando audio
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Se requiere text' });
        }

        // Limpiar emojis y caracteres especiales
        const clean = text
            .replace(/[\u{1F600}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[•✅⏰📋📊🔥📅🏥📆📍📈💊📞]/gu, '')
            .replace(/\n+/g, '. ')
            .trim();
        
        if (!clean) {
            return res.status(400).json({ error: 'Texto vacío después de limpiar' });
        }

        // Verificar variables de entorno
        const apiKey = process.env.ELEVENLABS_API_KEY;
        const voiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Rachel (default)

        if (!apiKey) {
            console.error('ELEVENLABS_API_KEY no configurada');
            return res.status(500).json({ error: 'API key no configurada' });
        }

        // Limitar longitud del texto (ElevenLabs tiene límites)
        const textToSpeak = clean.substring(0, 5000);

        console.log(`[TTS] Generando audio con ElevenLabs: ${textToSpeak.length} caracteres`);

        // Llamar a ElevenLabs API
        const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
        
        const response = await fetch(elevenLabsUrl, {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: textToSpeak,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                    style: 0.0,
                    use_speaker_boost: true
                }
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('ElevenLabs error:', response.status, errorData);
            return res.status(response.status).json({ 
                error: 'Error generando audio', 
                details: errorData 
            });
        }

        // Obtener el audio como buffer
        const audioBuffer = await response.arrayBuffer();
        
        // Convertir a base64 para enviar al cliente
        const base64Audio = Buffer.from(audioBuffer).toString('base64');

        console.log(`[TTS] Audio generado exitosamente: ${base64Audio.length} bytes`);

        // Enviar respuesta
        res.json({ 
            success: true, 
            audio: base64Audio,
            provider: 'elevenlabs',
            voiceId: voiceId
        });

    } catch (error) {
        console.error('Error en TTS:', error);
        res.status(500).json({ 
            error: 'Error en TTS', 
            details: error.message 
        });
    }
});

/**
 * @swagger
 * /api/tts/voices:
 *   get:
 *     summary: Obtener lista de voces disponibles en ElevenLabs
 *     tags: [TTS]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de voces obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 voices:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Error obteniendo voces
 */
router.get('/voices', authenticateToken, async (req, res) => {
    try {
        const apiKey = process.env.ELEVENLABS_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'API key no configurada' });
        }

        const response = await fetch('https://api.elevenlabs.io/v1/voices', {
            method: 'GET',
            headers: {
                'xi-api-key': apiKey,
            },
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('ElevenLabs voices error:', errorData);
            return res.status(response.status).json({ 
                error: 'Error obteniendo voces', 
                details: errorData 
            });
        }

        const data = await response.json();
        res.json({ success: true, voices: data.voices });

    } catch (error) {
        console.error('Error obteniendo voces:', error);
        res.status(500).json({ 
            error: 'Error obteniendo voces', 
            details: error.message 
        });
    }
});

module.exports = router;
