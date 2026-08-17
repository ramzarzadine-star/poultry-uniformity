'use strict';

(() => {

  const supabase =
    window.adinehSupabase;


  if (!supabase) {

    console.error(
      'Supabase client not found.'
    );

    return;

  }


  const form =
    document.getElementById(
      'resetPasswordForm'
    );

  const passwordInput =
    document.getElementById(
      'newPassword'
    );

  const confirmInput =
    document.getElementById(
      'confirmPassword'
    );

  const button =
    document.getElementById(
      'savePasswordBtn'
    );

  const messageEl =
    document.getElementById(
      'message'
    );

  const loading =
    document.getElementById(
      'loading'
    );


  let recoveryReady =
    false;

  let saving =
    false;


  /* =====================================================
     MESSAGE
  ===================================================== */

  function message(
    text = '',
    type = 'error'
  ) {

    messageEl.textContent =
      text;

    messageEl.className =
      'message';


    if (text) {

      messageEl.classList.add(
        'show',
        type
      );

    }

  }


  /* =====================================================
     LOADING
  ===================================================== */

  function setLoading(
    state
  ) {

    saving =
      Boolean(state);

    button.disabled =
      saving;

    loading.classList.toggle(
      'show',
      saving
    );

  }


  /* =====================================================
     CHECK SESSION
  ===================================================== */

  async function checkSession() {

    const {
      data,
      error
    } =
      await supabase.auth
        .getSession();


    if (error) {

      console.error(
        'RECOVERY SESSION ERROR:',
        error
      );

      return false;

    }


    if (
      !data?.session?.user
    ) {

      return false;

    }


    return true;

  }


  /* =====================================================
     AUTH EVENTS
  ===================================================== */

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


        if (
          event ===
          'PASSWORD_RECOVERY'
        ) {

          recoveryReady =
            Boolean(
              session?.user
            );


          if (recoveryReady) {

            message(
              'هویت شما تأیید شد. رمز عبور جدید را وارد کنید.',
              'success'
            );

          }

        }


        if (
          event ===
          'SIGNED_IN' &&
          session?.user
        ) {

          /*
           * اگر Callback بازیابی Session ساخته باشد،
           * فرم فعال می‌ماند و کاربر وارد Dashboard نمی‌شود.
           */

          const url =
            window.location.href;


          if (
            url.includes(
              'type=recovery'
            ) ||
            url.includes(
              'type%3Drecovery'
            )
          ) {

            recoveryReady =
              true;

          }

        }

      }
    );


  /* =====================================================
     INITIALIZE
  ===================================================== */

  async function initialize() {

    setLoading(true);


    /*
     * اجازه می‌دهیم Supabase URL callback
     * را پردازش کند.
     */

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          400
        )
    );


    const hasSession =
      await checkSession();


    if (hasSession) {

      recoveryReady =
        true;

      setLoading(false);

      return;

    }


    /*
     * ممکن است PASSWORD_RECOVERY
     * کمی بعد برسد.
     */

    setTimeout(
      async () => {

        const retry =
          await checkSession();


        if (retry) {

          recoveryReady =
            true;

          setLoading(false);

          message(
            'هویت شما تأیید شد. رمز عبور جدید را وارد کنید.',
            'success'
          );

          return;

        }


        setLoading(false);

        form.style.display =
          'none';

        message(
          'لینک بازیابی معتبر نیست یا منقضی شده است. دوباره از صفحه ورود درخواست بازیابی رمز کنید.'
        );

      },
      1000
    );

  }


  /* =====================================================
     UPDATE PASSWORD
  ===================================================== */

  form.addEventListener(
    'submit',
    async event => {

      event.preventDefault();


      if (saving)
        return;


      const password =
        passwordInput.value;


      const confirmation =
        confirmInput.value;


      if (
        password.length < 8
      ) {

        message(
          'رمز عبور باید حداقل ۸ کاراکتر باشد.'
        );

        return;

      }


      if (
        password !==
        confirmation
      ) {

        message(
          'رمز عبور و تکرار آن یکسان نیست.'
        );

        return;

      }


      const session =
        await checkSession();


      if (
        !session
      ) {

        message(
          'نشست بازیابی معتبر نیست. لطفاً دوباره لینک بازیابی دریافت کنید.'
        );

        return;

      }


      setLoading(true);


      try {

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


          message(
            error.message ||
            'تغییر رمز عبور انجام نشد.'
          );


          return;

        }


        if (!data?.user) {

          setLoading(false);


          message(
            'تغییر رمز عبور تأیید نشد.'
          );


          return;

        }


        message(
          'رمز عبور با موفقیت تغییر کرد. در حال ورود به سامانه...',
          'success'
        );


        form.style.display =
          'none';


        setTimeout(
          () => {

            window.location.replace(
              'index.html'
            );

          },
          1200
        );

      }

      catch (error) {

        console.error(
          error
        );


        setLoading(false);


        message(
          'خطایی هنگام تغییر رمز عبور رخ داد.'
        );

      }

    }
  );


  initialize();

})();
