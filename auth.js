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
  وضعیت اولیه احراز هویت
  */
  window.ADINEH_AUTH = {
    ready: false,
    user: null,
    profile: null
  };


  /*
  ارسال رویداد آماده شدن
  */
  function authReady(user, profile) {

    window.ADINEH_AUTH = {
      ready: true,
      user: user || null,
      profile: profile || null
    };

    document.dispatchEvent(
      new CustomEvent('adineh-auth-ready')
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

    window.location.replace('login.html');

  }


  /*
  بررسی وجود Supabase
  */
  if (!client) {

    console.error(
      'Supabase client is not available.'
    );

    goLogin();

    return;

  }


  /*
  دریافت کاربر فعلی
  */
  async function getCurrentUser() {

    try {

      const {
        data,
        error
      } = await client.auth.getUser();

      if (error) {

        console.error(
          'getCurrentUser:',
          error
        );

        return null;

      }

      return data?.user || null;

    } catch (error) {

      console.error(
        'getCurrentUser exception:',
        error
      );

      return null;

    }

  }


  /*
  دریافت Profile
  */
  async function getCurrentProfile(user) {

    if (!user)
      return null;


    try {

      const {
        data,
        error
      } = await client
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
          'getCurrentProfile:',
          error
        );

        return null;

      }


      return data || null;

    } catch (error) {

      console.error(
        'getCurrentProfile exception:',
        error
      );

      return null;

    }

  }


  /*
  بررسی دسترسی
  */
  async function requireActiveUser(
    options = {}
  ) {

    const redirect =
      options.redirect !== false;


    const user =
      await getCurrentUser();


    /*
    کاربر وارد نشده
    */
    if (!user) {

      if (redirect)
        goLogin();

      return null;

    }


    /*
    دریافت پروفایل
    */
    const profile =
      await getCurrentProfile(user);


    if (!profile) {

      console.error(
        'Profile not found for user:',
        user.id
      );

      await client.auth.signOut();

      if (redirect)
        goLogin();

      return null;

    }


    /*
    فقط حساب Active
    */
    if (
      profile.status !== 'active'
    ) {

      console.warn(
        'Account is not active:',
        profile.status
      );

      await client.auth.signOut();

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
  بررسی Owner
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

    } catch (error) {

      console.error(
        'Logout error:',
        error
      );

    }


    try {

      sessionStorage.removeItem(
        'adineh_user_role'
      );

      sessionStorage.removeItem(
        'adineh_user_name'
      );

    } catch (_) {}


    window.location.replace(
      'login.html'
    );

  }


  /*
  Bootstrap اصلی
  */
  async function bootstrap() {

    try {

      /*
      بررسی Session
      */
      const {
        data,
        error
      } =
        await client.auth.getSession();


      if (error) {

        console.error(
          'getSession:',
          error
        );

        goLogin();

        return;

      }


      const session =
        data?.session;


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


      if (!profile) {

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

        console.warn(
          'Inactive account:',
          profile.status
        );

        await client.auth.signOut();

        goLogin();

        return;

      }


      /*
      همه چیز OK
      */
      authReady(
        session.user,
        profile
      );


    } catch (error) {

      console.error(
        'Authentication bootstrap error:',
        error
      );

      goLogin();

    }

  }


  /*
  تغییر وضعیت Session
  */
  client.auth.onAuthStateChange(
    async (
      event,
      session
    ) => {

      console.log(
        'Auth event:',
        event
      );


      if (
        event === 'SIGNED_OUT'
      ) {

        window.ADINEH_AUTH = {
          ready: false,
          user: null,
          profile: null
        };

        return;

      }


      if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED'
      ) {

        /*
        اگر صفحه هنوز آماده نشده،
        bootstrap آن را آماده می‌کند.
        */

        if (
          !window.ADINEH_AUTH.ready
        ) {

          await bootstrap();

        }

      }

    }
  );


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
  شروع
  */
  bootstrap();


})();
