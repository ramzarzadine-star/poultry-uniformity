'use strict';

/*
  =========================================================
  ADINEH POULTRY
  Authentication Guard
  =========================================================
*/

(function () {

  const supabase =
    window.adinehSupabase;

  const LOGIN_PAGE =
    'login.html';

  const ALLOWED_STATUS =
    new Set(['active']);

  window.ADINEH_AUTH = {
    user: null,
    profile: null,
    ready: false
  };


  function goLogin(message) {

    const url =
      new URL(
        LOGIN_PAGE,
        window.location.href
      );

    if (message) {
      url.searchParams.set(
        'message',
        message
      );
    }

    window.location.replace(
      url.href
    );
  }


  async function readProfile(userId) {

    const {
      data,
      error
    } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        first_name,
        last_name,
        phone,
        company_name,
        role,
        status,
        last_seen_at
      `)
      .eq(
        'id',
        userId
      )
      .maybeSingle();

    if (error)
      throw error;

    return data;
  }


  async function touchLastSeen(userId) {

    try {

      await supabase
        .from('profiles')
        .update({
          last_seen_at:
            new Date().toISOString()
        })
        .eq(
          'id',
          userId
        );

    } catch (_) {

      /*
        Ø®Ø·Ø§Û last_seen ÙØ¨Ø§ÛØ¯
        ÙØ§ÙØ¹ ÙØ±ÙØ¯ Ø´ÙØ¯.
      */

    }
  }


  async function verify() {

    if (!supabase) {

      goLogin(
        'Ø§ØªØµØ§Ù Ø¨Ù Ø³Ø§ÙØ§ÙÙ Ø§Ø­Ø±Ø§Ø² ÙÙÛØª Ø¨Ø±ÙØ±Ø§Ø± ÙØ´Ø¯.'
      );

      return;
    }


    try {

      const {
        data: {
          user
        },
        error
      } =
        await supabase.auth.getUser();


      if (
        error ||
        !user
      ) {

        goLogin(
          'Ø¨Ø±Ø§Û Ø§Ø¯Ø§ÙÙ Ø§Ø¨ØªØ¯Ø§ ÙØ§Ø±Ø¯ Ø´ÙÛØ¯.'
        );

        return;
      }


      const profile =
        await readProfile(
          user.id
        );


      if (!profile) {

        await supabase.auth.signOut();

        goLogin(
          'Ù¾Ø±ÙÙØ§ÛÙ Ú©Ø§Ø±Ø¨Ø±Û Ø´ÙØ§ ÙÙÙØ² Ø§ÛØ¬Ø§Ø¯ ÙØ´Ø¯Ù Ø§Ø³Øª. Ø¨Ø§ ÙØ§ÙÚ© Ø³Ø§ÙØ§ÙÙ ØªÙØ§Ø³ Ø¨Ú¯ÛØ±ÛØ¯.'
        );

        return;
      }


      if (
        !ALLOWED_STATUS.has(
          profile.status
        )
      ) {

        await supabase.auth.signOut();


        const messages = {

          pending:
            'Ø­Ø³Ø§Ø¨ Ø´ÙØ§ Ø¯Ø± Ø§ÙØªØ¸Ø§Ø± ØªØ£ÛÛØ¯ ÙØ§ÙÚ© Ø³Ø§ÙØ§ÙÙ Ø§Ø³Øª.',

          suspended:
            'Ø¯Ø³ØªØ±Ø³Û Ø­Ø³Ø§Ø¨ Ø´ÙØ§ ÙÙÙØªØ§Ù ÙØªÙÙÙ Ø´Ø¯Ù Ø§Ø³Øª.',

          disabled:
            'Ø¯Ø³ØªØ±Ø³Û Ø­Ø³Ø§Ø¨ Ø´ÙØ§ ØºÛØ±ÙØ¹Ø§Ù Ø´Ø¯Ù Ø§Ø³Øª.'

        };


        goLogin(
          messages[
            profile.status
          ] ||
          'Ø¯Ø³ØªØ±Ø³Û Ø­Ø³Ø§Ø¨ Ø´ÙØ§ ÙØ¬Ø§Ø² ÙÛØ³Øª.'
        );

        return;
      }


      /*
        Ø§Ø·ÙØ§Ø¹Ø§Øª Ú©Ø§Ø±Ø¨Ø±
      */

      window.ADINEH_AUTH.user =
        user;

      window.ADINEH_AUTH.profile =
        profile;

      window.ADINEH_AUTH.ready =
        true;


      window.ADINEH_USER_ID =
        user.id;


      /*
        Ø¯ÛØªØ§Û LocalStorage
        Ø¨Ø±Ø§Û ÙØ± Ú©Ø§Ø±Ø¨Ø± Ø¬Ø¯Ø§ ÙÛâØ´ÙØ¯.
      */

      window.ADINEH_DB_KEY =
        `adineh_poultry_db_v7_${user.id}`;


      document.documentElement
        .classList.add(
          'auth-ready'
        );

      document.body
        .classList.remove(
          'auth-loading'
        );


      document.dispatchEvent(
        new CustomEvent(
          'adineh-auth-ready',
          {
            detail: {
              user,
              profile
            }
          }
        )
      );


      await touchLastSeen(
        user.id
      );

    }

    catch (error) {

      console.error(
        'Auth guard error:',
        error
      );

      goLogin(
        'Ø®Ø·Ø§ Ø¯Ø± Ø¨Ø±Ø±Ø³Û Ø¯Ø³ØªØ±Ø³Û. Ø¯ÙØ¨Ø§Ø±Ù ØªÙØ§Ø´ Ú©ÙÛØ¯.'
      );

    }

  }


  /*
    Ø§Ú¯Ø± Ú©Ø§Ø±Ø¨Ø± Logout Ø´ÙØ¯
  */

  supabase.auth.onAuthStateChange(
    (event) => {

      if (
        event === 'SIGNED_OUT'
      ) {

        goLogin();

      }

    }
  );


  /*
    ÙÙÚ¯Ø§Ù Ø¨Ø±Ú¯Ø´Øª Ø¨Ù Ø¨Ø±ÙØ§ÙÙ
  */

  document.addEventListener(
    'visibilitychange',
    () => {

      if (
        !document.hidden &&
        window.ADINEH_AUTH.ready
      ) {

        verify();

      }

    }
  );


  /*
    ÙØ± Û¶Û° Ø«Ø§ÙÛÙ ÙØ¶Ø¹ÛØª Ø­Ø³Ø§Ø¨
    Ø¯ÙØ¨Ø§Ø±Ù Ø¨Ø±Ø±Ø³Û ÙÛâØ´ÙØ¯.
  */

  setInterval(
    () => {

      if (
        !document.hidden &&
        window.ADINEH_AUTH.ready
      ) {

        verify();

      }

    },
    60000
  );


  /*
    Ø´Ø±ÙØ¹ Ø¨Ø±Ø±Ø³Û
  */

  verify();

})();
