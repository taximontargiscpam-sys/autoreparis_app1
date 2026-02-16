/**
 * AutoReparis OS — Setup Supabase (delete account + review user)
 *
 * Usage (depuis la racine du projet) :
 *   node scripts/setup_supabase.js <SUPABASE_SERVICE_ROLE_KEY>
 *
 * Le service_role key se trouve dans :
 *   Supabase Dashboard → Settings → API → service_role (secret)
 *
 * Ce script fait 2 choses :
 * 1. Cree la fonction delete_own_account() (requise par Apple)
 * 2. Cree le compte review Apple (review@autoreparis.com)
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wjvqdvjtzwmusabbinnl.supabase.co';
const SERVICE_ROLE_KEY = process.argv[2];

if (!SERVICE_ROLE_KEY) {
    console.error('\x1b[31mUsage: node scripts/setup_supabase.js <SUPABASE_SERVICE_ROLE_KEY>\x1b[0m');
    console.error('\nTrouve ta service_role key dans : Supabase Dashboard → Settings → API → service_role (secret)');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    console.log('\n\x1b[34m======== Setup Supabase pour AutoReparis OS ========\x1b[0m\n');

    // 1. Deploy delete_own_account() function
    console.log('1. Deploiement de la fonction delete_own_account()...');

    const { error: sqlError } = await supabase.rpc('exec_sql', {
        sql: `
            CREATE OR REPLACE FUNCTION public.delete_own_account()
            RETURNS void AS $$
            BEGIN
              DELETE FROM public.users WHERE id = auth.uid();
              DELETE FROM auth.users WHERE id = auth.uid();
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
            GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
        `
    });

    // If exec_sql RPC doesn't exist, try direct SQL via REST
    if (sqlError) {
        console.log('   RPC exec_sql non disponible, essai via pg_query...');

        // Use the Management API to run SQL
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
            }
        });

        console.log('\x1b[33m   [ATTENTION] La fonction SQL doit etre deployee manuellement.\x1b[0m');
        console.log('   Copie-colle le contenu de scripts/delete_account.sql dans le SQL Editor Supabase.');
        console.log('   URL: https://supabase.com/dashboard/project/wjvqdvjtzwmusabbinnl/sql/new');
    } else {
        console.log('\x1b[32m   [OK] Fonction delete_own_account() deployee\x1b[0m');
    }

    // 2. Create review account
    console.log('\n2. Creation du compte review Apple...');

    const REVIEW_EMAIL = 'review@autoreparis.com';
    const REVIEW_PASSWORD = 'AppleReview2026!';

    // Create auth user using admin API
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: REVIEW_EMAIL,
        password: REVIEW_PASSWORD,
        email_confirm: true
    });

    if (authError) {
        if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
            console.log('\x1b[33m   [INFO] Le compte review@autoreparis.com existe deja\x1b[0m');

            // Get existing user
            const { data: { users } } = await supabase.auth.admin.listUsers();
            const existingUser = users.find(u => u.email === REVIEW_EMAIL);

            if (existingUser) {
                // Update password to be sure
                await supabase.auth.admin.updateUserById(existingUser.id, {
                    password: REVIEW_PASSWORD
                });
                console.log('\x1b[32m   [OK] Mot de passe du compte review mis a jour\x1b[0m');

                // Ensure user row exists
                await ensureUserRow(existingUser.id, REVIEW_EMAIL);
            }
        } else {
            console.error('\x1b[31m   [ERREUR] ' + authError.message + '\x1b[0m');
        }
    } else {
        console.log('\x1b[32m   [OK] Compte auth cree: ' + REVIEW_EMAIL + '\x1b[0m');
        await ensureUserRow(authUser.user.id, REVIEW_EMAIL);
    }

    console.log('\n\x1b[32m======== Setup termine ========\x1b[0m');
    console.log('\nCompte review Apple :');
    console.log('  Email    : review@autoreparis.com');
    console.log('  Password : AppleReview2026!');
    console.log('  Role     : admin');
    console.log('');
}

async function ensureUserRow(userId, email) {
    // Check if user row exists
    const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

    if (!existing) {
        const { error: insertError } = await supabase
            .from('users')
            .insert({
                id: userId,
                email: email,
                nom: 'Review',
                prenom: 'Apple',
                role: 'admin',
                actif: true
            });

        if (insertError) {
            console.error('\x1b[31m   [ERREUR] Insert user row: ' + insertError.message + '\x1b[0m');
        } else {
            console.log('\x1b[32m   [OK] Ligne user creee avec role admin\x1b[0m');
        }
    } else {
        // Update role to admin
        await supabase
            .from('users')
            .update({ role: 'admin', actif: true })
            .eq('id', userId);
        console.log('\x1b[32m   [OK] Ligne user existante, role mis a jour en admin\x1b[0m');
    }
}

main().catch(err => {
    console.error('\x1b[31mErreur fatale:\x1b[0m', err.message);
    process.exit(1);
});
