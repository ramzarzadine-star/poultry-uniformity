'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه

RESET PASSWORD

این فایل فقط در reset-password.html اجرا می‌شود.
=========================================================
*/


(() => {

  /*
  =======================================================
  SUPABASE CLIENT
  =======================================================
  */

  const supabase =
    window.adinehSupabase ||
    window.supabaseClient ||
    null;


  if (!supabase) {

    console.error(
      'Supabase client not found.'
    );


    return;

  }


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

  let recoverySessionReady =
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
  LOGIN URL
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
  CHECK SESSION
  =======================================================
  */

  async function getSession() {

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
  PASSWORD RECOVERY LISTENER
  =======================================================
  */

  function setupRecoveryListener() {

    supabase.auth
      .onAuthStateChange(
        (
          event,
          session
        ) => {

          console.log(
            'RESET AUTH EVENT:',
            event
          );


          /*
           * لینک بازیابی معتبر است
           */

          if (
            event ===
            'PASSWORD_RECOVERY'
          ) {

            recoverySessionReady =
              Boolean(
                session
              );


            if (
              recoverySessionReady
            ) {

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
           * بعضی نسخه‌های Supabase
           * Recovery را با SIGNED_IN هم اعلام می‌کنند.
           */

          if (
            event ===
            'SIGNED_IN' &&
            session
          ) {

            recoverySessionReady =
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

  }


  /*
  =======================================================
  INITIALIZE
  =======================================================
  */

  async function initialize() {

    /*
     * Listener قبل از getSession
     */

    setupRecoveryListener();


    /*
     * Session فعلی
     */

    const session =
      await getSession();


    if (session) {

      recoverySessionReady =
        true;


      showMessage(
        'لینک بازیابی معتبر است. رمز عبور جدید خود را وارد کنید.',
        'success'
      );


      return;

    }


    /*
     * ممکن است Supabase هنوز
     * Hash URL را پردازش نکرده باشد.
     */

    await new Promise(
      resolve => {

        setTimeout(
          resolve,
          1200
        );

      }
    );


    const secondSession =
      await getSession();


    if (secondSession) {

      recoverySessionReady =
        true;


      showMessage(
        'لینک بازیابی معتبر است. رمز عبور جدید خود را وارد کنید.',
        'success'
      );


      return;

    }


    /*
     * Session وجود ندارد
     */

    recoverySessionReady =
      false;


    if (form) {

      form.style.display =
        'none';

    }


    showMessage(
      'لینک بازیابی معتبر نیست یا منقضی شده است. لطفاً از صفحه ورود دوباره گزینه «فراموشی رمز عبور» را انتخاب کنید.'
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
     * Session
     */

    let session =
      await getSession();


    /*
     * اگر Session هنوز آماده نیست
     */

    if (!session) {

      await new Promise(
        resolve => {

          setTimeout(
            resolve,
            500
          );

        }
      );


      session =
        await getSession();

    }


    if (!session) {

      showMessage(
        'لینک بازیابی معتبر نیست یا منقضی شده است. لطفاً دوباره درخواست بازیابی رمز کنید.'
      );


      return;

    }


    recoverySessionReady =
      true;


    /*
     * Password
     */

    const password =
      String(
        newPassword?.value ||
        ''
      );


    const confirmation =
      String(
        confirmPassword?.value ||
        ''
      );


    /*
     * حداقل طول
     */

    if (
      password.length < 8
    ) {

      showMessage(
        'رمز عبور باید حداقل ۸ کاراکتر باشد.'
      );


      return;

    }


    /*
     * تطابق
     */

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
       * =================================================
       * تغییر رمز
       * =================================================
       */

      const {
        data,
        error
      } =
        await supabase.auth
          .updateUser({

            password:
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
       * بعد از تغییر رمز
       * Session بازیابی را ببند.
       */

      setTimeout(
        async () => {

          try {

            await supabase.auth
              .signOut();

          }

          catch (error) {

            console.warn(
              'SIGN OUT AFTER RESET:',
              error
            );

          }


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
  FORM EVENT
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

  initialize();

})();
