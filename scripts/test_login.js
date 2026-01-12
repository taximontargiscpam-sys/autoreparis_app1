
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Key in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const EMAIL = 'admin@autoreparis.com';
const PASS = 'Garage2026!';

async function testLogin() {
    console.log(`Testing Login for: ${EMAIL}...`);

    const { data, error } = await supabase.auth.signInWithPassword({
        email: EMAIL,
        password: PASS,
    });

    if (error) {
        console.error("❌ LOGIN FAILED:", error.message);
        console.log("Details:", JSON.stringify(error, null, 2));
    } else {
        console.log("✅ LOGIN SUCCESS!");
        console.log("User ID:", data.user.id);
        console.log("Session active.");
    }
}

testLogin();
