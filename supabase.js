'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
Supabase Client
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


const client =
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


/*
نام اصلی
*/
window.supabaseClient = client;


/*
نام سازگار با login.js
*/
window.adinehSupabase = client;
