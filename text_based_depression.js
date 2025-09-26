const express = require('express');
const bodyParser = require('body-parser');
const Sentiment = require('sentiment');

// Initialize Express app and sentiment analyzer
const app = express();
const sentiment = new Sentiment();

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// Sentiment threshold and depression-related keywords
const NEGATIVE_THRESHOLD = -0.2; // Lowered for higher sensitivity
const DEPRESSION_KEYWORDS = ['hopeless', 'hopelessness', 'sad', 'depressed', 'worthless', 'empty', 'despair', 'helpless'];

// Analyzes text for potential depression indicators
function analyzeTextForDepression(text) {
  // Validate input
  if (typeof text !== 'string' || text.trim() === '') {
    throw new Error('Input must be a non-empty string');
  }

  // Perform sentiment analysis
  const result = sentiment.analyze(text);
  const score = result.score; // Raw sentiment score
  const comparative = result.comparative; // Normalized score per word

  // Check for depression-related keywords (case-insensitive)
  const hasDepressionKeyword = DEPRESSION_KEYWORDS.some(keyword =>
    text.toLowerCase().includes(keyword)
  );

  // Flag potential depression if sentiment is negative or keywords are present
  const isPotentiallyDepressed = comparative < NEGATIVE_THRESHOLD || hasDepressionKeyword;

  return {
    score: score,
    comparative: comparative.toFixed(3),
    vote: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral',
    potentialDepression: isPotentiallyDepressed,
    message: isPotentiallyDepressed 
      ? '⚠️ Potential signs of depression detected. Please consult a mental health professional.'
      : 'No strong negative indicators found, but always check in with loved ones.'
  };
}

// POST endpoint to analyze user-submitted text
app.post('/analyze', (req, res) => {
  const { text } = req.body;

  // Check for valid input
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ error: 'Please provide valid text input' });
  }

  try {
    const analysis = analyzeTextForDepression(text.trim());
    res.status(200).json(analysis);
  } catch (error) {
    console.error('Analysis error:', error.message);
    res.status(500).json({ error: 'Failed to analyze text: ' + error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Send POST requests to /analyze with JSON body: { "text": "Your text here" }');
});