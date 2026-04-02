const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const redis = require('../utils/redis');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

const JWT_SECRET = process.env.JWT_SECRET || 'createx_super_secret_key_2024';
if (!process.env.JWT_SECRET) {
  console.warn('[WARNING] JWT_SECRET not found in environment. Using development fallback.');
}
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '9390091939@csikare';
const REVIEWER_PASSWORD = process.env.REVIEWER_PASSWORD || 'CREATEX@9390198225';

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    let user = null;
    let role = '';

    // 1. ADMIN Login
    if (username === 'CREATEX_CSI_ADMIN' && password === ADMIN_PASSWORD) {
      user = { id: 'admin', username: 'CREATEX_CSI_ADMIN' };
      role = 'admin';
    }
    // 2. REVIEWER Login
    else if (username.startsWith('reviewer_') && password === REVIEWER_PASSWORD) {
      const { data: reviewer } = await supabase.from('reviewers').select('*').eq('id', username).single();
      if (reviewer) {
        user = reviewer;
        role = 'reviewer';
      }
    }
    // 3. VOLUNTEER Login
    else if (username.startsWith('CREATEX_vol_')) {
      const { data: volunteer } = await supabase.from('volunteers').select('*').eq('id', username).single();
      if (volunteer && volunteer.reg_no === password) {
        user = volunteer;
        role = 'volunteer';
      }
    }
    // 4. TEAM Login
    else if (username.startsWith('CREATOR-')) {
      const { data: team } = await supabase.from('teams').select('*').eq('id', username).single();
      if (team && team.leader_reg === password) {
        user = team;
        role = 'team';
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // --- One-Device Login Enforcement (Redis) ---
    const sessionId = Math.random().toString(36).substring(7);
    await redis.set(`session:${username}`, sessionId);

    const token = jwt.sign({ 
      id: user.id, 
      username, 
      role, 
      cluster: user.cluster || null,
      name: user.name || null,
      sessionId 
    }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ token, role, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const validateSession = async (req, res, next) => {
  // --- LOAD TEST BYPASS (STABILIZATION PHASE) ---
  const bypassSecret = req.headers['x-load-test-secret'];
  if (bypassSecret && bypassSecret === process.env.LOAD_TEST_SECRET) {
      req.user = { id: req.headers['x-team-id'] || 'CREATOR-109', role: 'team' };
      return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const activeSessionId = await redis.get(`session:${decoded.username}`);

    if (activeSessionId !== decoded.sessionId) {
      return res.status(403).json({ 
        status: 'denied', 
        code: 'SESSION_INVALIDATED', 
        error: 'Session invalidated (Logged in from another device)' 
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { login, validateSession };
