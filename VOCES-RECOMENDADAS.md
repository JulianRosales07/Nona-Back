# 🎙️ Voces Recomendadas para Nona

## ✅ Configuración Actual

**Voz activa:** `es-US-Neural2-A`
- Tipo: Neural2 (Premium)
- Género: Femenina
- Idioma: Español de Estados Unidos
- Calidad: Excelente, sonido muy natural

---

## 🌟 Voces Recomendadas por Calidad

### 1. Neural2 (Mejor Calidad - Recomendado)

#### Español de Estados Unidos (es-US)
```javascript
// Femeninas
{ languageCode: 'es-US', name: 'es-US-Neural2-A' }  // ⭐ ACTUAL

// Masculinas
{ languageCode: 'es-US', name: 'es-US-Neural2-B' }
{ languageCode: 'es-US', name: 'es-US-Neural2-C' }
```

#### Español de España (es-ES)
```javascript
// Femeninas
{ languageCode: 'es-ES', name: 'es-ES-Neural2-A' }
{ languageCode: 'es-ES', name: 'es-ES-Neural2-E' }
{ languageCode: 'es-ES', name: 'es-ES-Neural2-H' }

// Masculinas
{ languageCode: 'es-ES', name: 'es-ES-Neural2-F' }
{ languageCode: 'es-ES', name: 'es-ES-Neural2-G' }
```

### 2. WaveNet (Alta Calidad - Buen Balance)

#### Español de Estados Unidos (es-US)
```javascript
// Femenina
{ languageCode: 'es-US', name: 'es-US-Wavenet-A' }

// Masculinas
{ languageCode: 'es-US', name: 'es-US-Wavenet-B' }
{ languageCode: 'es-US', name: 'es-US-Wavenet-C' }
```

#### Español de España (es-ES)
```javascript
// Femeninas
{ languageCode: 'es-ES', name: 'es-ES-Wavenet-F' }
{ languageCode: 'es-ES', name: 'es-ES-Wavenet-H' }

// Masculinas
{ languageCode: 'es-ES', name: 'es-ES-Wavenet-E' }
{ languageCode: 'es-ES', name: 'es-ES-Wavenet-G' }
```

### 3. Studio (Premium - Calidad Profesional)

```javascript
// Español de España
{ languageCode: 'es-ES', name: 'es-ES-Studio-C' }  // Femenina
{ languageCode: 'es-ES', name: 'es-ES-Studio-F' }  // Masculina

// Español de Estados Unidos
{ languageCode: 'es-US', name: 'es-US-Studio-B' }  // Masculina
```

### 4. Standard (Calidad Básica - Más Económico)

```javascript
// Español de Estados Unidos
{ languageCode: 'es-US', name: 'es-US-Standard-A' }  // Femenina
{ languageCode: 'es-US', name: 'es-US-Standard-B' }  // Masculina
{ languageCode: 'es-US', name: 'es-US-Standard-C' }  // Masculina

// Español de España
{ languageCode: 'es-ES', name: 'es-ES-Standard-F' }  // Femenina
{ languageCode: 'es-ES', name: 'es-ES-Standard-H' }  // Femenina
{ languageCode: 'es-ES', name: 'es-ES-Standard-E' }  // Masculina
{ languageCode: 'es-ES', name: 'es-ES-Standard-G' }  // Masculina
```

---

## 🔄 Cómo Cambiar la Voz

### Opción 1: Editar el archivo de ruta

Abre `src/routes/tts-google.js` y modifica:

```javascript
const request = {
  input: { text },
  voice: {
    languageCode: 'es-US',           // Cambia esto
    name: 'es-US-Neural2-A',         // Cambia esto
    ssmlGender: 'FEMALE'             // FEMALE o MALE
  },
  audioConfig: { audioEncoding: 'MP3' },
};
```

### Opción 2: Hacer la voz configurable

Puedes modificar la ruta para aceptar parámetros de voz:

```javascript
router.post('/', async (req, res) => {
  try {
    const { 
      text, 
      languageCode = 'es-US',
      voiceName = 'es-US-Neural2-A',
      gender = 'FEMALE'
    } = req.body;
    
    // ... resto del código
  }
});
```

Luego en el frontend puedes enviar:

```javascript
{
  text: "Hola",
  languageCode: "es-ES",
  voiceName: "es-ES-Neural2-A",
  gender: "FEMALE"
}
```

---

## 💰 Consideraciones de Costo

### Precios Aproximados (por millón de caracteres)

1. **Standard**: ~$4 USD
2. **WaveNet**: ~$16 USD
3. **Neural2**: ~$16 USD
4. **Studio**: ~$160 USD

### Recomendación para Producción

Para una app como Nona:
- **Desarrollo/Testing**: Standard (más económico)
- **Producción**: Neural2 (mejor calidad/precio)
- **Premium**: Studio (solo si necesitas calidad profesional)

---

## 🎯 Recomendación Final

Para Nona, te recomiendo mantener **`es-US-Neural2-A`** porque:

✅ Excelente calidad de voz natural
✅ Buen precio (mismo que WaveNet)
✅ Español neutro (funciona bien para toda Latinoamérica)
✅ Voz femenina (como Nona)

Si quieres probar otras voces, las mejores alternativas serían:
- `es-ES-Neural2-A` (Español de España, femenina)
- `es-US-Wavenet-A` (Más económica, buena calidad)

---

## 🧪 Probar Diferentes Voces

Para probar una voz específica, edita `test-google-tts.js` y agrega:

```javascript
const response = await axios.post(`${BASE_URL}/api/tts-google`, {
  text: 'Hola, soy Nona',
  languageCode: 'es-ES',
  voiceName: 'es-ES-Neural2-A',
  gender: 'FEMALE'
});
```

O usa el script `list-spanish-voices.js` para ver todas las opciones disponibles.

---

**Última actualización:** 12 de mayo de 2026
**Voz actual:** es-US-Neural2-A ✅
