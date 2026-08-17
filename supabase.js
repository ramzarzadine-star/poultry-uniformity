'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
SUPABASE CLIENT
=========================================================
*/

const SUPABASE_URL =
  'https://qxiktabmwwjygsocjcyl.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_sZvkwvD50rkboFtZzTElAQ_bxGDw-Ye';


if (
  !window.supabase ||
  typeof window.supabase.createClient !== 'function'
) {
  throw new Error(
    'Supabase JavaScript library could not be loaded.'
  );
}


/*
=========================================================
یک Client واحد
=========================================================
*/

window.adinehSupabase =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,

        autoRefreshToken: true,

        detectSessionInUrl: true,

        flowType: 'implicit'
      }
    }
  );


window.supabaseClient =
  window.adinehSupabase;
