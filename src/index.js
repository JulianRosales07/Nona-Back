const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const relationshipRoutes = require('./routes/relationships');
const appointmentRoutes = require('./routes/appointments');
const medicineRoutes = require('./routes/medicineRoutes');
const medicineLogRoutes = require('./routes/medicineLogRoutes');
const pushTokenRoutes = require('./routes/pushTokenRoutes');
const assistantRoutes = require('./routes/assistant');
const { startNotificationScheduler } = require('./services/scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración CORS más permisiva para producción
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
}));

app.use(express.json({ limit: '10mb' })); // Aumentar límite para imágenes base64
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/relationships', relationshipRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/medicine-logs', medicineLogRoutes);
app.use('/api/push-tokens', pushTokenRoutes);
app.use('/api/assistant', assistantRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(`Accesible desde: http://192.168.80.23:${PORT}`);

    // Iniciar el scheduler de notificaciones
    startNotificationScheduler();
});
