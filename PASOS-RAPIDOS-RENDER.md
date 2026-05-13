# ⚡ Pasos Rápidos para Configurar Google Cloud TTS en Render

## 🎯 Objetivo
Configurar las credenciales de Google Cloud en Render para que el TTS funcione en producción.

---

## 📋 Paso 1: Copiar las Credenciales

El archivo `credentials-base64.txt` ya contiene las credenciales en Base64.

**Abre el archivo:**
```
NonaBack/credentials-base64.txt
```

**Copia TODO el contenido** (es una línea muy larga de texto)

---

## 📋 Paso 2: Configurar en Render

### 1. Ve a Render Dashboard
https://dashboard.render.com

### 2. Selecciona tu servicio
Busca y haz clic en "nona-back" (o el nombre de tu backend)

### 3. Ve a Environment
En el menú lateral izquierdo, haz clic en **"Environment"**

### 4. Agrega las Variables

#### Variable 1:
```
Nombre: GOOGLE_CLOUD_CREDENTIALS_BASE64
Valor: [Pega el contenido de credentials-base64.txt]
```

#### Variable 2:
```
Nombre: GOOGLE_CLOUD_PROJECT_ID
Valor: artful-fragment-420317
```

### 5. Guarda los Cambios
Haz clic en **"Save Changes"**

Render redesplegará automáticamente tu servicio (toma ~2-3 minutos)

---

## 📋 Paso 3: Desplegar el Código Actualizado

### Si usas Git:

```bash
cd c:\Users\julia\OneDrive\Escritorio\Trabajo Nona\NonaBack
git add .
git commit -m "Configurar Google Cloud TTS para Render"
git push
```

### Si NO usas Git:

1. Ve a tu Dashboard de Render
2. Haz clic en **"Manual Deploy"**
3. Selecciona **"Deploy latest commit"**

---

## 🧪 Paso 4: Verificar que Funciona

### Opción 1: Desde la App

1. Abre la app Nona
2. Ve al Asistente
3. Habla con Nona
4. ✅ Debería responder con Google Cloud TTS

### Opción 2: Verificar Logs en Render

1. Ve a tu Dashboard de Render
2. Selecciona tu servicio
3. Haz clic en **"Logs"**
4. Busca el mensaje:
   ```
   ✅ Google Cloud TTS inicializado desde Base64
   ```

### Opción 3: Probar con cURL

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

## ✅ Checklist

- [ ] Copiar contenido de `credentials-base64.txt`
- [ ] Ir a Render Dashboard
- [ ] Agregar variable `GOOGLE_CLOUD_CREDENTIALS_BASE64`
- [ ] Agregar variable `GOOGLE_CLOUD_PROJECT_ID`
- [ ] Guardar cambios en Render
- [ ] Desplegar código actualizado (git push o manual deploy)
- [ ] Esperar ~2-3 minutos a que Render redesplegue
- [ ] Verificar logs en Render
- [ ] Probar desde la app

---

## 🔍 Solución de Problemas

### Error: "Google Cloud TTS no está configurado correctamente"

✅ **Solución:**
1. Verifica que agregaste ambas variables en Render
2. Verifica que los nombres sean exactos (con mayúsculas)
3. Redespliega el servicio manualmente

### Error: "Invalid credentials"

✅ **Solución:**
1. Verifica que copiaste TODO el contenido de `credentials-base64.txt`
2. No debe haber espacios extra al inicio o final
3. Regenera el Base64: `node generate-credentials-base64.js`

### No veo el mensaje de inicialización en los logs

✅ **Solución:**
1. Espera 2-3 minutos después de guardar las variables
2. Verifica que el código actualizado se haya desplegado
3. Haz un "Manual Deploy" si es necesario

---

## 📞 Ayuda Adicional

Si tienes problemas, revisa:
- `CONFIGURAR-GOOGLE-CLOUD-EN-RENDER.md` - Guía completa
- Logs de Render - Para ver errores específicos
- Google Cloud Console - Para verificar que la API esté habilitada

---

**Tiempo estimado:** 5-10 minutos  
**Dificultad:** Fácil  
**Resultado:** Google Cloud TTS funcionando en producción ✅
