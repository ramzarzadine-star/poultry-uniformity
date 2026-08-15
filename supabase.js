'use strict';

/*
  =========================================================
  ADINEH POULTRY
  Supabase Client
  =========================================================
*/

const SUPABASE_URL =
    'https://qxiktabmwwjygsocjcyl.supabase.co';

/*
  مهم:
  اینجا فقط Publishable Key / anon key قرار می‌گیرد.
  هرگز service_role یا sb_secret را اینجا قرار نده.
*/

const SUPABASE_PUBLISHABLE_KEY =
    'YOUR_SUPABASE_PUBLISHABLE_KEY';

if (
    !window.supabase ||
    typeof window.supabase.createClient !== 'function'
) {
    throw new Error(
        'Supabase JavaScript library could not be loaded.'
    );
}

window.supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        }
    );
