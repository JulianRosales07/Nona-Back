const express = require('express');
const router = express.Router();
const textToSpeech = require('@google-cloud/text-to-speech');

// Inicializar cliente con credenciales desde variables de entorno o archivo local
let client;

try {
  // Verificar si estamos en producción (Render) o desarrollo local
  const isProduction = process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64 || process.env.GOOGLE_CLOUD_CREDENTIALS_JSON;
  
  if (process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64) {
    // Opción A: Desde Base64 (Render)
    console.log('🔧 Inicializando Google Cloud TTS desde Base64...');
    const credentials = JSON.parse(
      Buffer.from(process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64, 'base64').toString('utf-8')
    );
    client = new textToSpeech.TextToSpeechClient({ credentials });
    console.log('✅ Google Cloud TTS inicializado desde Base64');
  } else if (process.env.GOOGLE_CLOUD_CREDENTIALS_JSON) {
    // Opción B: Desde JSON directo (Render alternativo)
    console.log('🔧 Inicializando Google Cloud TTS desde JSON...');
    const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS_JSON);
    client = new textToSpeech.TextToSpeechClient({ credentials });
    console.log('✅ Google Cloud TTS inicializado desde JSON');
  } else {
    // En desarrollo local, usar archivo (requiere GOOGLE_APPLICATION_CREDENTIALS en .env)
    console.log('🔧 Inicializando Google Cloud TTS desde archivo local...');
    client = new textToSpeech.TextToSpeechClient();
    console.log('✅ Google Cloud TTS inicializado desde archivo local');
  }
} catch (error) {
  console.error('❌ Error inicializando Google Cloud TTS:', error.message);
  console.error('Stack:', error.stack);
}

router.post('/', async (req, res) => {
  try {
    if (!client) {
      console.error('❌ Cliente de Google Cloud TTS no está inicializado');
      return res.status(500).json({ 
        success: false, 
        error: 'Google Cloud TTS no está configurado correctamente. Revisa los logs del servidor.' 
      });
    }

    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ success: false, error: 'Texto requerido' });
    }

    console.log('🎙️ Generando audio para:', text.substring(0, 50) + '...');

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

    console.log('✅ Audio generado exitosamente:', audioBase64.length, 'caracteres');

    res.json({
      success: true,
      audio: audioBase64
    });
  } catch (error) {
    console.error('❌ Error en Google TTS:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
