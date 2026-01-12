const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWrite() {
    console.log("Testing write to team_availability...");

    // 1. Login/Get User (Need an authenticated user for RLS)
    // Since we don't have the user's password here easily, we rely on ANON key policies.
    // BUT RLS usually requires auth.
    // If we can't login, we can't test RLS accurately from script unless we use Service Role (which we don't have).

    // Pivot: We will try to read first.
    const { data: users, error: userError } = await supabase.from('users').select('id').limit(1);
    if (userError) {
        console.error("User fetch error:", userError);
        return;
    }
    const userId = users[0]?.id;
    if (!userId) {
        console.error("No users found to test with.");
        return;
    }

    console.log("Attempting insert for user:", userId);

    const fakeDate = '2099-01-01';
    const { data, error } = await supabase
        .from('team_availability')
        .insert([{ user_id: userId, date: fakeDate, statut: 'repos' }])
        .select();

    if (error) {
        console.error("❌ WRITE FAILED:", error.message);
        console.log("Details:", error);
    } else {
        console.log("✅ WRITE SUCCESS:", data);
        // Cleanup
        await supabase.from('team_availability').delete().eq('date', fakeDate).eq('user_id', userId);
    }
}

testWrite();
