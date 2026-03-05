const puppeteer = require('puppeteer');
const path = require('path');
const https = require('https');

const SCREENSHOTS_DIR = __dirname;
const BASE_URL = 'http://localhost:19006';
const VIEWPORT = { width: 430, height: 932, deviceScaleFactor: 3 }; // iPhone 15 Pro Max @3x = 1290x2796

const SUPABASE_URL = 'https://wjvqdvjtzwmusabbinnl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqdnFkdmp0endtdXNhYmJpbm5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODA0MDgsImV4cCI6MjA4Mjg1NjQwOH0.s9khE4mXagZNe2YgcpySdZl23DBtia35zAntt-nZK6c';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function supabaseLogin(email, password) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email, password });
    const url = new URL(`${SUPABASE_URL}/auth/v1/token?grant_type=password`);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const parsed = JSON.parse(body);
        if (res.statusCode === 200) resolve(parsed);
        else reject(new Error(parsed.msg || 'Login failed'));
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function takeScreenshots() {
  // 1. Get auth session from Supabase API
  console.log('🔑 Authenticating via Supabase API...');
  const session = await supabaseLogin('admin@autoreparis.com', 'Garage2026!');
  console.log('   ✅ Got session token');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1');

  // Enable console logging from browser
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('   [browser error]', msg.text());
  });

  try {
    // 1. Home page (public - no auth needed)
    console.log('📸 1/5 - Home page...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_home.png'), fullPage: false });
    console.log('   ✅ Home captured');

    // 2. Login page (just show the form with placeholder text)
    console.log('📸 2/5 - Login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_login.png'), fullPage: false });
    console.log('   ✅ Login captured');

    // 3. Inject auth session into localStorage and navigate to dashboard
    console.log('🔑 Injecting auth session...');
    const storageKey = `sb-wjvqdvjtzwmusabbinnl-auth-token`;
    const sessionData = JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in,
      token_type: session.token_type,
      user: session.user,
    });

    await page.evaluate((key, data) => {
      localStorage.setItem(key, data);
    }, storageKey, sessionData);

    // Navigate to dashboard (tabs)
    console.log('📸 3/5 - Dashboard...');
    await page.goto(`${BASE_URL}/(tabs)`, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(4000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_dashboard.png'), fullPage: false });
    console.log('   ✅ Dashboard captured');

    // 4. Navigate to interventions tab
    console.log('📸 4/5 - Interventions...');
    await page.goto(`${BASE_URL}/(tabs)/interventions`, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(4000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_interventions.png'), fullPage: false });
    console.log('   ✅ Interventions captured');

    // 5. Navigate to clients tab
    console.log('📸 5/5 - Clients...');
    await page.goto(`${BASE_URL}/(tabs)/clients`, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(4000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_clients.png'), fullPage: false });
    console.log('   ✅ Clients captured');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }

  console.log('\n🎉 Screenshots saved to:', SCREENSHOTS_DIR);
}

takeScreenshots();
