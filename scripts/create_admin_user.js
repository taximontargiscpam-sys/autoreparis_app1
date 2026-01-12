
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

const ADMIN_EMAIL = 'admin@autoreparis.com';
const ADMIN_PASS = 'Garage2026!'; // Strong default password

async function createAdmin() {
    console.log(`Creating Admin Account: ${ADMIN_EMAIL}...`);

    const { data, error } = await supabase.auth.signUp({
        email: ADMIN_EMAIL,
        password: ADMIN_PASS,
    });

    if (error) {
        console.error("Error creating user:", error.message);
        if (error.message.includes('already registered')) {
            console.log("User already exists. You can log in with: " + ADMIN_EMAIL);
        }
    } else {
        console.log("------------------------------------------");
        console.log("✅ COMPTE GARAGE CRÉÉ AVEC SUCCÈS");
        console.log("------------------------------------------");
        console.log(`Email    : ${ADMIN_EMAIL}`);
        console.log(`Password : ${ADMIN_PASS}`);
        console.log("------------------------------------------");
        console.log("Veuillez noter ces identifiants et les communiquer au garage.");

        // Auto-create entry in public.users table if not handled by trigger (just to be safe)
        if (data.user) {
            const { error: profileError } = await supabase.from('users').insert([{
                id: data.user.id,
                email: ADMIN_EMAIL,
                role: 'admin',
                nom: 'Admin',
                prenom: 'Garage'
            }]);
            if (profileError) {
                // Ignore duplicate key error if trigger exists
                if (!profileError.message.includes('duplicate key')) {
                    console.error("Error creating profile:", profileError.message);
                }
            }
        }
    }
}

createAdmin();
