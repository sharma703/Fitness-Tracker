require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const moodRoutes = require('./routes/mood');
const planRoutes = require('./routes/plan');
const sessionRoutes = require('./routes/session');
const foodRoutes = require('./routes/food');
const journalRoutes = require('./routes/journal');
const progressRoutes = require('./routes/progress');

const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/plan', planRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/progress', progressRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Go Fit Backend Running' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🌿 Go Fit Backend running on http://localhost:${PORT}\n`);
});
