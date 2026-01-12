
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.EXPO_PUBLIC_WEBSITE_SUPABASE_URL;
const supabaseKey = envConfig.EXPO_PUBLIC_WEBSITE_SUPABASE_ANON_KEY;

const supabaseWebsite = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log("Fetching one row to see available keys/columns...");
    const { data, error } = await supabaseWebsite
        .from('devis_auto')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error:", error);
    } else if (data && data.length > 0) {
        console.log("Keys found in row:", Object.keys(data[0]));
        console.log("Sample Data:", data[0]);
    } else {
        console.log("Table seems empty or not accessible.");
    }
}

inspectSchema();
