const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');
const { generateWellnessPlan } = require('../lib/claude');

// Get latest active plan
router.get('/current', authMiddleware, async (req, res) => {
  try {
    const plan = await prisma.plan.findFirst({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    if (!plan) return res.status(404).json({ error: 'No plan found' });
    res.json({ ...plan, planJson: JSON.parse(plan.planJson) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate a new plan (called after mood check-in or on demand)
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Claude API key not configured. Add GEMINI_API_KEY to .env' });
    }

    const latestMood = await prisma.moodLog.findFirst({
      where: { userId: req.userId },
      orderBy: { date: 'desc' },
    });

    const moodData = latestMood || { moodScore: 5, energy: 5, sleepHours: 7, notes: '' };
    const planData = await generateWellnessPlan(user, moodData);

    // Version number
    const lastPlan = await prisma.plan.findFirst({ where: { userId: req.userId }, orderBy: { version: 'desc' } });
    const version = lastPlan ? lastPlan.version + 1 : 1;

    const plan = await prisma.plan.create({
      data: {
        userId: req.userId,
        weekNumber: Math.ceil((new Date().getDate()) / 7),
        planJson: JSON.stringify(planData),
        version,
      },
    });

    res.json({ success: true, plan: { ...plan, planJson: planData } });
  } catch (err) {
    console.error('Plan generation error:', err.message);
    if (err.code === 'QUOTA_EXHAUSTED') {
      return res.status(503).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to generate plan: ' + err.message });
  }
});

// Get plan history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    res.json(plans.map(p => ({ ...p, planJson: JSON.parse(p.planJson) })));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
