'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
Authentication Guard
=========================================================
*/

(function () {

  const client =
    window.supabaseClient ||
    window.adinehSupabase;


  /*
  وضعیت اولیه
  */
  window.ADINEH_AUTH = {

    ready: false,

    user: null,

    profile: null

  };


  /*
  انتقال به صفحه ورود
  */
  function goLogin(message = '') {

    const url =
      message
        ? 'login.html?message=' +
          encodeURIComponent(message)
        : 'login.html';


    window.location.replace(url);

  }


  /*
  اعلام آماده بودن
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
        'adineh-auth-ready'
      )
    );

  }


  /*
  اگر Supabase لود نشده
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
          'getUser:',
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
          'Profile query error:',
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
  بررسی دسترسی کاربر
  */
  async function checkAccess() {

    try {

      /*
      اول کاربر را از Auth بگیر
      */
      const user =
        await getCurrentUser();


      /*
      ورود انجام نشده
      */
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


      /*
      پروفایل
      */
      const profile =
        await getCurrentProfile(
          user
        );


      console.log(
        'Profile:',
        profile
      );


      /*
      پروفایل وجود ندارد
      */
      if (!profile) {

        console.error(
          'Profile not found.'
        );


        await client.auth.signOut();


        goLogin(
          'پروفایل کاربر پیدا نشد.'
        );


        return;

      }


      /*
      حساب باید active باشد
      */
      if (
        profile.status !== 'active'
      ) {

        console.warn(
          'Account status:',
          profile.status
        );


        await client.auth.signOut();


        goLogin(
          'حساب شما هنوز فعال نشده است.'
        );


        return;

      }


      /*
      موفق
      */
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
  بررسی دستی دسترسی
  */
  async function requireActiveUser(
    options = {}
  ) {

    const redirect =
      options.redirect !== false;


    const user =
      await getCurrentUser();


    if (!user) {

      if (redirect)
        goLogin();

      return null;

    }


    const profile =
      await getCurrentProfile(
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
  Owner
  */
  async function requireOwner() {

    const session =
      await requireActiveUser();


    if (!session)
      return null;


    if (
      session.profile.role !== 'owner'
    ) {

      window.location.replace(
        'index.html'
      );


      return null;

    }


    return session;

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
        'Logout:',
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

    requireActiveUser,

    requireOwner,

    logout

  };


  /*
  شروع بررسی
  */
  checkAccess();


})();
