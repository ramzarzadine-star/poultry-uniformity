'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
Supabase Client
نسخه یکپارچه احراز هویت
=========================================================
*/

const SUPABASE_URL =
  'https://qxiktabmwwjygsocjcyl.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_sZvkwvD50rkboFtZzTElAQ_bxGDw-Ye';


/*
=========================================================
CHECK SUPABASE LIBRARY
=========================================================
*/

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
CREATE SINGLE CLIENT
=========================================================
*/

const client =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {

        persistSession: true,

        autoRefreshToken: true,

        detectSessionInUrl: true,

        flowType: 'pkce'

      }
    }
  );


/*
=========================================================
GLOBAL REFERENCES
=========================================================
*/

window.supabaseClient =
  client;

window.adinehSupabase =
  client;
