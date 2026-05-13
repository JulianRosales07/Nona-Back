# 🚀 Configurar Google Cloud TTS en Render

## 🔍 Problema Actual

El error indica que Render no encuentra el archivo `google-cloud.json` porque:
- ❌ Los archivos de credenciales NO se suben a Git (están en `.gitignore`)
- ❌ Render no tiene acceso al archivo local
- ✅ Necesitamos usar variables de entorno en su lugar

---

## ✅ Solución: Usar Variables de Entorno

En lugar de usar un archivo JSON, vamos a configurar las credenciales como variables de entorno en Render.

---

## 📋 Paso 1: Preparar las Credenciales

### Opción A: Convertir JSON a Base64 (Recomendado)

1. Abre PowerShell en la carpeta del backend:
   ```powershell
   cd c:\Users\julia\OneDrive\Escritorio\Trabajo Nona\NonaBack
   ```

2. Convierte el archivo JSON a Base64:
   ```powershell
   $json = Get-Content credentials\google-cloud.json -Raw
   $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
   $base64 = [Convert]::ToBase64String($bytes)
   $base64 | Set-Clipboard
   Write-Host "✅ Credenciales copiadas al portapapeles"
   ```

3. Las credenciales en Base64 están ahora en tu portapapeles

### Opción B: Usar el Contenido JSON Directamente

1. Abre el archivo `credentials/google-cloud.json`
2. Copia TODO el contenido (desde `{` hasta `}`)
3. Guárdalo temporalmente en un lugar seguro

---

## 📋 Paso 2: Configurar Variables de Entorno en Render

1. **Ve a tu Dashboard de Render:**
   - https://dashboard.render.com

2. **Selecciona tu servicio:**
   - Busca "nona-back" o el nombre de tu backend

3. **Ve a Environment:**
   - En el menú lateral, haz clic en "Environment"

4. **Agrega las siguientes variables:**

   ### Opción A: Si usaste Base64
   ```
   Nombre: GOOGLE_CLOUD_CREDENTIALS_BASE64
   Valor: [Pega el Base64 que copiaste]
   ```

   ### Opción B: Si usas JSON directo
   ```
   Nombre: GOOGLE_CLOUD_CREDENTIALS_JSON
   Valor: [Pega el contenido del JSON]
   ```

   ### Además, agrega:
   ```
   Nombre: GOOGLE_CLOUD_PROJECT_ID
   Valor: artful-fragment-420317
   ```

5. **Guarda los cambios:**
   - Haz clic en "Save Changes"
   - Render redesplegará automáticamente tu servicio

---

## 📋 Paso 3: Actualizar el Código del Backend

Ahora necesitamos modificar la ruta para que use las variables de entorno en lugar del archivo.

### Actualizar `src/routes/tts-google.js`:

```javascript
const express = require('express');
const router = express.Router();
const textToSpeech = require('@google-cloud/text-to-speech');

// Inicializar cliente con credenciales desde variables de entorno
let client;

try {
  // En producción (Render), usar variables de entorno
  if (process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64) {
    // Opción A: Desde Base64
    const credentials = JSON.parse(
      Buffer.from(process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64, 'base64').toString('utf-8')
    );
    client = new textToSpeech.TextToSpeechClient({ credentials });
    console.log('✅ Google Cloud TTS inicializado desde Base64');
  } else if (process.env.GOOGLE_CLOUD_CREDENTIALS_JSON) {
    // Opción B: Desde JSON directo
    const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS_JSON);
    client = new textToSpeech.TextToSpeechClient({ credentials });
    console.log('✅ Google Cloud TTS inicializado desde JSON');
  } else {
    // En desarrollo local, usar archivo
    client = new textToSpeech.TextToSpeechClient();
    console.log('✅ Google Cloud TTS inicializado desde archivo local');
  }
} catch (error) {
  console.error('❌ Error inicializando Google Cloud TTS:', error.message);
}

router.post('/', async (req, res) => {
  try {
    if (!client) {
      return res.status(500).json({ 
        success: false, 
        error: 'Google Cloud TTS no está configurado correctamente' 
      });
    }

    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ success: false, error: 'Texto requerido' });
    }

    const request = {
      input: { text },
      voice: {
        languageCode: 'es-US',
        name: 'es-US-Neural2-A',
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
```

