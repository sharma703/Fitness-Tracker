const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

// Log a completed session
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { exercisesDone, duration, calories, moodBefore, moodAfter } = req.body;
    const session = await prisma.session.create({
      data: {
        userId: req.userId,
        exercisesDone: JSON.stringify(exercisesDone),
        duration: parseInt(duration),
        calories: calories ? parseFloat(calories) : null,
        moodBefore: moodBefore ? parseInt(moodBefore) : null,
        moodAfter: moodAfter ? parseInt(moodAfter) : null,
      },
    });
    res.status(201).json({ success: true, session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get session history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.userId },
      orderBy: { date: 'desc' },
      take: 20,
    });
    res.json(sessions.map(s => ({ ...s, exercisesDone: JSON.parse(s.exercisesDone) })));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get session stats summary
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({ where: { userId: req.userId } });
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((a, s) => a + s.duration, 0);
    const totalCalories = sessions.reduce((a, s) => a + (s.calories || 0), 0);
    const avgMoodBefore = sessions.filter(s => s.moodBefore).reduce((a, s, _, arr) => a + s.moodBefore / arr.length, 0);
    const avgMoodAfter = sessions.filter(s => s.moodAfter).reduce((a, s, _, arr) => a + s.moodAfter / arr.length, 0);
    res.json({ totalSessions, totalMinutes, totalCalories: Math.round(totalCalories), avgMoodBefore: avgMoodBefore.toFixed(1), avgMoodAfter: avgMoodAfter.toFixed(1) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
