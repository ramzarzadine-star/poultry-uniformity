'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
PASSWORD RESET CONTROLLER
=========================================================

Flow:

Forgot Password
      ↓
Supabase email
      ↓
reset-password.html
      ↓
PASSWORD_RECOVERY session
      ↓
updateUser({ password })
      ↓
Login

=========================================================
*/

(() => {

  const LOGIN_PAGE =
    'login.html';

  const APP_PAGE =
    'index.html';


  /*
  -------------------------------------------------------
  Supabase client
  -------------------------------------------------------
  */

  const supabase =
    window.adinehSupabase ||
    window.supabaseClient;


  if (
    !supabase ||
    !supabase.auth
  ) {

    console.error(
      '[Password Reset] Supabase client unavailable.'
    );

    showMessage(
      'اتصال به سامانه برقرار نشد. صفحه را دوباره باز کنید.',
      'error'
    );

    return;
  }


  /*
  -------------------------------------------------------
  DOM
  -------------------------------------------------------
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

  const updateButton =
    document.getElementById(
      'updatePasswordButton'
    );

  const backToLogin =
    document.getElementById(
      'backToLogin'
    );

  const message =
    document.getElementById(
      'message'
    );

  const loading =
    document.getElementById(
      'loading'
    );

  const loadingText =
    document.getElementById(
      'loadingText'
    );


  /*
  =======================================================
  UI HELPERS
  =======================================================
  */

  function showMessage(
    text,
    type = 'info'
  ) {

    if (!message) return;

    message.textContent =
      text || '';

    message.className =
      'message show ' + type;
  }


  function clearMessage() {

    if (!message) return;

    message.textContent =
      '';

    message.className =
      'message';
  }


  function setLoading(
    active,
    text = 'در حال بررسی...'
  ) {

    if (loading) {

      loading.classList.toggle(
        'show',
        Boolean(active)
      );
    }


    if (loadingText) {

      loadingText.textContent =
        text;
    }


    if (updateButton) {

      updateButton.disabled =
        Boolean(active);
    }


    if (backToLogin) {

      backToLogin.disabled =
        Boolean(active);
    }

  }


  /*
  =======================================================
  ERROR TRANSLATION
  =======================================================
  */

  function translateError(
    error
  ) {

    if (!error) {

      return 'خطای نامشخصی رخ داد.';
    }


    const text =
      String(
        error.message || ''
      ).toLowerCase();


    if (
      text.includes(
        'same_password'
      ) ||
      text.includes(
        'new password should be different'
      )
    ) {

      return 'رمز عبور جدید باید با رمز قبلی متفاوت باشد.';
    }


    if (
      text.includes(
        'password should be at least'
      )
    ) {

      return 'رمز عبور باید حداقل ۸ کاراکتر باشد.';
    }


    if (
      text.includes(
        'session'
      ) &&
      (
        text.includes(
          'expired'
        ) ||
        text.includes(
          'not found'
        ) ||
        text.includes(
          'invalid'
        )
      )
    ) {

      return 'لینک بازیابی منقضی یا نامعتبر شده است. دوباره درخواست بازیابی رمز کنید.';
    }


    if (
      text.includes(
        'otp'
      ) ||
      text.includes(
        'token'
      )
    ) {

      return 'لینک بازیابی معتبر نیست یا منقضی شده است. دوباره درخواست لینک بازیابی کنید.';
    }


    if (
      text.includes(
        'network'
      ) ||
      text.includes(
        'failed to fetch'
      )
    ) {

      return 'ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.';
    }


    return (
      error.message ||
      'تغییر رمز عبور انجام نشد.'
    );
  }


  /*
  =======================================================
  PASSWORD VALIDATION
  =======================================================
  */

  function validatePassword(
    password
  ) {

    if (
      !password
    ) {

      return 'رمز عبور جدید را وارد کنید.';
    }


    if (
      password.length < 8
    ) {

      return 'رمز عبور باید حداقل ۸ کاراکتر باشد.';
    }


    return null;
  }


  /*
  =======================================================
  CHECK CURRENT SESSION
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
          '[Password Reset] getSession error:',
          error
        );

        return null;
      }


      return (
        data?.session ||
        null
      );

    } catch (error) {

      console.error(
        '[Password Reset] Session error:',
        error
      );

      return null;
    }

  }


  /*
  =======================================================
  PASSWORD RECOVERY EVENT
  =======================================================
  */

  let recoverySessionDetected =
    false;


  const {
    data: authListener
  } =
    supabase.auth
      .onAuthStateChange(
        async (
          event,
          session
        ) => {

          console.info(
            '[Password Reset] Auth event:',
            event
          );


          /*
          -----------------------------------------------
          THIS is the important event.

          Supabase sends PASSWORD_RECOVERY after
          a valid password recovery link is processed.
          -----------------------------------------------
          */

          if (
            event ===
            'PASSWORD_RECOVERY'
          ) {

            recoverySessionDetected =
              Boolean(session);

            if (
              recoverySessionDetected
            ) {

              showMessage(
                'لینک بازیابی معتبر است. رمز عبور جدید خود را وارد کنید.',
                'info'
              );

            }

            return;
          }


          /*
          -----------------------------------------------
          Do NOT redirect on SIGNED_IN.

          A recovery flow may also establish a session.
          Redirecting here was the source of the previous
          problem.
          -----------------------------------------------
          */

          if (
            event ===
            'SIGNED_IN'
          ) {

            return;
          }

        }
      );


  window.adinehPasswordResetSubscription =
    authListener?.subscription ||
    null;


  /*
  =======================================================
  INITIAL SESSION CHECK
  =======================================================
  */

  async function initialize() {

    setLoading(
      true,
      'در حال بررسی لینک بازیابی...'
    );


    try {

      const session =
        await getCurrentSession();


      /*
      -----------------------------------------------
      Valid recovery session already exists.
      -----------------------------------------------
      */

      if (session) {

        recoverySessionDetected =
          true;

        showMessage(
          'لینک بازیابی معتبر است. رمز عبور جدید خود را وارد کنید.',
          'info'
        );

        return;
      }


      /*
      -----------------------------------------------
      Supabase may still be processing the URL.

      Give the auth listener a short opportunity
      to receive PASSWORD_RECOVERY.
      -----------------------------------------------
      */

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            700
          )
      );


      const secondSession =
        await getCurrentSession();


      if (secondSession) {

        recoverySessionDetected =
          true;

        showMessage(
          'لینک بازیابی معتبر است. رمز عبور جدید خود را وارد کنید.',
          'info'
        );

        return;
      }


      /*
      -----------------------------------------------
      No recovery session.
      -----------------------------------------------
      */

      showMessage(
        'لینک بازیابی معتبر نیست یا منقضی شده است. از صفحه ورود دوباره درخواست بازیابی رمز کنید.',
        'error'
      );


      if (updateButton) {

        updateButton.disabled =
          true;
      }


    } catch (error) {

      console.error(
        '[Password Reset] Initialization error:',
        error
      );


      showMessage(
        'بررسی لینک بازیابی انجام نشد. دوباره تلاش کنید.',
        'error'
      );


    } finally {

      setLoading(
        false
      );

    }

  }


  /*
  =======================================================
  UPDATE PASSWORD
  =======================================================
  */

  if (form) {

    form.addEventListener(
      'submit',
      async event => {

        event.preventDefault();

        clearMessage();


        const password =
          newPassword?.value ||
          '';


        const confirmation =
          confirmPassword?.value ||
          '';


        /*
        -----------------------------------------------
        Validate password
        -----------------------------------------------
        */

        const validation =
          validatePassword(
            password
          );


        if (validation) {

          showMessage(
            validation,
            'error'
          );

          newPassword?.focus();

          return;
        }


        /*
        -----------------------------------------------
        Confirm password
        -----------------------------------------------
        */

        if (
          password !==
          confirmation
        ) {

          showMessage(
            'رمز عبور جدید و تکرار آن یکسان نیستند.',
            'error'
          );

          confirmPassword?.focus();

          return;
        }


        /*
        -----------------------------------------------
        Check session immediately before update.

        This prevents attempting updateUser()
        without a valid recovery session.
        -----------------------------------------------
        */

        setLoading(
          true,
          'در حال بررسی دسترسی...'
        );


        try {

          const session =
            await getCurrentSession();


          if (!session) {

            throw new Error(
              'Recovery session is not available.'
            );
          }


          /*
          -----------------------------------------------
          REAL PASSWORD CHANGE
          -----------------------------------------------
          */

          setLoading(
            true,
            'در حال ذخیره رمز عبور جدید...'
          );


          const {
            data,
            error
          } =
            await supabase.auth
              .updateUser({

                password

              });


          if (error) {

            throw error;
          }


          if (!data?.user) {

            throw new Error(
              'Password update did not return a user.'
            );
          }


          /*
          -----------------------------------------------
          SUCCESS
          -----------------------------------------------
          */

          showMessage(
            'رمز عبور با موفقیت تغییر کرد.',
            'success'
          );


          if (newPassword) {

            newPassword.value =
              '';
          }


          if (confirmPassword) {

            confirmPassword.value =
              '';
          }


          /*
          -----------------------------------------------
          Sign out recovery session.

          This is intentional.

          User should return to login and explicitly
          enter the new password.
          -----------------------------------------------
          */

          try {

            await supabase.auth.signOut();

          } catch (signOutError) {

            console.warn(
              '[Password Reset] Sign out warning:',
              signOutError
            );

          }


          if (updateButton) {

            updateButton.disabled =
              true;
          }


          /*
          -----------------------------------------------
          Return to Login.

          Query parameter lets login.js display a
          success message if desired.
          -----------------------------------------------
          */

          setTimeout(
            () => {

              const url =
                new URL(
                  LOGIN_PAGE,
                  window.location.href
                );


              url.searchParams.set(
                'password',
                'changed'
              );


              window.location.replace(
                url.href
              );

            },
            1200
          );


        } catch (error) {

          console.error(
            '[Password Reset] Update error:',
            error
          );


          /*
          -----------------------------------------------
          Better recovery-session error
          -----------------------------------------------
          */

          if (
            !await getCurrentSession()
          ) {

            showMessage(
              'دسترسی بازیابی این لینک معتبر نیست یا منقضی شده است. از صفحه ورود دوباره لینک بازیابی دریافت کنید.',
              'error'
            );

          } else {

            showMessage(
              translateError(error),
              'error'
            );

          }


        } finally {

          setLoading(
            false
          );

        }

      }
    );

  }


  /*
  =======================================================
  BACK TO LOGIN
  =======================================================
  */

  if (backToLogin) {

    backToLogin.addEventListener(
      'click',
      async () => {

        try {

          await supabase.auth.signOut();

        } catch (error) {

          console.warn(
            '[Password Reset] Signout:',
            error
          );

        }


        window.location.replace(
          LOGIN_PAGE
        );

      }
    );

  }


  /*
  =======================================================
  PASSWORD VISIBILITY
  =======================================================
  */

  function setupToggle(
    buttonId,
    inputId
  ) {

    const button =
      document.getElementById(
        buttonId
      );

    const input =
      document.getElementById(
        inputId
      );


    if (
      !button ||
      !input
    ) {

      return;
    }


    button.addEventListener(
      'click',
      () => {

        const isPassword =
          input.type ===
          'password';


        input.type =
          isPassword
            ? 'text'
            : 'password';


        button.textContent =
          isPassword
            ? 'پنهان'
            : 'نمایش';

      }
    );

  }


  setupToggle(
    'toggleNewPassword',
    'newPassword'
  );


  setupToggle(
    'toggleConfirmPassword',
    'confirmPassword'
  );


  /*
  =======================================================
  START
  =======================================================
  */

  initialize();

})();
