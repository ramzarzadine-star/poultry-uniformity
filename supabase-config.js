'use strict';

/*
  =========================================================
  ADINEH POULTRY
  Supabase Configuration
  =========================================================
*/

const ADINEH_SUPABASE_URL =
  'https://qxiktabmwwjygsocjcyl.supabase.co';

const ADINEH_SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_sZvkwvD50rkboFtZzTElAQ_bxGDw-Ye';

if (!window.supabase?.createClient) {
  throw new Error(
    'Supabase library is not loaded.'
  );
}

window.adinehSupabase =
  window.supabase.createClient(
    ADINEH_SUPABASE_URL,
    ADINEH_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
