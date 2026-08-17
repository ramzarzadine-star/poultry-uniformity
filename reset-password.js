'use strict';

/*
=========================================================
 ADINEH POULTRY
 RESET PASSWORD
=========================================================
*/

(() => {

  /*
  =======================================================
  استفاده از همان Client اصلی پروژه
  =======================================================
  */

  const supabase =
    window.adinehSupabase ||
    window.supabaseClient ||
    null;


  /*
  =======================================================
  DOM
  =======================================================
  */

  const form =
    document.getElementById(
      'resetPasswordForm'
    );


  const newPassword =
    document.getElementById(
      'newPassword'
    );


  const confirmPassword =
    document.getElementById(
      'confirmPassword'
    );


  const saveButton =
    document.getElementById(
      'savePasswordBtn'
    );


  const message =
    document.getElementById(
      'message'
    );


  const loading =
    document.getElementById(
      'loading'
    );


  /*
  =======================================================
  STATE
  =======================================================
  */

  let recoveryReady =
    false;

  let processing =
    false;


  /*
  =======================================================
  MESSAGE
  =======================================================
  */

  function showMessage(
    text = '',
    type = 'error'
  ) {

    if (!message) {
      return;
    }


    message.textContent =
      text;


    message.className =
      'message';


    if (text) {

      message.classList.add(
        'show',
        type
      );

    }

  }


  /*
  =======================================================
  LOADING
  =======================================================
  */

  function setLoading(
    state
  ) {

    processing =
      Boolean(state);


    if (saveButton) {

      saveButton.disabled =
        processing;

    }


    if (loading) {

      loading.classList.toggle(
        'show',
        processing
      );

    }

  }


  /*
  =======================================================
  URL
  =======================================================
  */

  function getLoginUrl() {

    return new URL(
      'login.html',
      window.location.href
    ).href;

  }


  /*
  =======================================================
  READ SESSION
  =======================================================
  */

  async function getCurrentSession() {

    try {

      const {
        data,
        error
      } =
        await supabase.auth
          .getSession();


      if (error) {

        console.error(
          'GET SESSION ERROR:',
          error
        );


        return null;

      }


      return data?.session ||
        null;

    }

    catch (error) {

      console.error(
        'GET SESSION EXCEPTION:',
        error
      );


      return null;

    }

  }


  /*
  =======================================================
  INITIALIZE RECOVERY
  =======================================================
  */

  async function initializeRecovery() {

    if (!supabase) {

      showMessage(
        'اتصال به Supabase برقرار نشد. صفحه را دوباره باز کنید.'
      );


      if (form) {

        form.style.display =
          'none';

      }


      return;

    }


    /*
     * Listener باید قبل از getSession فعال شود.
     */

    supabase.auth
      .onAuthStateChange(
        async (
          event,
          session
        ) => {

          console.log(
            'RESET AUTH EVENT:',
            event
          );


          /*
           * Supabase Recovery
           */

          if (
            event ===
            'PASSWORD_RECOVERY'
          ) {

            recoveryReady =
              Boolean(
                session
              );


            if (recoveryReady) {

              showMessage(
                'لینک بازیابی معتبر است. رمز عبور جدید خود را وارد کنید.',
                'success'
              );


              if (form) {

                form.style.display =
                  '';

              }

            }


            return;

          }


          /*
           * اگر لینک Recovery باعث SIGNED_IN شد
           * نیز Session را قبول کن.
           */

          if (
            event ===
            'SIGNED_IN' &&
            session
          ) {

            recoveryReady =
              true;


            showMessage(
              'لینک بازیابی معتبر است. رمز عبور جدید خود را وارد کنید.',
              'success'
            );


            if (form) {

              form.style.display =
                '';

            }

          }

        }
      );


    /*
     * Session فعلی را بگیر
     */

    const session =
      await getCurrentSession();


    if (session) {

      recoveryReady =
        true;


      showMessage(
        'لینک بازیابی معتبر است. رمز عبور جدید خود را وارد کنید.',
        'success'
      );


      return;

    }


    /*
     * ممکن است Supabase هنوز URL را پردازش نکرده باشد.
     *
     * کمی صبر می‌کنیم.
     */

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          1200
        )
    );


    const secondSession =
      await getCurrentSession();


    if (secondSession) {

      recoveryReady =
        true;


      showMessage(
        'لینک بازیابی معتبر است. رمز عبور جدید خود را وارد کنید.',
        'success'
      );


      return;

    }


    /*
     * هیچ Sessionای پیدا نشد.
     */

    recoveryReady =
      false;


    if (form) {

      form.style.display =
        'none';

    }


    showMessage(
      'لینک بازیابی رمز عبور معتبر نیست یا منقضی شده است. لطفاً از صفحه ورود دوباره گزینه «فراموشی رمز عبور» را بزنید.'
    );

  }


  /*
  =======================================================
  UPDATE PASSWORD
  =======================================================
  */

  async function updatePassword(
    event
  ) {

    event.preventDefault();


    if (processing) {

      return;

    }


    showMessage('');


    /*
     * Session Check
     */

    if (!recoveryReady) {

      const session =
        await getCurrentSession();


      if (!session) {

        showMessage(
          'جلسه بازیابی رمز عبور معتبر نیست. لطفاً دوباره لینک بازیابی دریافت کنید.'
        );


        return;

      }


      recoveryReady =
        true;

    }


    const password =
      String(
        newPassword?.value || ''
      );


    const confirmation =
      String(
        confirmPassword?.value || ''
      );


    /*
     * Password validation
     */

    if (!password) {

      showMessage(
        'رمز عبور جدید را وارد کنید.'
      );


      return;

    }


    if (password.length < 8) {

      showMessage(
        'رمز عبور باید حداقل ۸ کاراکتر باشد.'
      );


      return;

    }


    if (
      password !==
      confirmation
    ) {

      showMessage(
        'رمز عبور و تکرار آن یکسان نیست.'
      );


      return;

    }


    setLoading(true);


    try {

      /*
       * آخرین بررسی Session
       */

      const session =
        await getCurrentSession();


      if (!session) {

        setLoading(false);


        showMessage(
          'جلسه بازیابی رمز عبور منقضی شده است. دوباره درخواست بازیابی کنید.'
        );


        return;

      }


      /*
       * تغییر رمز
       */

      const {
        data,
        error
      } =
        await supabase.auth
          .updateUser({

            password

          });


      if (error) {

        console.error(
          'UPDATE PASSWORD ERROR:',
          error
        );


        setLoading(false);


        showMessage(
          error.message ||
          'تغییر رمز عبور انجام نشد.'
        );


        return;

      }


      if (!data?.user) {

        setLoading(false);


        showMessage(
          'تغییر رمز عبور تأیید نشد.'
        );


        return;

      }


      /*
       * موفق
       */

      showMessage(
        'رمز عبور با موفقیت تغییر کرد. در حال انتقال به صفحه ورود...',
        'success'
      );


      if (form) {

        form.style.display =
          'none';

      }


      setLoading(false);


      /*
       * Session بازیابی را ببند.
       * کاربر بعداً با رمز جدید وارد می‌شود.
       */

      setTimeout(
        async () => {

          try {

            await supabase.auth
              .signOut();

          }

          catch (_) {}


          window.location.replace(
            getLoginUrl() +
            '?message=' +
            encodeURIComponent(
              'رمز عبور با موفقیت تغییر کرد. اکنون با رمز جدید وارد شوید.'
            )
          );

        },
        1500
      );

    }

    catch (error) {

      console.error(
        'UPDATE PASSWORD EXCEPTION:',
        error
      );


      setLoading(false);


      showMessage(
        error?.message ||
        'خطایی هنگام تغییر رمز عبور رخ داد. دوباره تلاش کنید.'
      );

    }

  }


  /*
  =======================================================
  EVENT
  =======================================================
  */

  if (form) {

    form.addEventListener(
      'submit',
      updatePassword
    );

  }


  /*
  =======================================================
  START
  =======================================================
  */

  initializeRecovery();

})();
