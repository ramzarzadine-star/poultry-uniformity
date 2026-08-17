// supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL'; // آدرس پروژه خود را وارد کنید
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // کلید عمومی خود را وارد کنید

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});
