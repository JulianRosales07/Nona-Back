# ⚡ Pasos Corregidos para Configurar Google Cloud TTS en Render

## 🔍 Problema Identificado

El error `ENAMETOOLONG` indica que Render tiene la variable `GOOGLE_APPLICATION_CREDENTIALS` configurada, y está intentando usarla como nombre de archivo cuando debería usar las credenciales directamente.

---

## ✅ Solución: 3 Pasos Simples

### 📋 Paso 1: Eliminar Variable Incorrecta en Render

1. Ve a **Render Dashboard**: https://dashboard.render.com
2. Selecciona tu servicio **"nona-back"**
3. Ve a **"Environment"**
4. **ELIMINA** esta variable si existe:
   ```
   ❌ GOOGLE_APPLICATION_CREDENTIALS
   ```
   (Haz clic en el ícono de basura al lado de la variable)

---

### 📋 Paso 2: Agregar Variables Correctas en Render

En la misma página de Environment, agrega estas **2 variables**:

#### Variable 1:
```
Nombre: GOOGLE_CLOUD_CREDENTIALS_BASE64
Valor: [Copia el contenido de credentials-base64.txt]
```

**Cómo copiar el valor:**
1. Abre el archivo `NonaBack/credentials-base64.txt`
2. Selecciona TODO el contenido (Ctrl+A)
3. Copia (Ctrl+C)
4. Pega en el campo "Value" de Render

#### Variable 2:
```
Nombre: GOOGLE_CLOUD_PROJECT_ID
Valor: artful-fragment-420317
```

**Guarda los cambios:**
- Haz clic en **"Save Changes"**
- Render redesplegará automáticamente (2-3 minutos)

---

### 📋 Paso 3: Desplegar el Código Actualizado

El código ya está actualizado localmente. Ahora necesitas subirlo a Render:

#### Si usas Git:

```bash
cd c:\Users\julia\OneDrive\Escritorio\Trabajo Nona\NonaBack
git add .
git commit -m "Fix: Configurar Google Cloud TTS correctamente para Render"
git push
```

#### Si NO usas Git:

1. Ve a tu Dashboard de Render
2. Haz clic en **"Manual Deploy"**
3. Selecciona **"Deploy latest commit"**

---

## 🧪 Verificar que Funciona

### 1. Revisar Logs en Render

1. Ve a tu Dashboard de Render
2. Selecciona tu servicio
3. Haz clic en **"Logs"**
4. Busca estos mensajes:

**✅ Correcto:**
```
🔧 Inicializando Google Cloud TTS desde Base64...
✅ Google Cloud TTS inicializado desde Base64
```

**❌ Incorrecto:**
```
❌ Error inicializando Google Cloud TTS
```

### 2. Probar desde la App

1. Abre la app Nona
2. Ve al Asistente
3. Habla con Nona
4. ✅ Debería responder con Google Cloud TTS (sin error 500)

---

## 📊 Resumen de Variables en Render

### ✅ Variables Correctas (DEBEN ESTAR):

```
GOOGLE_CLOUD_CREDENTIALS_BASE64 = ew0KICAidHlwZSI6ICJzZXJ2aWNlX2FjY291bnQiLA0K...
GOOGLE_CLOUD_PROJECT_ID = artful-fragment-420317
```

### ❌ Variables Incorrectas (NO DEBEN ESTAR):

```
GOOGLE_APPLICATION_CREDENTIALS = ./credentials/google-cloud.json  ❌ ELIMINAR
```

---

## 🔍 Solución de Problemas

### Sigo viendo el error "ENAMETOOLONG"

✅ **Solución:**
1. Verifica que eliminaste `GOOGLE_APPLICATION_CREDENTIALS` de Render
2. Verifica que agregaste `GOOGLE_CLOUD_CREDENTIALS_BASE64`
3. Espera 2-3 minutos después de guardar
4. Redespliega manualmente si es necesario

### Error: "Google Cloud TTS no está configurado correctamente"

✅ **Solución:**
1. Verifica que copiaste TODO el contenido de `credentials-base64.txt`
2. No debe haber espacios extra al inicio o final
3. Verifica que el nombre de la variable sea exacto (con mayúsculas)

### No veo los mensajes de inicialización en los logs

✅ **Solución:**
1. Espera 2-3 minutos después de desplegar
2. Refresca la página de logs
3. Haz un "Manual Deploy" si es necesario

---

## ✅ Checklist Final

- [ ] Eliminar `GOOGLE_APPLICATION_CREDENTIALS` de Render
- [ ] Agregar `GOOGLE_CLOUD_CREDENTIALS_BASE64` en Render
- [ ] Agregar `GOOGLE_CLOUD_PROJECT_ID` en Render
- [ ] Guardar cambios en Render
- [ ] Desplegar código actualizado (git push o manual deploy)
- [ ] Esperar 2-3 minutos
- [ ] Verificar logs en Render
- [ ] Probar desde la app

---

## 📞 Siguiente Paso

Una vez que completes estos pasos, el error debería desaparecer y Google Cloud TTS funcionará correctamente en producción.

**Tiempo estimado:** 5 minutos  
**Dificultad:** Fácil  
**Resultado esperado:** ✅ Google Cloud TTS funcionando sin errores
