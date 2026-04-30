const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Model fallback chain — tried in order until one succeeds
const MODEL_CHAIN = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-flash-latest',
];

const generateWellnessPlan = async (user, moodLog) => {
  const prompt = `You are an expert wellness coach. Based on the following user profile and today's mood check-in, generate a detailed 7-day personalized wellness plan.

User Profile:
- Name: ${user.name}
- Age: ${user.age || 'Not specified'}
- Gender: ${user.gender || 'Not specified'}
- Height: ${user.height ? user.height + 'cm' : 'Not specified'}
- Weight: ${user.weight ? user.weight + 'kg' : 'Not specified'}
- Primary Goal: ${user.goal || 'General Fitness'}
- Fitness Level: ${user.fitnessLevel || 'Beginner'}
- Dietary Preference: ${user.dietaryPref || 'No preference'}

Today's Check-in:
- Mood Score: ${moodLog.moodScore}/10
- Energy Level: ${moodLog.energy}/10
- Sleep Hours: ${moodLog.sleepHours}
- Notes: ${moodLog.notes || 'None'}

Mood Guidance:
${moodLog.moodScore <= 3 ? '- User is feeling low. Prioritize gentle movement, breathing exercises, rest.' : ''}
${moodLog.moodScore >= 7 && moodLog.energy >= 7 ? '- User is energetic. Push goals, add bonus circuits.' : ''}
${moodLog.moodScore >= 4 && moodLog.moodScore <= 6 ? '- User is moderate. Balanced approach, mix of strength and flexibility.' : ''}
${moodLog.sleepHours < 6 ? '- Low sleep. Include recovery-focused exercises.' : ''}

Return ONLY valid JSON (no markdown, no code fences, no explanations) in this exact format:
{
  "weeklyPlan": [
    {
      "day": 1,
      "dayName": "Monday",
      "theme": "Strength and Core",
      "mentalExercise": {
        "preName": "Box Breathing",
        "preDescription": "4 seconds in, hold 4, out 4, hold 4. Repeat 4 times.",
        "postName": "Gratitude Journal",
        "postDescription": "Write 3 things your body did well today."
      },
      "workout": [
        {
          "name": "Push-ups",
          "muscleGroup": "Chest, Triceps",
          "sets": 3,
          "reps": 12,
          "durationSeconds": null,
          "restSeconds": 60,
          "difficulty": "beginner",
          "videoSearch": "push-ups proper form",
          "formTip": "Keep your core tight, lower chest to floor."
        }
      ],
      "dietaryTip": "Focus on protein-rich breakfast to fuel morning workout.",
      "mealSuggestions": {
        "breakfast": "Oats with banana and almond butter",
        "lunch": "Grilled chicken with quinoa and salad",
        "dinner": "Lentil soup with whole grain bread",
        "snack": "Greek yogurt with berries"
      },
      "motivationalMicroGoal": "Complete all 3 sets without stopping.",
      "restDay": false
    }
  ],
  "weeklyTheme": "Building Your Foundation",
  "motivationalMessage": "Every step forward counts!"
}

Generate all 7 days with varied workouts appropriate for the user's fitness level and goal. Include at least one rest day with active recovery.`;

  let lastError = null;

  for (const model of MODEL_CHAIN) {
    try {
      console.log(`[Go Fit] Trying model: ${model}`);
      const response = await ai.models.generateContent({ model, contents: prompt });
      const text = response.text;
      const cleaned = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      const parsed = JSON.parse(cleaned);
      console.log(`[Go Fit] Plan generated successfully with model: ${model}`);
      return parsed;
    } catch (err) {
      const isQuota = err.message && (err.message.includes('429') || err.message.includes('RESOURCE_EXHAUSTED') || err.message.includes('quota'));
      const isNotFound = err.message && (err.message.includes('404') || err.message.includes('NOT_FOUND'));
      console.warn(`[Go Fit] Model ${model} failed: ${isQuota ? 'QUOTA_EXHAUSTED' : isNotFound ? 'NOT_FOUND' : err.message.substring(0, 80)}`);
      lastError = err;
      if (!isQuota && !isNotFound) throw err; // Non-quota errors bubble up immediately
    }
  }

  // All models exhausted
  const quotaErr = new Error('All Gemini models have reached their free-tier quota limit for today. Please wait until the quota resets (midnight PT) or upgrade your API key at https://ai.google.dev/');
  quotaErr.code = 'QUOTA_EXHAUSTED';
  throw quotaErr;
};

module.exports = { generateWellnessPlan };
