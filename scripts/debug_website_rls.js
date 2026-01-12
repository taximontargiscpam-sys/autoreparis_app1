
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.EXPO_PUBLIC_WEBSITE_SUPABASE_URL;
const supabaseKey = envConfig.EXPO_PUBLIC_WEBSITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Website Supabase URL or Key in .env");
    process.exit(1);
}

const supabaseWebsite = createClient(supabaseUrl, supabaseKey);

async function testArchiveLead() {
    console.log("Fetching a lead to test update...");
    // 1. Fetch a lead
    const { data: leads, error: fetchError } = await supabaseWebsite
        .from('devis_auto')
        .select('*')
        .limit(1);

    if (fetchError) {
        console.error("❌ Error fetching leads:", fetchError);
        return;
    }

    if (!leads || leads.length === 0) {
        console.log("No leads found to test.");
        return;
    }

    const lead = leads[0];
    console.log(`Testing UPDATE on lead ID: ${lead.id} (Current Status: ${lead.statut})`);

    // 2. Try to update status
    const { data: updateData, error: updateError } = await supabaseWebsite
        .from('devis_auto')
        .update({ statut: 'perdu' })
        .eq('id', lead.id)
        .select();

    if (updateError) {
        console.error("❌ UPDATE FAILED:", updateError);
        console.log("Details:", JSON.stringify(updateError, null, 2));
    } else {
        console.log("✅ UPDATE SUCCESS:", updateData);
    }
}

testArchiveLead();
