# ✅ Ruta de Prueba de Google Cloud TTS - COMPLETADA

## 📋 Resumen de Cambios

### 1. ✅ Archivo de Ruta Creado
**Ubicación:** `NonaBack/src/routes/tts-google.js`

Esta ruta maneja las solicitudes POST para convertir texto a voz usando Google Cloud TTS.

**Características:**
- Endpoint: `POST /api/tts-google`
- Acepta: `{ text: "tu texto aquí" }`
- Retorna: `{ success: true, audio: "base64..." }`
- Voz: Español de Colombia (es-CO-Standard-A, femenina)
- Formato: MP3

### 2. ✅ Ruta Registrada en index.js
La ruta ha sido agregada al servidor principal en:
- `NonaBack/src/index.js`
- Endpoint disponible: `http://localhost:3000/api/tts-google`

### 3. ✅ Variables de Entorno Configuradas
El archivo `.env` tiene:
```env
GOOGLE_APPLICATION_CREDENTIALS=./credentials/google-cloud.json
GOOGLE_CLOUD_PROJECT_ID=artful-fragment-420317
```

### 4. ✅ Script de Prueba Creado
**Ubicación:** `NonaBack/test-google-tts.js`

---

## 🚀 Cómo Probar

### Opción 1: Usando el Script de Prueba (Recomendado)

1. **Inicia el servidor** (en una terminal):
   ```bash
   cd NonaBack
   npm start
   ```
   O si tienes nodemon:
   ```bash
   npm run dev
   ```

2. **Ejecuta el script de prueba** (en otra terminal):
   ```bash
   cd NonaBack
   node test-google-tts.js
   ```

3. **Resultado esperado:**
   ```
   🧪 Probando Google Cloud TTS...
   
   ✅ Prueba exitosa!
   📊 Respuesta del servidor:
      - Success: true
      - Audio recibido: UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQ...
      - Tamaño del audio (base64): 12345 caracteres
   
   🎉 Google Cloud TTS está funcionando correctamente!
   ```

### Opción 2: Usando cURL

```bash
curl -X POST http://localhost:3000/api/tts-google \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"Hola, soy Nona\"}"
```

### Opción 3: Usando Postman o Thunder Client

1. **Método:** POST
2. **URL:** `http://localhost:3000/api/tts-google`
3. **Headers:** 
   - `Content-Type: application/json`
4. **Body (raw JSON):**
   ```json
   {
     "text": "Hola, soy Nona, tu asistente virtual"
   }
   ```

---

## 📊 Respuesta Esperada

### Éxito (200 OK):
```json
{
  "success": true,
  "audio": "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQ..."
}
```

El campo `audio` contiene el archivo MP3 codificado en base64.

### Error (400 Bad Request):
```json
{
  "success": false,
  "error": "Texto requerido"
}
```

### Error (500 Internal Server Error):
```json
{
  "success": false,
  "error": "Mensaje de error específico"
}
```

---

## 🔍 Solución de Problemas

### Error: "Could not load the default credentials"

**Causa:** El archivo de credenciales no se encuentra o la variable de entorno no está configurada.

**Solución:**
1. Verifica que el archivo existe: `NonaBack/credentials/google-cloud.json`
2. Verifica el `.env`:
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=./credentials/google-cloud.json
   ```
3. Reinicia el servidor

### Error: "Permission denied" o "API not enabled"

**Causa:** La API de Text-to-Speech no está habilitada en Google Cloud.

**Solución:**
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Selecciona tu proyecto: `artful-fragment-420317`
3. Ve a "APIs & Services" > "Library"
4. Busca "Cloud Text-to-Speech API"
5. Haz clic en "Enable"

### Error: "ECONNREFUSED" al ejecutar el test

**Causa:** El servidor no está corriendo.

**Solución:**
1. Inicia el servidor: `npm start` o `npm run dev`
2. Verifica que esté corriendo en el puerto 3000

---

## 📁 Estructura de Archivos

```
NonaBack/
├── credentials/
│   └── google-cloud.json          ✅ Credenciales
├── src/
│   ├── routes/
│   │   └── tts-google.js          ✅ Nueva ruta
│   └── index.js                   ✅ Ruta registrada
├── .env                           ✅ Variables configuradas
├── test-google-tts.js             ✅ Script de prueba
└── package.json
```

---

## ✅ Checklist de Verificación

- [x] Carpeta `credentials/` creada
- [x] Archivo `google-cloud.json` colocado
- [x] Dependencias instaladas (`@google-cloud/text-to-speech`)
- [x] Variables de entorno configuradas
- [x] Ruta `tts-google.js` creada
- [x] Ruta registrada en `index.js`
- [x] Script de prueba creado
- [ ] Servidor iniciado
- [ ] Prueba ejecutada exitosamente

---

## 🎯 Próximos Pasos

Una vez que la prueba sea exitosa:

1. **Integrar con el frontend** (Nona-App)
2. **Reemplazar ElevenLabs** con Google Cloud TTS
3. **Optimizar la configuración** de voz y parámetros
4. **Implementar caché** para respuestas frecuentes
5. **Monitorear uso** y costos en Google Cloud Console

---

**Estado:** ✅ Listo para probar
**Fecha:** 12 de mayo de 2026
**Proyecto:** artful-fragment-420317
