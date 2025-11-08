const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { prompt, model } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt required' });
    }
    
    const imageModel = model || 'stability';
    let imageUrl;
    
    if (imageModel === 'stability') {
      imageUrl = await generateStabilityImage(prompt);
    } else if (imageModel === 'dalle') {
      imageUrl = await generateDALLEImage(prompt);
    } else {
      throw new Error('Invalid image model');
    }
    
    return res.status(200).json({ 
      success: true,
      imageUrl: imageUrl,
      prompt: prompt
    });
    
  } catch (error) {
    console.error('Image Generation Error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Image generation failed'
    });
  }
};

// Stability AI Image Generation
async function generateStabilityImage(prompt) {
  const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`
    },
    body: JSON.stringify({
      text_prompts: [
        {
          text: prompt,
          weight: 1
        }
      ],
      cfg_scale: 7,
      height: 1024,
      width: 1024,
      steps: 30,
      samples: 1
    })
  });
  
  if (!response.ok) {
    throw new Error('Stability AI request failed');
  }
  
  const data = await response.json();
  return `data:image/png;base64,${data.artifacts[0].base64}`;
}

// OpenAI DALL-E Image Generation
async function generateDALLEImage(prompt) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024'
    })
  });
  
  if (!response.ok) {
    throw new Error('DALL-E request failed');
  }
  
  const data = await response.json();
  return data.data[0].url;
}
