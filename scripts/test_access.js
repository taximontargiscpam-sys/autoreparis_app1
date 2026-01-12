require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAccess() {
    console.log("Testing public access with Anon key...");

    const plate = 'AA-123-BB';

    // 1. Check Vehicle
    const { data: vehicles, error: vError } = await supabase
        .from('vehicles')
        .select('id, client_id')
        .ilike('immatriculation', plate);

    if (vError) {
        console.error("❌ Vehicle Error:", vError);
    } else if (!vehicles || vehicles.length === 0) {
        console.error("❌ Vehicle Not Found");
    } else {
        console.log(`✅ Found ${vehicles.length} vehicles.`);

        for (const v of vehicles) {
            console.log(`Checking Vehicle ID: ${v.id}...`);
            const { data: intervention, error: iError } = await supabase
                .from('interventions')
                .select('id, statut')
                .eq('vehicle_id', v.id);

            if (intervention && intervention.length > 0) {
                console.log(`   ✅ Has intervention: ${intervention[0].id}`);
            } else {
                console.log(`   ❌ No intervention`);
            }
        }
    }
}

testAccess();
