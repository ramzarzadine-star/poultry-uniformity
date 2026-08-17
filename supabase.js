'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
SUPABASE AUTH CLIENT
Production / GitHub Pages
=========================================================
*/

(function () {

  /*
  -------------------------------------------------------
  Supabase Project
  -------------------------------------------------------
  */

  const SUPABASE_URL =
    'https://qxiktabmwwjygsocjcyl.supabase.co';

  const SUPABASE_PUBLISHABLE_KEY =
    'sb_publishable_sZvkwvD50rkboFtZzTElAQ_bxGDw-Ye';


  /*
  -------------------------------------------------------
  Validate Supabase SDK
  -------------------------------------------------------
  */

  if (
    !window.supabase ||
    typeof window.supabase.createClient !== 'function'
  ) {

    console.error(
      '[Supabase] JavaScript SDK is not loaded.'
    );

    throw new Error(
      'Supabase JavaScript library is not loaded.'
    );
  }


  /*
  -------------------------------------------------------
  Remove accidental duplicate client
  -------------------------------------------------------
  */

  if (window.adinehSupabase) {

    console.warn(
      '[Supabase] Existing client detected. Reusing it.'
    );

    window.supabaseClient =
      window.adinehSupabase;

    return;
  }


  /*
  -------------------------------------------------------
  Create ONE Supabase Client
  -------------------------------------------------------

  PKCE is used instead of implicit flow.

  This is important for:
  - Password reset
  - Email recovery links
  - Email confirmation
  - Magic links
  - Session restoration
  - Secure browser authentication

  -------------------------------------------------------
  */

  const client =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {

        auth: {

          /*
          -----------------------------------------------
          Use PKCE authentication flow
          -----------------------------------------------
          */

          flowType: 'pkce',


          /*
          -----------------------------------------------
          Keep user logged in
          -----------------------------------------------
          */

          persistSession: true,


          /*
          -----------------------------------------------
          Automatically refresh expired tokens
          -----------------------------------------------
          */

          autoRefreshToken: true,


          /*
          -----------------------------------------------
          Supabase must inspect the URL after:

          - Magic Link
          - Email Confirmation
          - Password Recovery

          -----------------------------------------------
          */

          detectSessionInUrl: true,


          /*
          -----------------------------------------------
          Browser storage
          -----------------------------------------------
          */

          storage: window.localStorage,


          /*
          -----------------------------------------------
          Dedicated storage key

          This prevents collision with other
          Supabase projects/apps.
          -----------------------------------------------
          */

          storageKey: 'adineh-poultry-auth-v2',


          /*
          -----------------------------------------------
          Debugging disabled in production
          -----------------------------------------------
          */

          debug: false

        }

      }
    );


  /*
  -------------------------------------------------------
  Global references
  -------------------------------------------------------

  All application files should use the SAME client.

  -------------------------------------------------------
  */

  window.adinehSupabase =
    client;

  window.supabaseClient =
    client;


  /*
  -------------------------------------------------------
  Configuration reference
  -------------------------------------------------------
  */

  window.ADINEH_SUPABASE_CONFIG = {

    url:
      SUPABASE_URL,

    publishableKey:
      SUPABASE_PUBLISHABLE_KEY

  };


  /*
  -------------------------------------------------------
  Optional diagnostic
  -------------------------------------------------------
  */

  console.info(
    '[Supabase] Adineh authentication client initialized.'
  );

})();
