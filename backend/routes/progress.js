const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

// Get weekly progress summary
router.get('/weekly', authMiddleware, async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const [sessions, moods, foodLogs, badges] = await Promise.all([
      prisma.session.findMany({ where: { userId: req.userId, date: { gte: since } } }),
      prisma.moodLog.findMany({ where: { userId: req.userId, date: { gte: since } }, orderBy: { date: 'asc' } }),
      prisma.foodLog.findMany({ where: { userId: req.userId, date: { gte: since } } }),
      prisma.badge.findMany({ where: { userId: req.userId }, orderBy: { earnedAt: 'desc' }, take: 10 }),
    ]);

    const avgMood = moods.length ? (moods.reduce((a, m) => a + m.moodScore, 0) / moods.length).toFixed(1) : null;
    const avgSleep = moods.length ? (moods.reduce((a, m) => a + m.sleepHours, 0) / moods.length).toFixed(1) : null;
    const totalCalories = sessions.reduce((a, s) => a + (s.calories || 0), 0);
    const workoutDays = new Set(sessions.map(s => new Date(s.date).toDateString())).size;

    res.json({
      workoutDays,
      totalSessions: sessions.length,
      totalMinutes: sessions.reduce((a, s) => a + s.duration, 0),
      totalCaloriesBurned: Math.round(totalCalories),
      avgMood,
      avgSleep,
      moodTrend: moods.map(m => ({ date: m.date, score: m.moodScore, energy: m.energy })),
      nutritionDays: new Set(foodLogs.map(f => new Date(f.date).toDateString())).size,
      badges,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Award a badge
router.post('/badge', authMiddleware, async (req, res) => {
  try {
    const { badgeName } = req.body;
    const existing = await prisma.badge.findFirst({ where: { userId: req.userId, badgeName } });
    if (existing) return res.json({ success: true, badge: existing, alreadyEarned: true });

    const badge = await prisma.badge.create({ data: { userId: req.userId, badgeName } });
    res.json({ success: true, badge });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
