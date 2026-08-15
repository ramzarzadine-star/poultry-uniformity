'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
Authentication Guard
=========================================================
*/

(function () {

  const client = window.supabaseClient;


  /*
  وضعیت اولیه
  */
  window.ADINEH_AUTH = {

    ready: false,

    user: null,

    profile: null

  };


  /*
  اعلام آماده بودن احراز هویت
  */
  function authReady(
    user,
    profile
  ) {

    window.ADINEH_AUTH = {

      ready: true,

      user: user || null,

      profile: profile || null

    };


    document.dispatchEvent(
      new CustomEvent(
        'adineh-auth-ready'
      )
    );

  }


  /*
  انتقال به صفحه ورود
  */
  function goLogin() {

    window.ADINEH_AUTH = {

      ready: false,

      user: null,

      profile: null

    };


    window.location.replace(
      'login.html'
    );

  }


  /*
  Supabase موجود نیست
  */
  if (!client) {

    console.error(
      'Supabase client is not available.'
    );

    goLogin();

    return;

  }


  /*
  دریافت کاربر
  */
  async function getCurrentUser() {

    try {

      const {
        data,
        error
      } =
        await client.auth.getUser();


      if (error) {

        console.error(
          'getUser error:',
          error
        );

        return null;

      }


      return data?.user || null;

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
  دریافت پروفایل
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
          'Profile error:',
          error
        );

        return null;

      }


      return data || null;

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
  Bootstrap
  */
  async function bootstrap() {

    try {

      /*
      دریافت Session
      */
      const {
        data,
        error
      } =
        await client.auth.getSession();


      if (error) {

        console.error(
          'Session error:',
          error
        );

        goLogin();

        return;

      }


      const session =
        data?.session;


      /*
      کاربر وارد نشده
      */
      if (!session?.user) {

        goLogin();

        return;

      }


      /*
      دریافت Profile
      */
      const profile =
        await getCurrentProfile(
          session.user
        );


      /*
      Profile پیدا نشد
      */
      if (!profile) {

        console.error(
          'Profile not found.'
        );

        await client.auth.signOut();

        goLogin();

        return;

      }


      /*
      حساب باید Active باشد
      */
      if (
        profile.status !== 'active'
      ) {

        console.error(
          'Account status:',
          profile.status
        );

        await client.auth.signOut();

        goLogin();

        return;

      }


      /*
      همه چیز صحیح است
      */
      authReady(
        session.user,
        profile
      );

    }

    catch (error) {

      console.error(
        'Authentication error:',
        error
      );

      goLogin();

    }

  }


  /*
  خروج
  */
  async function logout() {

    try {

      await client.auth.signOut();

    }

    catch (error) {

      console.error(
        'Logout error:',
        error
      );

    }


    window.location.replace(
      'login.html'
    );

  }


  /*
  API عمومی
  */
  window.AdinehAuth = {

    getCurrentUser,

    getCurrentProfile,

    logout

  };


  /*
  شروع
  */
  bootstrap();


})();
