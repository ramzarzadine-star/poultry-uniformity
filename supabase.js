'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
SUPABASE AUTH CLIENT
GitHub Pages / Client-Side Authentication
=========================================================
*/

(function () {

  const SUPABASE_URL =
    'https://qxiktabmwwjygsocjcyl.supabase.co';

  const SUPABASE_PUBLISHABLE_KEY =
    'sb_publishable_sZvkwvD50rkboFtZzTElAQ_bxGDw-Ye';


  if (
    !window.supabase ||
    typeof window.supabase.createClient !== 'function'
  ) {

    console.error(
      'Supabase JavaScript library is not available.'
    );

    window.ADINEH_SUPABASE_READY = false;

    return;
  }


  /*
  ---------------------------------------------------------
  جلوگیری از ساخت Client دوم
  ---------------------------------------------------------
  */

  if (window.adinehSupabase) {

    window.supabaseClient =
      window.adinehSupabase;

    window.ADINEH_SUPABASE_READY = true;

    return;
  }


  /*
  ---------------------------------------------------------
  GitHub Pages یک Client-Side App است.
  
  برای این معماری از implicit flow استفاده می‌کنیم.
  ---------------------------------------------------------
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

          flowType: 'implicit',

          storage:
            window.localStorage,

          storageKey:
            'adineh-supabase-auth'

        }

      }
    );


  window.supabaseClient =
    client;

  window.adinehSupabase =
    client;

  window.ADINEH_SUPABASE_READY =
    true;


  console.log(
    'ADINEH SUPABASE AUTH READY'
  );

})();
