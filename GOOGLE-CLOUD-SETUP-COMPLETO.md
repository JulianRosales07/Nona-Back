# ✅ Configuración de Google Cloud TTS - COMPLETADA

## 📁 Ubicación de la Carpeta Credentials

La carpeta `credentials` ya está creada en:

```
📂 NonaBack/
├── 📂 credentials/          ← AQUÍ ESTÁ LA CARPETA
│   ├── 📄 README.md
│   └── 📄 google-cloud.json.example
├── 📂 src/
├── 📂 scripts/
├── 📄 .env
├── 📄 .gitignore
└── 📄 package.json
```

## ✅ Tareas Completadas

### 1. ✅ Carpeta Credentials Creada
- **Ubicación:** `NonaBack/credentials/`
- **Archivos incluidos:**
  - `README.md` - Instrucciones detalladas
  - `google-cloud.json.example` - Ejemplo de estructura

### 2. ✅ Dependencias Instaladas
```json
"@google-cloud/text-to-speech": "^6.4.1"
"@google-cloud/speech": "^7.3.1"
```

### 3. ✅ Variables de Entorno Configuradas
En el archivo `.env` se agregaron:
```env
GOOGLE_APPLICATION_CREDENTIALS=./credentials/google-cloud.json
GOOGLE_CLOUD_PROJECT_ID=tu-id-de-proyecto
```

### 4. ✅ Seguridad Configurada
- La carpeta `credentials/` está en `.gitignore`
- Tus credenciales NO se subirán a Git

---

## 🎯 Próximo Paso: Colocar tu Archivo JSON

### Paso 1: Descarga tu archivo de Google Cloud
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Descarga el archivo JSON de credenciales

### Paso 2: Coloca el archivo en la carpeta credentials
1. Abre el explorador de archivos
2. Navega a: `NonaBack/credentials/`
3. Copia tu archivo JSON descargado ahí
4. Renómbralo a: `google-cloud.json`

### Paso 3: Actualiza el ID del Proyecto
1. Abre el archivo `.env`
2. Busca la línea: `GOOGLE_CLOUD_PROJECT_ID=tu-id-de-proyecto`
3. Reemplaza `tu-id-de-proyecto` con tu ID real
   - Lo encuentras en el archivo JSON que descargaste (campo `project_id`)

---

## 📋 Verificación

Para verificar que todo está correcto, ejecuta:

```bash
cd NonaBack
dir credentials
```

Deberías ver:
- `google-cloud.json` ← Tu archivo de credenciales
- `google-cloud.json.example`
- `README.md`

---

## ⚠️ Importante

- **NO subas** el archivo `google-cloud.json` a Git (ya está protegido)
- **SÍ actualiza** el `GOOGLE_CLOUD_PROJECT_ID` en el `.env`
- **Mantén seguras** tus credenciales

---

## 🔍 Cómo Encontrar la Carpeta en VS Code

1. En el explorador de archivos de VS Code (panel izquierdo)
2. Busca la carpeta `NonaBack`
3. Expande la carpeta
4. Verás la carpeta `credentials` ahí

Si no la ves, haz clic en el botón de "Refresh" (actualizar) en el explorador de archivos.

---

**Estado:** ✅ Listo para recibir el archivo `google-cloud.json`
**Fecha:** 12 de mayo de 2026
