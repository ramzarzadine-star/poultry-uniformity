'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
SUPABASE AUTH CLIENT
GitHub Pages / Client Only
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
    'Supabase JavaScript library is not loaded.'
  );
}


/*
=========================================================
Single Supabase Client
=========================================================
*/

const adinehSupabase =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {

        /*
        GitHub Pages یک Client-Side App است.
        */

        flowType: 'implicit',

        persistSession: true,

        autoRefreshToken: true,

        detectSessionInUrl: true,

        storage:
          window.localStorage,

        storageKey:
          'adineh-auth'

      }
    }
  );


/*
=========================================================
Global access
=========================================================
*/

window.adinehSupabase =
  adinehSupabase;

window.supabaseClient =
  adinehSupabase;
