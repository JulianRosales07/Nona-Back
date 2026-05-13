/**
 * Script de prueba para Google Cloud TTS
 * 
 * Este script prueba la ruta /api/tts-google del backend
 * 
 * Uso:
 * 1. Asegúrate de que el servidor esté corriendo (npm start o npm run dev)
 * 2. Ejecuta: node test-google-tts.js
 */

const http = require('http');

const BASE_URL = 'localhost';
const PORT = 3000;

async function testGoogleTTS() {
  console.log('🧪 Probando Google Cloud TTS...\n');

  const postData = JSON.stringify({
    text: 'Hola, soy Nona, tu asistente virtual. Esta es una prueba de Google Cloud Text to Speech.'
  });

  const options = {
    hostname: BASE_URL,
    port: PORT,
    path: '/api/tts-google',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);

        if (response.success) {
          console.log('✅ Prueba exitosa!');
          console.log('📊 Respuesta del servidor:');
          console.log('   - Success:', response.success);
          console.log('   - Audio recibido:', response.audio ? `${response.audio.substring(0, 50)}...` : 'No');
          console.log('   - Tamaño del audio (base64):', response.audio ? response.audio.length : 0, 'caracteres');
          console.log('\n🎉 Google Cloud TTS está funcionando correctamente!');
        } else {
          console.log('❌ Error en la respuesta:', response);
        }
      } catch (error) {
        console.error('❌ Error al parsear la respuesta:', error.message);
        console.error('   Respuesta recibida:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error al probar Google TTS:');
    console.error('   -', error.message);
    console.error('   - Asegúrate de que el servidor esté corriendo en http://' + BASE_URL + ':' + PORT);
  });

  req.write(postData);
  req.end();
}

// Ejecutar la prueba
testGoogleTTS();
