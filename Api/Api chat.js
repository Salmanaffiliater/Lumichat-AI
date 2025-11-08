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
    const { message, ai, history } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }
    
    const aiType = ai || 'openai';
    let response;
    
    switch (aiType) {
      case 'openai':
        response = await callOpenAI(message, history);
        break;
      case 'gemini':
        response = await callGemini(message, history);
        break;
      case 'claude':
        response = await callClaude(message, history);
        break;
      default:
        throw new Error('Invalid AI type');
    }
    
    return res.status(200).json({ 
      success: true,
      response: response,
      ai: aiType
    });
    
  } catch (error) {
    console.error('Chat Error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'AI request failed'
    });
  }
};

// OpenAI API Call
async function callOpenAI(message, history = []) {
  const messages = [
    { role: 'system', content: 'You are a helpful AI assistant named LumiChat AI.' },
    ...history,
    { role: 'user', content: message }
  ];
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.7,
      max_tokens: 500
    })
  });
  
  if (!response.ok) {
    throw new Error('OpenAI API request failed');
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// Google Gemini API Call
async function callGemini(message, history = []) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: message }
          ]
        }
      ]
    })
  });
  
  if (!response.ok) {
    throw new Error('Gemini API request failed');
  }
  
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Anthropic Claude API Call
async function callClaude(message, history = []) {
  const messages = [
    ...history,
    { role: 'user', content: message }
  ];
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 500,
      messages: messages
    })
  });
  
  if (!response.ok) {
    throw new Error('Claude API request failed');
  }
  
  const data = await response.json();
  return data.content[0].text;
}
