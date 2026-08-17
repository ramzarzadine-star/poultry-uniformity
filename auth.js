'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
Authentication Guard
Stable Version
=========================================================
*/

(function () {

  const client =
    window.supabaseClient ||
    window.adinehSupabase;


  window.ADINEH_AUTH = {

    ready: false,

    user: null,

    profile: null

  };


  let redirecting =
    false;


  /*
  ========================================================
  LOGIN REDIRECT
  ========================================================
  */

  function goLogin(
    message = ''
  ) {

    if (redirecting)
      return;


    redirecting =
      true;


    const url =
      new URL(
        'login.html',
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


  /*
  ========================================================
  AUTH READY
  ========================================================
  */

  function authReady(
    user,
    profile
  ) {

    window.ADINEH_AUTH = {

      ready: true,

      user,

      profile

    };


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

  }


  /*
  ========================================================
  CLIENT CHECK
  ========================================================
  */

  if (!client) {

    console.error(
      'Supabase client not found.'
    );


    goLogin(
      'سامانه احراز هویت بارگذاری نشد.'
    );


    return;

  }


  /*
  ========================================================
  GET CURRENT USER
  ========================================================
  */

  async function getCurrentUser() {

    try {

      const {
        data,
        error
      } =
        await client.auth
          .getUser();


      if (error) {

        console.error(
          'getUser:',
          error
        );


        return null;

      }


      return data?.user ||
        null;

    }

    catch (error) {

      console.error(
        'getUser exception:',
        error
      );


      return null;

    }

  }


  /*
  ========================================================
  GET PROFILE
  ========================================================
  */

  async function getCurrentProfile(
    user
  ) {

    if (!user)
      return null;


    try {

      const {
        data,
        error
      } =
        await client
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
            created_at,
            updated_at,
            last_seen_at
          `)
          .eq(
            'id',
            user.id
          )
          .maybeSingle();


      if (error) {

        console.error(
          'Profile query error:',
          error
        );


        return null;

      }


      return data ||
        null;

    }

    catch (error) {

      console.error(
        'Profile exception:',
        error
      );


      return null;

    }

  }


  /*
  ========================================================
  WAIT FOR SESSION
  ========================================================
  */

  async function waitForUser() {

    for (
      let attempt = 0;
      attempt < 20;
      attempt++
    ) {

      try {

        const {
          data,
          error
        } =
          await client.auth
            .getSession();


        if (error) {

          console.error(
            'getSession:',
            error
          );

        }


        if (
          data?.session?.user
        ) {

          return data.session.user;

        }

      }

      catch (error) {

        console.error(
          'getSession exception:',
          error
        );

      }


      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            250
          )
      );

    }


    return getCurrentUser();

  }


  /*
  ========================================================
  WAIT FOR PROFILE
  ========================================================
  */

  async function waitForProfile(
    user
  ) {

    if (!user)
      return null;


    for (
      let attempt = 0;
      attempt < 12;
      attempt++
    ) {

      const profile =
        await getCurrentProfile(
          user
        );


      if (profile)
        return profile;


      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            500
          )
      );

    }


    return null;

  }


  /*
  ========================================================
  ACCESS CHECK
  ========================================================
  */

  async function checkAccess() {

    try {

      const user =
        await waitForUser();


      if (!user) {

        goLogin(
          'ابتدا وارد سامانه شوید.'
        );


        return;

      }


      console.log(
        'Authenticated user:',
        user.id
      );


      const profile =
        await waitForProfile(
          user
        );


      console.log(
        'Profile:',
        profile
      );


      if (!profile) {

        console.error(
          'Profile not found after retry.'
        );


        goLogin(
          'پروفایل کاربر پیدا نشد. وضعیت حساب را در سامانه بررسی کنید.'
        );


        return;

      }


      if (
        profile.status !== 'active'
      ) {

        console.warn(
          'Account status:',
          profile.status
        );


        goLogin(
          'حساب شما هنوز فعال نشده است.'
        );


        return;

      }


      /*
      ======================================================
      USER DATA
      ======================================================
      */

      window.ADINEH_USER_ID =
        user.id;


      /*
      ======================================================
      USER-SPECIFIC LOCAL DATABASE
      ======================================================
      */

      window.ADINEH_DB_KEY =
        `adineh_poultry_db_v7_${user.id}`;


      authReady(
        user,
        profile
      );

    }

    catch (error) {

      console.error(
        'AUTH FATAL ERROR:',
        error
      );


      goLogin(
        'خطا در بررسی دسترسی.'
      );

    }

  }


  /*
  ========================================================
  REQUIRE ACTIVE USER
  ========================================================
  */

  async function requireActiveUser(
    options = {}
  ) {

    const redirect =
      options.redirect !== false;


    const user =
      await waitForUser();


    if (!user) {

      if (redirect)
        goLogin();


      return null;

    }


    const profile =
      await waitForProfile(
        user
      );


    if (!profile) {

      if (redirect)
        goLogin();


      return null;

    }


    if (
      profile.status !== 'active'
    ) {

      if (redirect)
        goLogin();


      return null;

    }


    return {

      user,

      profile

    };

  }


  /*
  ========================================================
  OWNER
  ========================================================
  */

  async function requireOwner() {

    const session =
      await requireActiveUser();


    if (!session)
      return null;


    if (
      session.profile.role !==
      'owner'
    ) {

      window.location.replace(
        'index.html'
      );


      return null;

    }


    return session;

  }


  /*
  ========================================================
  LOGOUT
  ========================================================
  */

  async function logout() {

    try {

      await client.auth
        .signOut();

    }

    catch (error) {

      console.error(
        'Logout:',
        error
      );

    }


    window.location.replace(
      'login.html'
    );

  }


  /*
  ========================================================
  PUBLIC API
  ========================================================
  */

  window.AdinehAuth = {

    getCurrentUser,

    getCurrentProfile,

    requireActiveUser,

    requireOwner,

    logout

  };


  /*
  ========================================================
  AUTH STATE LISTENER
  ========================================================
  */

  client.auth
    .onAuthStateChange(
      (
        event,
        session
      ) => {

        console.log(
          'Auth state:',
          event
        );


        if (
          event === 'SIGNED_OUT'
        ) {

          if (
            window.location.pathname
              .endsWith(
                'index.html'
              )
          ) {

            goLogin(
              'از سامانه خارج شده‌اید.'
            );

          }

        }

      }
    );


  /*
  ========================================================
  START
  ========================================================
  */

  checkAccess();


})();
