const express = require('express');
const router = express.Router();
const textToSpeech = require('@google-cloud/text-to-speech');

// Inicializar cliente con Service Account automático desde el .env
const client = new textToSpeech.TextToSpeechClient();

router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ success: false, error: 'Texto requerido' });
    }

    const request = {
      input: { text },
      voice: {
        languageCode: 'es-US', // Español de Estados Unidos
        name: 'es-US-Neural2-A', // Voz neural femenina
        ssmlGender: 'FEMALE'
      },
      audioConfig: { audioEncoding: 'MP3' },
    };

    const [response] = await client.synthesizeSpeech(request);
    const audioBase64 = response.audioContent.toString('base64');

    res.json({
      success: true,
      audio: audioBase64
    });
  } catch (error) {
    console.error('Error en Google TTS:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
