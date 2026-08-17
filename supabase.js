'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
Supabase Client
نسخه پایدار و یکپارچه احراز هویت
=========================================================

این فایل باید قبل از:
    login.js
    auth.js
    app.js

بارگذاری شود.

وظایف:
1. بارگذاری صحیح Supabase
2. ساخت فقط یک Client
3. نگهداری Session
4. پردازش لینک‌های ورود و تأیید ایمیل
5. در دسترس قرار دادن Client برای سایر فایل‌ها
=========================================================
*/


/* =========================================================
   SUPABASE CONFIG
========================================================= */

const SUPABASE_URL =
  'https://qxiktabmwwjygsocjcyl.supabase.co';


const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_sZvkwvD50rkboFtZzTElAQ_bxGDw-Ye';


/* =========================================================
   CHECK SUPABASE LIBRARY
========================================================= */

if (
  !window.supabase ||
  typeof window.supabase.createClient !== 'function'
) {

  console.error(
    'Supabase JavaScript library is not available.'
  );

  throw new Error(
    'Supabase JavaScript library could not be loaded.'
  );

}


/* =========================================================
   CREATE SINGLE SUPABASE CLIENT
========================================================= */

/*
  نکته مهم:

  از یک Client مشترک در کل برنامه استفاده می‌کنیم.

  persistSession:
  Session در مرورگر حفظ می‌شود.

  autoRefreshToken:
  توکن در صورت نیاز تمدید می‌شود.

  detectSessionInUrl:
  لینک ورود / تأیید ایمیل هنگام باز شدن پردازش می‌شود.

  flowType = implicit:
  برای سامانه‌ای که لینک ورود ممکن است از داخل
  برنامه ایمیل آیفون یا مرورگر دیگری باز شود،
  نسبت به PKCE وابستگی کمتری به code_verifier
  مرورگر اولیه دارد.

  برای ورود با رمز عبور نیز کاملاً قابل استفاده است.
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


/* =========================================================
   GLOBAL CLIENT REFERENCES
========================================================= */

/*
  login.js از این نام استفاده می‌کند.
*/

window.supabaseClient =
  client;


/*
  برای سازگاری با نسخه‌های قبلی برنامه
  این نام نیز حفظ می‌شود.
*/

window.adinehSupabase =
  client;


/* =========================================================
   AUTH CLIENT READY FLAG
========================================================= */

window.ADINEH_SUPABASE_READY =
  true;


/* =========================================================
   DEBUG INFORMATION
========================================================= */

console.log(
  'Adineh Supabase client initialized.'
);


/* =========================================================
   OPTIONAL AUTH URL INFORMATION
========================================================= */

/*
  اگر کاربر از لینک ایمیل وارد شده باشد،
  Supabase باید URL را پردازش کند.

  این قسمت فقط برای ثبت وضعیت است و
  Session را دستی تغییر نمی‌دهد.
*/

try {

  const currentUrl =
    new URL(
      window.location.href
    );


  const hasAuthCode =
    currentUrl.searchParams.has(
      'code'
    );


  const hasAccessToken =
    currentUrl.hash.includes(
      'access_token='
    );


  if (
    hasAuthCode ||
    hasAccessToken
  ) {

    console.log(
      'Supabase authentication callback detected.'
    );

  }

}

catch (error) {

  console.warn(
    'Could not inspect authentication callback URL.',
    error
  );

}
