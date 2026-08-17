'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
SUPABASE CLIENT
نسخه اصلاح شده
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
یک Client واحد برای کل برنامه
=========================================================
*/

const adinehSupabase =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {

        /*
        Session در مرورگر ذخیره شود
        */
        persistSession: true,

        /*
        تمدید خودکار Session
        */
        autoRefreshToken: true,

        /*
        پردازش لینک‌های Auth
        */
        detectSessionInUrl: true,

        /*
        استفاده از PKCE برای جریان امن‌تر
        */
        flowType: 'pkce'
      }
    }
  );


/*
=========================================================
Global Client
=========================================================
*/

window.adinehSupabase =
  adinehSupabase;

window.supabaseClient =
  adinehSupabase;
