'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
SUPABASE AUTH CLIENT
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
  جلوگیری از ساخت Client دوم
  =======================================================
  */

  if (window.adinehSupabase) {

    window.supabaseClient =
      window.adinehSupabase;

    window.ADINEH_SUPABASE_READY =
      true;

    return;
  }


  /*
  =======================================================
  ساخت Client اصلی
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
           * Token به صورت خودکار Refresh شود
           */
          autoRefreshToken: true,

          /*
           * لینک‌های Auth از URL خوانده شوند
           */
          detectSessionInUrl: true,

          /*
           * برای GitHub Pages
           * و لینک‌های قدیمی Supabase
           */
          flowType: 'implicit',

          /*
           * Storage
           */
          storage:
            window.localStorage,

          /*
           * نام ثابت Session
           */
          storageKey:
            'adineh-supabase-auth'

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
