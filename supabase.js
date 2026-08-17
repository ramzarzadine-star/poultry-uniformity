'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
SUPABASE AUTH CLIENT
نسخه یکپارچه ورود و بازیابی رمز
=========================================================
*/

(function () {

  const SUPABASE_URL =
    'https://qxiktabmwwjygsocjcyl.supabase.co';

  const SUPABASE_PUBLISHABLE_KEY =
    'sb_publishable_sZvkwvD50rkboFtZzTElAQ_bxGDw-Ye';


  /*
  ========================================================
  بررسی کتابخانه Supabase
  ========================================================
  */

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
  ========================================================
  جلوگیری از ساخت چند Client
  ========================================================
  */

  if (
    window.adinehSupabase
  ) {

    window.supabaseClient =
      window.adinehSupabase;

    window.ADINEH_SUPABASE_READY =
      true;

    return;
  }


  /*
  ========================================================
  ایجاد Client
  ========================================================

  PKCE برای:
  - Magic Link
  - Password Recovery
  - Sign Up
  مناسب است.
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

          flowType: 'pkce',

          storage:
            window.localStorage,

          storageKey:
            'adineh-supabase-auth'

        }

      }
    );


  /*
  ========================================================
  Global references
  ========================================================
  */

  window.supabaseClient =
    client;

  window.adinehSupabase =
    client;

  window.ADINEH_SUPABASE_READY =
    true;


  console.log(
    'Adineh Supabase Auth initialized: PKCE'
  );

})();