---

## 📋 Paso 4: Desplegar los Cambios

### Si usas Git:

```bash
cd c:\Users\julia\OneDrive\Escritorio\Trabajo Nona\NonaBack
git add .
git commit -m "Configurar Google Cloud TTS para Render"
git push
```

Render detectará los cambios y redesplegará automáticamente.

### Si no usas Git:

1. Ve a tu Dashboard de Render
2. Haz clic en "Manual Deploy" > "Deploy latest commit"

---

## 🧪 Paso 5: Verificar que Funciona

### Opción 1: Desde la App

1. Abre la app Nona
2. Ve al Asistente
3. Habla con Nona
4. Debería responder con Google Cloud TTS

### Opción 2: Desde cURL

```bash
curl -X POST https://nona-back.onrender.com/api/tts-google \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"Hola, soy Nona\"}"
```

Deberías recibir:
```json
{
  "success": true,
  "audio": "base64_audio_data..."
}
```

---

## 🔍 Solución de Problemas

### Error: "Google Cloud TTS no está configurado correctamente"

**Causa:** Las variables de entorno no están configuradas en Render.

**Solución:**
1. Verifica que agregaste las variables en Render
2. Verifica que el nombre sea exacto: `GOOGLE_CLOUD_CREDENTIALS_BASE64` o `GOOGLE_CLOUD_CREDENTIALS_JSON`
3. Redespliega el servicio

### Error: "Invalid credentials"

**Causa:** El JSON está mal formateado o incompleto.

**Solución:**
1. Verifica que copiaste TODO el contenido del JSON
2. Verifica que no haya espacios extra o saltos de línea
3. Usa la opción Base64 en su lugar

### Error: "API not enabled"

**Causa:** La API de Text-to-Speech no está habilitada en Google Cloud.

**Solución:**
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Selecciona tu proyecto: `artful-fragment-420317`
3. Ve a "APIs & Services" > "Library"
4. Busca "Cloud Text-to-Speech API"
5. Haz clic en "Enable"

---

## 📊 Verificar Logs en Render

1. Ve a tu Dashboard de Render
2. Selecciona tu servicio
3. Haz clic en "Logs"
4. Busca mensajes como:
   - ✅ `Google Cloud TTS inicializado desde Base64`
   - ❌ `Error inicializando Google Cloud TTS`

---

## 🔐 Seguridad

### ✅ Buenas Prácticas

- ✅ Usar variables de entorno en Render
- ✅ NO subir credenciales a Git
- ✅ Usar Base64 para evitar problemas de formato
- ✅ Configurar alertas de uso en Google Cloud

### ⚠️ Importante

- **NO** compartas las credenciales en mensajes o capturas de pantalla
- **NO** subas el archivo `google-cloud.json` a Git
- **SÍ** usa variables de entorno para producción
- **SÍ** configura límites de uso en Google Cloud Console

---

## 📝 Resumen de Variables de Entorno en Render

```
GOOGLE_CLOUD_CREDENTIALS_BASE64=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50IiwicHJvamVjdF9pZCI6ImFydGZ1bC1mcmFnbWVudC00MjAzMTciLC...
GOOGLE_CLOUD_PROJECT_ID=artful-fragment-420317
```

O:

```
GOOGLE_CLOUD_CREDENTIALS_JSON={"type":"service_account","project_id":"artful-fragment-420317",...}
GOOGLE_CLOUD_PROJECT_ID=artful-fragment-420317
```

---

## ✅ Checklist

- [ ] Convertir credenciales a Base64 o copiar JSON
- [ ] Agregar variables de entorno en Render
- [ ] Actualizar código de `tts-google.js`
- [ ] Desplegar cambios a Render
- [ ] Verificar logs en Render
- [ ] Probar endpoint desde la app
- [ ] Confirmar que funciona

---

**Siguiente paso:** Actualiza el código y configura las variables de entorno en Render.

¿Necesitas ayuda con algún paso específico?
