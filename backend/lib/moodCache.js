// In-memory cache: userId -> { lastCheckIn: Date }
const moodCheckInCache = new Map();

const hasDoneCheckInRecently = (userId) => {
  const entry = moodCheckInCache.get(userId);
  if (!entry) return false;
  const diff = Date.now() - entry.lastCheckIn.getTime();
  return diff < 12 * 60 * 60 * 1000; // 12 hours
};

const markCheckIn = (userId) => {
  moodCheckInCache.set(userId, { lastCheckIn: new Date() });
};

module.exports = { hasDoneCheckInRecently, markCheckIn };
