const express = require('express');
const router = express.Router();
const multer = require('multer');
const Groq = require('groq-sdk');
const { authenticateToken } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const os = require('os');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.post('/', authenticateToken, upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No se recibió archivo de audio' });

        // Guardar temporalmente el archivo
        const tmpPath = path.join(os.tmpdir(), `audio_${Date.now()}.webm`);
        fs.writeFileSync(tmpPath, req.file.buffer);

        // Transcribir con Groq Whisper
        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(tmpPath),
            model: 'whisper-large-v3',
            language: 'es',
            response_format: 'text',
        });

        // Limpiar archivo temporal
        fs.unlinkSync(tmpPath);

        const text = typeof transcription === 'string' ? transcription : transcription.text || '';
        console.log('🎤 Transcripción:', text);

        res.json({ success: true, text: text.trim() });
    } catch (error) {
        console.error('Error transcribiendo audio:', error);
        res.status(500).json({ error: 'Error al transcribir el audio', details: error.message });
    }
});

module.exports = router;
