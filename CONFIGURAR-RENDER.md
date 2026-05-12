# 🚀 Configurar ElevenLabs en Render - NonaBack

## ⚡ Guía Rápida (5 minutos)

---

## 📋 Pasos para Configurar

### 1. Ir a Render Dashboard
```
https://dashboard.render.com
```

### 2. Seleccionar tu servicio NonaBack
- Busca tu servicio backend
- Click en el servicio

### 3. Ir a Environment
- En el menú lateral: **Environment**
- Click en **Add Environment Variable**

### 4. Agregar las siguientes variables:

#### Variable 1: ELEVENLABS_API_KEY
```
Key: ELEVENLABS_API_KEY
Value: e0c4de86aca056702aff07d8c39a724fbc5a18a21eb05779f321e4d65f66d473
```

#### Variable 2: ELEVENLABS_VOICE_ID
```
Key: ELEVENLABS_VOICE_ID
Value: nbcvT3C2tyOd2OsRAtUf
```

### 5. Guardar
- Click en **Save Changes**
- Render redesplegará automáticamente

---

## 🔄 Desplegar Cambios de Código

### Opción 1: Push automático
```bash
cd NonaBack
git add .
git commit -m "Integración ElevenLabs TTS"
git push
```

### Opción 2: Deploy manual
1. Ve a tu servicio en Render
2. Click en **Manual Deploy**
3. Selecciona la rama
4. Click en **Deploy**

---

## ✅ Verificar que Funciona

### 1. Esperar a que termine el deploy
- Status: **Live** (verde)

### 2. Verificar logs
- Ve a **Logs**
- Busca: `Servidor corriendo en puerto 3000`
- Busca: `[TTS]` para ver logs de TTS

### 3. Probar desde la app
```bash
cd Nona-App
npx expo start
```

---

## 🐛 Solución de Problemas

### Error: "ELEVENLABS_API_KEY no configurada"
1. Verifica que agregaste la variable en Render
2. Verifica el nombre exacto: `ELEVENLABS_API_KEY`
3. Redespliega manualmente

### El servicio no redespliega
1. Click en **Manual Deploy**
2. Selecciona la rama
3. Click en **Deploy**

---

## 🎯 Checklist

- [ ] Variables agregadas en Render
  - [ ] `ELEVENLABS_API_KEY`
  - [ ] `ELEVENLABS_VOICE_ID`
- [ ] Código pusheado
- [ ] Deploy completado (Live)
- [ ] Logs sin errores
- [ ] App probada

---

**Tiempo:** 5 minutos  
**Dificultad:** Muy fácil
