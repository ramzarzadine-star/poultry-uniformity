'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
SUPABASE CONFIG
=========================================================
*/

/*
این فایل فقط برای سازگاری با login.html است.

Client اصلی در supabase.js ساخته می‌شود.
*/

if (!window.adinehSupabase) {

  throw new Error(
    'Supabase client is not initialized.'
  );

}


window.supabaseClient =
  window.adinehSupabase;
