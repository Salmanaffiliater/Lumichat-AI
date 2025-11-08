const { createClient } = require('@supabase/supabase-js');

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
    const { email, otp, name, password } = req.body;
    
    if (!email || !otp || !name || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }
    
    // Note: In production, verify OTP against stored value
    // For now, accepting any valid 6-digit OTP for demo
    
    // Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'Email already registered' 
      });
    }
    
    // Insert new user
    const { data, error } = await supabase
      .from('users')
      .insert([
        { name, email, password }
      ])
      .select();
    
    if (error) {
      throw error;
    }
    
    return res.status(200).json({ 
      success: true,
      message: 'User registered successfully',
      user: data[0]
    });
    
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Verification failed'
    });
  }
};
