
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pncgdoqbbsgstcgydtro.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuY2dkb3FiYnNnc3RjZ3lkdHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MjE1MDgsImV4cCI6MjA3OTQ5NzUwOH0.meo_LJEsbGuDCzQ5anmUl9rohQ9dxCjHCqCXrsdCY7g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log("Testing connection to Website DB...");
    console.log("URL:", supabaseUrl);
    console.log("Table: devis_auto");

    try {
        const { data, error } = await supabase
            .from('devis_auto')
            .select('*')
            .limit(1);

        if (error) {
            console.error("❌ ERROR Fetching data:");
            console.error(JSON.stringify(error, null, 2));
        } else {
            console.log("✅ SUCCESS! Data received:");
            if (data.length > 0) {
                console.log("Keys found:", Object.keys(data[0]));
                console.log("Full Record:", JSON.stringify(data[0], null, 2));
            } else {
                console.log("⚠️ Table is empty.");
            }
        }
    } catch (err) {
        console.error("❌ CRTICAL EXCEPTION:", err);
    }
}

testConnection();
