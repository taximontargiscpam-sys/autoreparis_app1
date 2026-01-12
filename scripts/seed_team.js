
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

const team = [
    { email: 'thomas.garage.test@gmail.com', pass: 'Garage2024!', nom: 'Dubois', prenom: 'Thomas' },
    { email: 'sarah.garage.test@gmail.com', pass: 'Garage2024!', nom: 'Martin', prenom: 'Sarah' },
    { email: 'marc.garage.test@gmail.com', pass: 'Garage2024!', nom: 'Petit', prenom: 'Marc' },
];

async function seedTeam() {
    console.log('Seeding team with Auth...');

    for (const member of team) {
        console.log(`Processing ${member.prenom}...`);

        // Try Sign Up
        let userId = null;
        const { data: upData, error: upError } = await supabase.auth.signUp({
            email: member.email,
            password: member.pass,
        });

        if (upError) {
            console.log(`SignUp Error for ${member.prenom}: ${upError.message}`);
            // If already registered, try Sign In to get ID
            if (upError.message.includes('already registered')) {
                const { data: inData, error: inError } = await supabase.auth.signInWithPassword({
                    email: member.email,
                    password: member.pass
                });
                if (inData?.user) userId = inData.user.id;
                else console.error(`SignIn failed for ${member.prenom}:`, inError?.message);
            }
        } else if (upData?.user) {
            userId = upData.user.id;
        }

        if (userId) {
            console.log(`Got User ID: ${userId}. Inserting into public...`);
            await insertPublicUser(userId, member);
        } else {
            console.error(`Could not obtain ID for ${member.prenom}. Skipping.`);
        }
    }
}

async function insertPublicUser(id, member) {
    // 2. Insert into public.users using the ID from auth
    // We assume the RLS allows insert if we are authenticated (which we are not explicitly using the session here unless we pass it)
    // Actually, createClient defaults to 'persistSession: true' in browser, but node?
    // We should use the returned session.

    // BUT wait, RLS 'Enable all access for authenticated users' means the CLIENT must hold the session.
    // The previous signUp/signIn returns a session. We should update the client or use the token.

    // However, since we are doing this in a loop, it's tricky to switch sessions.
    // Better strategy: Use the Service Role Key if possible. But I don't have it.

    // Alternative: Just try insert. If it fails, we know RLS is blocking.
    // But wait, if I use `signUp`, it logs me in?

    // Let's rely on the fact that we might need to manually insert.
    // If RLS blocks, we are stuck without Service Key.

    // Actually, `active: true` is important.

    const { error } = await supabase.from('users').upsert({
        id: id,
        email: member.email,
        nom: member.nom,
        prenom: member.prenom,
        role: 'mecanicien',
        actif: true
    });

    if (error) {
        console.error(`Error inserting public user ${member.prenom}:`, error);
        if (error.code === '42501') {
            console.log("RLS Blocked. You normally need to allow public inserts or use a trigger.");
        }
    } else {
        console.log(`Public user ${member.prenom} seeded!`);
    }
}

seedTeam();
