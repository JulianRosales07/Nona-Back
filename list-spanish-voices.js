/**
 * Script para listar todas las voces en español disponibles en Google Cloud TTS
 * 
 * Uso: node list-spanish-voices.js
 */

require('dotenv').config();
const textToSpeech = require('@google-cloud/text-to-speech');

const client = new textToSpeech.TextToSpeechClient();

async function listSpanishVoices() {
  console.log('🔍 Buscando voces en español disponibles...\n');

  try {
    const [result] = await client.listVoices({});
    const voices = result.voices;

    // Filtrar solo voces en español
    const spanishVoices = voices.filter(voice => 
      voice.languageCodes.some(code => code.startsWith('es-'))
    );

    console.log(`✅ Encontradas ${spanishVoices.length} voces en español:\n`);

    // Agrupar por código de idioma
    const voicesByLanguage = {};
    
    spanishVoices.forEach(voice => {
      voice.languageCodes.forEach(langCode => {
        if (langCode.startsWith('es-')) {
          if (!voicesByLanguage[langCode]) {
            voicesByLanguage[langCode] = [];
          }
          voicesByLanguage[langCode].push(voice);
        }
      });
    });

    // Mostrar voces agrupadas
    Object.keys(voicesByLanguage).sort().forEach(langCode => {
      const languageNames = {
        'es-ES': '🇪🇸 Español de España',
        'es-US': '🇺🇸 Español de Estados Unidos',
        'es-MX': '🇲🇽 Español de México',
        'es-AR': '🇦🇷 Español de Argentina',
        'es-CO': '🇨🇴 Español de Colombia',
        'es-CL': '🇨🇱 Español de Chile',
        'es-PE': '🇵🇪 Español de Perú',
        'es-VE': '🇻🇪 Español de Venezuela'
      };

      console.log(`\n${languageNames[langCode] || langCode}:`);
      console.log('─'.repeat(60));

      voicesByLanguage[langCode].forEach(voice => {
        const gender = voice.ssmlGender === 'FEMALE' ? '👩 Femenina' : '👨 Masculina';
        const type = voice.name.includes('Neural2') ? '🧠 Neural2 (Premium)' :
                     voice.name.includes('Wavenet') ? '🌊 WaveNet (Alta calidad)' :
                     voice.name.includes('Studio') ? '🎙️ Studio (Premium)' :
                     '📢 Standard (Básica)';
        
        console.log(`  ${gender} - ${voice.name}`);
        console.log(`    Tipo: ${type}`);
        console.log(`    Código: languageCode: '${langCode}', name: '${voice.name}'`);
        console.log('');
      });
    });

    console.log('\n💡 Recomendaciones:');
    console.log('   - Neural2: Mejor calidad, sonido más natural (recomendado)');
    console.log('   - WaveNet: Alta calidad, buen balance calidad/costo');
    console.log('   - Standard: Calidad básica, más económico');
    console.log('\n📝 Para usar una voz, actualiza el archivo src/routes/tts-google.js');
    console.log('   con el languageCode y name correspondientes.');

  } catch (error) {
    console.error('❌ Error al listar voces:', error.message);
    
    if (error.message.includes('Could not load the default credentials')) {
      console.error('\n💡 Solución:');
      console.error('   1. Verifica que el archivo credentials/google-cloud.json existe');
      console.error('   2. Verifica que GOOGLE_APPLICATION_CREDENTIALS está en el .env');
      console.error('   3. Reinicia el servidor si hiciste cambios');
    }
  }
}

listSpanishVoices();
