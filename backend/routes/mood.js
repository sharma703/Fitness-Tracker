const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');
const { hasDoneCheckInRecently, markCheckIn } = require('../lib/moodCache');

// Check if check-in is needed
router.get('/status', authMiddleware, (req, res) => {
  const needed = !hasDoneCheckInRecently(req.userId);
  res.json({ checkInNeeded: needed });
});

// Submit mood check-in
router.post('/checkin', authMiddleware, async (req, res) => {
  try {
    const { moodScore, energy, sleepHours, notes } = req.body;
    if (moodScore == null || energy == null || sleepHours == null)
      return res.status(400).json({ error: 'moodScore, energy, and sleepHours are required' });

    const log = await prisma.moodLog.create({
      data: { userId: req.userId, moodScore: parseInt(moodScore), energy: parseInt(energy), sleepHours: parseFloat(sleepHours), notes },
    });
    markCheckIn(req.userId);
    res.json({ success: true, log });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get mood history (last 30 days)
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const logs = await prisma.moodLog.findMany({
      where: { userId: req.userId, date: { gte: since } },
      orderBy: { date: 'asc' },
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Latest mood
router.get('/latest', authMiddleware, async (req, res) => {
  try {
    const log = await prisma.moodLog.findFirst({
      where: { userId: req.userId },
      orderBy: { date: 'desc' },
    });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
