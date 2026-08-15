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
        خطای last_seen نباید
        مانع ورود شود.
      */

    }
  }


  async function verify() {

    if (!supabase) {

      goLogin(
        'اتصال به سامانه احراز هویت برقرار نشد.'
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
          'برای ادامه ابتدا وارد شوید.'
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
          'پروفایل کاربری شما هنوز ایجاد نشده است. با مالک سامانه تماس بگیرید.'
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
            'حساب شما در انتظار تأیید مالک سامانه است.',

          suspended:
            'دسترسی حساب شما موقتاً متوقف شده است.',

          disabled:
            'دسترسی حساب شما غیرفعال شده است.'

        };


        goLogin(
          messages[
            profile.status
          ] ||
          'دسترسی حساب شما مجاز نیست.'
        );

        return;
      }


      /*
        اطلاعات کاربر
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
        دیتای LocalStorage
        برای هر کاربر جدا می‌شود.
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
        'خطا در بررسی دسترسی. دوباره تلاش کنید.'
      );

    }

  }


  /*
    اگر کاربر Logout شود
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
    هنگام برگشت به برنامه
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
    هر ۶۰ ثانیه وضعیت حساب
    دوباره بررسی می‌شود.
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
    شروع بررسی
  */

  verify();

})();
