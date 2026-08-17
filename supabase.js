'use strict';

/*
=========================================================
 ADINEH POULTRY
 SUPABASE AUTH CLIENT
 GitHub Pages
=========================================================
*/

(function () {

  const SUPABASE_URL =
    'https://qxiktabmwwjygsocjcyl.supabase.co';

  const SUPABASE_PUBLISHABLE_KEY =
    'sb_publishable_sZvkwvD50rkboFtZzTElAQ_bxGDw-Ye';


  /*
  =======================================================
  بررسی کتابخانه Supabase
  =======================================================
  */

  if (
    !window.supabase ||
    typeof window.supabase.createClient !== 'function'
  ) {

    console.error(
      'Supabase JavaScript library is not loaded.'
    );

    window.ADINEH_SUPABASE_READY = false;

    return;
  }


  /*
  =======================================================
  اگر Client قبلاً ساخته شده، دوباره نساز
  =======================================================
  */

  if (window.adinehSupabase) {

    window.supabaseClient =
      window.adinehSupabase;

    window.ADINEH_SUPABASE_READY = true;

    return;
  }


  /*
  =======================================================
  ساخت Client اصلی
  =======================================================

  از PKCE استفاده می‌کنیم.

  این روش برای:
  - Login
  - Email verification
  - Magic Link
  - Password Recovery

  مناسب‌تر و پایدارتر است.
  =======================================================
  */

  const client =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {

          /*
           * Session در مرورگر ذخیره شود
           */
          persistSession: true,

          /*
           * Refresh Token به صورت خودکار تمدید شود
           */
          autoRefreshToken: true,

          /*
           * URL callback توسط Supabase بررسی شود
           */
          detectSessionInUrl: true,

          /*
           * استفاده از PKCE
           */
          flowType: 'pkce',

          /*
           * محل ذخیره Session
           */
          storage: window.localStorage,

          /*
           * نام ثابت برای Session
           */
          storageKey: 'adineh-supabase-auth'

        }
      }
    );


  /*
  =======================================================
  Global Client
  =======================================================
  */

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
