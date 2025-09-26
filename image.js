const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const fs = require('fs');

const app = express();
const upload = multer();

// ⚠️ Replace with your Hugging Face model (example emotion model)
const HF_MODEL = "trpakov/vit-face-expression"; 
const HF_TOKEN = "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";

async function analyzeImageWithHF(buffer) {
  const response = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/octet-stream",
    },
    body: buffer
  });

  if (!response.ok) {
    throw new Error(`HF API error: ${response.statusText}`);
  }

  const result = await response.json();
  return result;
}

app.post('/analyze-image', upload.single('photo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Please upload an image file" });
  }

  try {
    const analysis = await analyzeImageWithHF(req.file.buffer);

    // Example: map emotions to depression risk
    let depressionRisk = "Low";
    if (analysis[0]?.label === "sad" || analysis[0]?.label === "fear") {
      depressionRisk = "High";
    }

    res.json({
      raw: analysis,
      depressionRisk
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
