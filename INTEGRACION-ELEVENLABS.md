# 🎙️ Integración ElevenLabs TTS - NonaBack

## ✅ Estado: IMPLEMENTACIÓN COMPLETADA

---

## 🎯 Resumen

Se ha integrado **ElevenLabs TTS** en el backend NonaBack para proporcionar Text-to-Speech de calidad premium.

### Arquitectura:
```
App → NonaBack (Render) → ElevenLabs API → Audio MP3 → App
```

---

## 🔑 Credenciales Configuradas

### API Key:
```
e0c4de86aca056702aff07d8c39a724fbc5a18a21eb05779f321e4d65f66d473
```

### Voice ID:
```
nbcvT3C2tyOd2OsRAtUf
```

**Nota:** Ya configuradas en `.env`

---

## 📁 Archivos Modificados

### 1. `src/routes/tts.js`
- ✅ Actualizado para usar ElevenLabs API
- ✅ Endpoint POST `/api/tts` - Generar audio
- ✅ Endpoint GET `/api/tts/voices` - Listar voces
- ✅ Documentación Swagger actualizada

### 2. `.env`
```bash
# Agregado:
ELEVENLABS_API_KEY=e0c4de86aca056702aff07d8c39a724fbc5a18a21eb05779f321e4d65f66d473
ELEVENLABS_VOICE_ID=nbcvT3C2tyOd2OsRAtUf
```

---

## 🚀 Endpoints Disponibles

### POST /api/tts
Genera audio a partir de texto usando ElevenLabs.

**Request:**
```json
{
  "text": "Hola, este es un mensaje de prueba"
}
```

**Response:**
```json
{
  "success": true,
  "audio": "base64_audio_data...",
  "provider": "elevenlabs",
  "voiceId": "nbcvT3C2tyOd2OsRAtUf"
}
```

### GET /api/tts/voices
Obtiene la lista de voces disponibles en ElevenLabs.

**Response:**
```json
{
  "success": true,
  "voices": [
    {
      "voice_id": "nbcvT3C2tyOd2OsRAtUf",
      "name": "Rachel",
      "category": "premade"
    }
  ]
}
```

---

## 🧪 Pruebas Locales

### 1. Iniciar el servidor:
```bash
cd NonaBack
npm start
# o
pnpm start
```

### 2. Probar el endpoint:
```bash
# Obtener token de autenticación primero
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@email.com","password":"tu_password"}'

# Usar el token para probar TTS
curl -X POST http://localhost:3000/api/tts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{"text":"Hola, este es un mensaje de prueba"}'
```

---

## 🎛️ Configuración de Voz

### Parámetros actuales (en tts.js):
```javascript
{
    text: textToSpeak,
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
        stability: 0.5,           // 0-1 (más estable - más variable)
        similarity_boost: 0.75,   // 0-1 (menos similar - más similar)
        style: 0.0,               // 0-1 (menos estilo - más estilo)
        use_speaker_boost: true   // Mejora la claridad
    }
}
```

### Ajustar parámetros:

**Para voz más estable y clara:**
```javascript
stability: 0.7,
similarity_boost: 0.8,
style: 0.0,
```

**Para voz más expresiva:**
```javascript
stability: 0.3,
similarity_boost: 0.75,
style: 0.5,
```

---

## 🚀 Despliegue en Render

### 1. Configurar variables de entorno:

Ve a tu servicio en Render Dashboard y agrega:

```
ELEVENLABS_API_KEY=e0c4de86aca056702aff07d8c39a724fbc5a18a21eb05779f321e4d65f66d473
ELEVENLABS_VOICE_ID=nbcvT3C2tyOd2OsRAtUf
```

### 2. Desplegar cambios:
```bash
cd NonaBack
git add .
git commit -m "Integración ElevenLabs TTS"
git push
```

Render detectará el push y redesplegará automáticamente.

---

## 💰 Costos de ElevenLabs

### Plan Free:
- **10,000 caracteres/mes gratis**
- Suficiente para ~100-200 mensajes
- Ideal para pruebas

### Plan Starter ($5/mes):
- **30,000 caracteres/mes**
- ~300-600 mensajes
- Ideal para uso moderado

### Plan Creator ($22/mes):
- **100,000 caracteres/mes**
- ~1,000-2,000 mensajes
- Ideal para uso intensivo

---

## 🐛 Solución de Problemas

### Error: "API key no configurada"
**Solución:**
1. Verifica que `ELEVENLABS_API_KEY` esté en `.env`
2. Reinicia el servidor
3. En Render, verifica las variables de entorno

### Error: "Voice ID inválido"
**Solución:**
1. Verifica que `ELEVENLABS_VOICE_ID` sea: `nbcvT3C2tyOd2OsRAtUf`
2. Prueba con otra voz desde el dashboard de ElevenLabs

### Error: "Quota exceeded"
**Solución:**
1. Verifica tu uso en: https://elevenlabs.io/app/usage
2. Considera actualizar tu plan
3. Implementa caché para mensajes comunes

---

## 📊 Logs y Monitoreo

### Ver logs en desarrollo:
```bash
cd NonaBack
npm start
# Los logs mostrarán:
# [TTS] Generando audio con ElevenLabs: X caracteres
# [TTS] Audio generado exitosamente: Y bytes
```

### Ver logs en Render:
1. Ve a tu servicio en Render
2. Click en **Logs**
3. Busca mensajes con `[TTS]`

---

## ✅ Checklist de Implementación

- [x] `src/routes/tts.js` actualizado con ElevenLabs
- [x] Variables de entorno configuradas en `.env`
- [x] API Key y Voice ID correctos
- [ ] Variables configuradas en Render
- [ ] Código desplegado en Render
- [ ] Probado desde la app

---

## 📚 Recursos

- **ElevenLabs Dashboard:** https://elevenlabs.io/app
- **API Keys:** https://elevenlabs.io/app/settings/api-keys
- **Voice Library:** https://elevenlabs.io/app/voice-library
- **Usage:** https://elevenlabs.io/app/usage
- **Documentación:** https://elevenlabs.io/docs

---

## 🎉 Próximos Pasos

1. **Configurar variables en Render** (5 min)
2. **Desplegar a Render** (10 min)
3. **Probar desde la app** (5 min)

---

**Fecha:** Mayo 2026  
**Estado:** ✅ Completado  
**Backend:** NonaBack (Render)  
**Proveedor TTS:** ElevenLabs
