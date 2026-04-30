const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

// Get current user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id:true, name:true, email:true, age:true, gender:true, height:true, weight:true, goal:true, fitnessLevel:true, dietaryPref:true, scheduleJson:true, createdAt:true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Save onboarding profile
router.post('/onboarding', authMiddleware, async (req, res) => {
  try {
    const { age, gender, height, weight, goal, fitnessLevel, dietaryPref, scheduleJson, medicalConditions } = req.body;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { age, gender, height: parseFloat(height), weight: parseFloat(weight), goal, fitnessLevel, dietaryPref, scheduleJson: JSON.stringify(scheduleJson) },
    });
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, age, height, weight, goal, fitnessLevel, dietaryPref } = req.body;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name, age, height: parseFloat(height), weight: parseFloat(weight), goal, fitnessLevel, dietaryPref },
    });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
