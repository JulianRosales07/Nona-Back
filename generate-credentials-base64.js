/**
 * Script para generar credenciales en Base64 para Render
 * 
 * Uso: node generate-credentials-base64.js
 */

const fs = require('fs');
const path = require('path');

const credentialsPath = path.join(__dirname, 'credentials', 'google-cloud.json');

try {
  // Leer el archivo de credenciales
  const credentialsJson = fs.readFileSync(credentialsPath, 'utf-8');
  
  // Convertir a Base64
  const base64 = Buffer.from(credentialsJson, 'utf-8').toString('base64');
  
  console.log('\n🔐 Credenciales de Google Cloud en Base64\n');
  console.log('═'.repeat(80));
  console.log('\n📋 Copia esta variable de entorno para Render:\n');
  console.log('Nombre de la variable:');
  console.log('  GOOGLE_CLOUD_CREDENTIALS_BASE64\n');
  console.log('Valor de la variable:');
  console.log('─'.repeat(80));
  console.log(base64);
  console.log('─'.repeat(80));
  console.log('\n✅ Pasos siguientes:\n');
  console.log('1. Copia el valor de arriba (todo el texto entre las líneas)');
  console.log('2. Ve a tu Dashboard de Render: https://dashboard.render.com');
  console.log('3. Selecciona tu servicio "nona-back"');
  console.log('4. Ve a "Environment"');
  console.log('5. Agrega una nueva variable:');
  console.log('   - Nombre: GOOGLE_CLOUD_CREDENTIALS_BASE64');
  console.log('   - Valor: [pega el texto copiado]');
  console.log('6. También agrega:');
  console.log('   - Nombre: GOOGLE_CLOUD_PROJECT_ID');
  console.log('   - Valor: artful-fragment-420317');
  console.log('7. Guarda los cambios y espera a que Render redesplegue\n');
  console.log('═'.repeat(80));
  console.log('\n💡 Tip: El valor también se ha guardado en credentials-base64.txt\n');
  
  // Guardar en archivo para fácil copia
  fs.writeFileSync(
    path.join(__dirname, 'credentials-base64.txt'),
    base64,
    'utf-8'
  );
  
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error('\n💡 Asegúrate de que el archivo credentials/google-cloud.json existe\n');
  process.exit(1);
}
