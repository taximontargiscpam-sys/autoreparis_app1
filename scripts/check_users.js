
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // If available, otherwise use Anon

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUsers() {
    console.log('--- Debugging Users Table ---');

    // 1. Check simple fetch
    const { data: users, error } = await supabase.from('users').select('*');

    if (error) {
        console.error('Error fetching users:', error);
    } else {
        console.log(`Found ${users.length} users:`);
        users.forEach(u => console.log(`- ${u.prenom} ${u.nom} (actif: ${u.actif}, role: ${u.role})`));
    }

    // 2. Check active filter specifically
    const { data: activeUsers, error: errorActive } = await supabase.from('users').select('*').eq('actif', true);
    if (errorActive) {
        console.error('Errors fetching active users:', errorActive)
    } else {
        console.log(`Found ${activeUsers.length} ACTIVE users.`);
    }

}

debugUsers();
