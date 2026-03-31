const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Se requiere text' });

        // Limpiar emojis
        const clean = text.replace(/[\u{1F600}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[•✅⏰📋📊🔥📅🏥📆📍📈💊📞]/gu, '').replace(/\n+/g, '. ').trim();
        if (!clean) return res.status(400).json({ error: 'Texto vacío después de limpiar' });

        const apiKey = process.env.GOOGLE_TTS_API_KEY;
        const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                input: { text: clean.substring(0, 5000) },
                voice: {
                    languageCode: 'es-US',
                    name: 'es-US-Chirp3-HD-Gacrux',
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                    speakingRate: 0.9,
                    pitch: 0,
                },
            }),
        });

        const data = await response.json();

        if (data.audioContent) {
            res.json({ success: true, audio: data.audioContent });
        } else {
            console.error('TTS error:', data);
            res.status(500).json({ error: 'Error generando audio', details: data.error?.message });
        }
    } catch (error) {
        console.error('Error en TTS:', error);
        res.status(500).json({ error: 'Error en TTS', details: error.message });
    }
});

module.exports = router;
