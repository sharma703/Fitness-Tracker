const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

// Create/update journal entry for today
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { preSessionText, postSessionText } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if entry exists today
    let entry = await prisma.journalEntry.findFirst({
      where: { userId: req.userId, date: { gte: today } },
    });

    if (entry) {
      entry = await prisma.journalEntry.update({
        where: { id: entry.id },
        data: { preSessionText, postSessionText },
      });
    } else {
      entry = await prisma.journalEntry.create({
        data: { userId: req.userId, preSessionText, postSessionText },
      });
    }
    res.json({ success: true, entry });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get journal entries (last 30 days)
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const entries = await prisma.journalEntry.findMany({
      where: { userId: req.userId, date: { gte: since } },
      orderBy: { date: 'desc' },
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
