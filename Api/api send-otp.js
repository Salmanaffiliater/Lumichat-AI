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
    const { email, name } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name required' });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    
    // Brevo API configuration
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    const SENDER_EMAIL = process.env.SENDER_EMAIL;
    
    // Email template
    const emailData = {
      sender: {
        name: 'LumiChat AI',
        email: SENDER_EMAIL
      },
      to: [
        {
          email: email,
          name: name
        }
      ],
      subject: 'LumiChat AI - Email Verification Code',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              background: #f5f5f5; 
              padding: 20px; 
              margin: 0;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white; 
              border-radius: 15px; 
              padding: 40px; 
              box-shadow: 0 5px 20px rgba(0,0,0,0.1); 
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
            }
            .logo { 
              font-size: 2.5em; 
              color: #1565c0; 
              font-weight: bold; 
              margin-bottom: 10px;
            }
            .otp-box { 
              background: linear-gradient(135deg, #1565c0, #0d47a1); 
              color: white; 
              padding: 25px; 
              border-radius: 12px; 
              text-align: center; 
              font-size: 2.5em; 
              letter-spacing: 8px; 
              margin: 30px 0; 
              font-weight: bold;
            }
            .message { 
              color: #333; 
              line-height: 1.8; 
              font-size: 1.05em;
            }
            .footer { 
              text-align: center; 
              color: #999; 
              font-size: 0.9em; 
              margin-top: 40px; 
              padding-top: 20px; 
              border-top: 1px solid #eee; 
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            ul {
              line-height: 2;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🤖 LumiChat AI</div>
              <h2 style="color: #333; margin: 0;">Email Verification</h2>
            </div>
            
            <div class="message">
              <p>Hello <strong>${name}</strong>,</p>
              <p>Thank you for signing up with LumiChat AI! Please use the verification code below to complete your registration:</p>
            </div>
            
            <div class="otp-box">
              ${otp}
            </div>
            
            <div class="warning">
              <strong>⚠️ Important Security Information:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This code is valid for <strong>10 minutes</strong></li>
                <li><strong>Never share</strong> this code with anyone</li>
                <li>LumiChat AI will never ask for your code via phone or email</li>
                <li>If you didn't request this code, please ignore this email</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>© 2024 LumiChat AI. All rights reserved.</p>
              <p>Powered by Advanced AI Technology</p>
              <p>Contact: 03393817860</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    // Send email via Brevo API
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Brevo API Error:', error);
      throw new Error('Failed to send email');
    }
    
    // Return success with OTP (for verification)
    return res.status(200).json({ 
      success: true,
      otp: otp,
      message: 'OTP sent successfully'
    });
    
  } catch (error) {
    console.error('Send OTP Error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to send OTP'
    });
  }
};
