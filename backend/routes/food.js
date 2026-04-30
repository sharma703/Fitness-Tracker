const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');
const axios = require('axios');

// Log food entry
router.post('/log', authMiddleware, async (req, res) => {
  try {
    const { mealName, nutrientsJson, aiFeedback } = req.body;
    const log = await prisma.foodLog.create({
      data: {
        userId: req.userId,
        mealName,
        nutrientsJson: JSON.stringify(nutrientsJson || {}),
        aiFeedback,
      },
    });
    res.status(201).json({ success: true, log });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get today's food logs
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const logs = await prisma.foodLog.findMany({
      where: { userId: req.userId, date: { gte: start } },
      orderBy: { date: 'asc' },
    });
    res.json(logs.map(l => ({ ...l, nutrientsJson: JSON.parse(l.nutrientsJson) })));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Search food via Edamam API
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });

    const appId = process.env.EDAMAM_APP_ID;
    const appKey = process.env.EDAMAM_APP_KEY;

    if (!appId || !appKey) {
      return res.status(503).json({ error: 'Edamam API keys not configured. Add EDAMAM_APP_ID and EDAMAM_APP_KEY to .env' });
    }

    const response = await axios.get('https://api.edamam.com/api/food-database/v2/parser', {
      params: { ingr: q, 'app_id': appId, 'app_key': appKey },
    });

    const hints = response.data.hints?.slice(0, 5).map(h => ({
      name: h.food.label,
      calories: h.food.nutrients?.ENERC_KCAL,
      protein: h.food.nutrients?.PROCNT,
      carbs: h.food.nutrients?.CHOCDF,
      fat: h.food.nutrients?.FAT,
      fiber: h.food.nutrients?.FIBTG,
    }));

    res.json(hints);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Food search failed' });
  }
});

// Get food history (last 7 days)
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const logs = await prisma.foodLog.findMany({
      where: { userId: req.userId, date: { gte: since } },
      orderBy: { date: 'desc' },
    });
    res.json(logs.map(l => ({ ...l, nutrientsJson: JSON.parse(l.nutrientsJson) })));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
