'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
SUPABASE CLIENT
نسخه یکپارچه احراز هویت
=========================================================
*/

(function () {

  const SUPABASE_URL =
    'https://qxiktabmwwjygsocjcyl.supabase.co';

  const SUPABASE_PUBLISHABLE_KEY =
    'sb_publishable_sZvkwvD50rkboFtZzTElAQ_bxGDw-Ye';


  /*
  ========================================================
  CHECK SUPABASE LIBRARY
  ========================================================
  */

  if (
    !window.supabase ||
    typeof window.supabase.createClient !== 'function'
  ) {

    console.error(
      'Supabase JavaScript library is not available.'
    );

    return;

  }


  /*
  ========================================================
  PREVENT DUPLICATE CLIENT
  ========================================================
  */

  if (
    window.supabaseClient
  ) {

    window.adinehSupabase =
      window.supabaseClient;

    window.ADINEH_SUPABASE_READY =
      true;

    return;

  }


  /*
  ========================================================
  CREATE SINGLE CLIENT
  ========================================================
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
            'adineh-supabase-auth',

          lock: undefined

        }

      }
    );


  /*
  ========================================================
  GLOBAL REFERENCES
  ========================================================
  */

  window.supabaseClient =
    client;

  window.adinehSupabase =
    client;

  window.ADINEH_SUPABASE_READY =
    true;


  /*
  ========================================================
  DEBUG
  ========================================================
  */

  console.log(
    'Adineh Supabase client initialized.'
  );


})();
