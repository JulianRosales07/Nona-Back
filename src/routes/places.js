const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

router.get('/autocomplete', authenticateToken, async (req, res) => {
    try {
        const { input } = req.query;
        if (!input || input.length < 2) return res.json({ predictions: [] });

        const apiKey = process.env.GOOGLE_PLACES_API_KEY;
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=establishment|hospital|health&language=es&components=country:co&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        const predictions = (data.predictions || []).map(p => ({
            placeId: p.place_id,
            description: p.description,
            mainText: p.structured_formatting?.main_text || '',
            secondaryText: p.structured_formatting?.secondary_text || '',
        }));

        res.json({ predictions });
    } catch (error) {
        console.error('Error en Places autocomplete:', error);
        res.status(500).json({ error: 'Error buscando ubicaciones' });
    }
});

module.exports = router;
