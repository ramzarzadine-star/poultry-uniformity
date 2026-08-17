'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
LOGIN / SIGNUP / MAGIC LINK / PASSWORD RECOVERY
Production Authentication Controller
=========================================================
*/

(() => {

  const LOGIN_PAGE =
    'login.html';

  const RESET_PAGE =
    'reset-password.html';

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


  if (!supabase || !supabase.auth) {

    console.error(
      '[Auth] Supabase client is unavailable.'
    );

    showMessage(
      'اتصال به سامانه برقرار نشد. لطفاً صفحه را دوباره باز کنید.',
      'error'
    );

    return;
  }


  /*
  -------------------------------------------------------
  DOM
  -------------------------------------------------------
  */

  const loginForm =
    document.getElementById('loginForm');

  const registerForm =
    document.getElementById('registerForm');

  const loginModeBtn =
    document.getElementById('loginModeBtn');

  const registerModeBtn =
    document.getElementById('registerModeBtn');

  const loginButton =
    document.getElementById('loginButton');

  const registerButton =
    document.getElementById('registerButton');

  const forgotBtn =
    document.getElementById('forgotBtn');

  const magicLinkBtn =
    document.getElementById('magicLinkBtn');

  const message =
    document.getElementById('message');

  const loading =
    document.getElementById('loading');

  const loadingText =
    document.getElementById('loadingText');

  const modeTitle =
    document.getElementById('modeTitle');

  const modeText =
    document.getElementById('modeText');


  /*
  -------------------------------------------------------
  Utilities
  -------------------------------------------------------
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
    text = 'در حال اتصال به سامانه...'
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

    [
      loginButton,
      registerButton,
      forgotBtn,
      magicLinkBtn,
      loginModeBtn,
      registerModeBtn
    ].forEach(button => {

      if (button) {

        button.disabled =
          Boolean(active);
      }

    });
  }


  function normalizeEmail(
    value
  ) {

    return String(
      value || ''
    )
      .trim()
      .toLowerCase();
  }


  function validEmail(
    email
  ) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(email);
  }


  function getErrorMessage(
    error
  ) {

    if (!error) {

      return 'خطای نامشخصی رخ داد.';
    }


    const messageText =
      String(
        error.message || ''
      ).toLowerCase();


    if (
      messageText.includes(
        'invalid login credentials'
      )
    ) {

      return 'ایمیل یا رمز عبور اشتباه است.';
    }


    if (
      messageText.includes(
        'email not confirmed'
      )
    ) {

      return 'ایمیل حساب هنوز تأیید نشده است. ابتدا لینک تأیید ارسال‌شده به ایمیل را باز کنید.';
    }


    if (
      messageText.includes(
        'user already registered'
      )
    ) {

      return 'این ایمیل قبلاً ثبت‌نام شده است. از گزینه ورود استفاده کنید.';
    }


    if (
      messageText.includes(
        'password should be at least'
      )
    ) {

      return 'رمز عبور باید حداقل ۸ کاراکتر باشد.';
    }


    if (
      messageText.includes(
        'rate limit'
      ) ||
      messageText.includes(
        'too many requests'
      )
    ) {

      return 'تعداد درخواست‌ها زیاد است. چند دقیقه صبر کنید و دوباره تلاش کنید.';
    }


    if (
      messageText.includes(
        'email rate limit'
      )
    ) {

      return 'تعداد ایمیل‌های ارسالی بیش از حد مجاز شده است. کمی بعد دوباره امتحان کنید.';
    }


    if (
      messageText.includes(
        'network'
      ) ||
      messageText.includes(
        'failed to fetch'
      )
    ) {

      return 'ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.';
    }


    return error.message ||
      'عملیات انجام نشد. دوباره تلاش کنید.';
  }


  /*
  -------------------------------------------------------
  Redirect helper
  -------------------------------------------------------
  */

  function appUrl() {

    return new URL(
      APP_PAGE,
      window.location.href
    ).href;
  }


  function resetUrl() {

    return new URL(
      RESET_PAGE,
      window.location.href
    ).href;
  }


  /*
  -------------------------------------------------------
  Detect authentication callback
  -------------------------------------------------------
  */

  function isRecoveryUrl() {

    const url =
      new URL(
        window.location.href
      );


    if (
      url.pathname.endsWith(
        RESET_PAGE
      )
    ) {

      return true;
    }


    if (
      url.searchParams.has('code') &&
      url.searchParams.has('type')
    ) {

      return (
        url.searchParams.get('type') ===
        'recovery'
      );
    }


    if (
      url.hash.includes(
        'type=recovery'
      )
    ) {

      return true;
    }


    return false;
  }


  /*
  -------------------------------------------------------
  Switch login/register
  -------------------------------------------------------
  */

  function showLogin() {

    clearMessage();

    if (loginForm) {

      loginForm.hidden =
        false;
    }

    if (registerForm) {

      registerForm.hidden =
        true;
    }


    if (loginModeBtn) {

      loginModeBtn.classList.add(
        'active'
      );

      loginModeBtn.setAttribute(
        'aria-selected',
        'true'
      );
    }


    if (registerModeBtn) {

      registerModeBtn.classList.remove(
        'active'
      );

      registerModeBtn.setAttribute(
        'aria-selected',
        'false'
      );
    }


    if (modeTitle) {

      modeTitle.textContent =
        'ورود به سامانه';
    }


    if (modeText) {

      modeText.textContent =
        'برای ورود، ایمیل و رمز عبور خود را وارد کنید.';
    }
  }


  function showRegister() {

    clearMessage();

    if (loginForm) {

      loginForm.hidden =
        true;
    }

    if (registerForm) {

      registerForm.hidden =
        false;
    }


    if (loginModeBtn) {

      loginModeBtn.classList.remove(
        'active'
      );

      loginModeBtn.setAttribute(
        'aria-selected',
        'false'
      );
    }


    if (registerModeBtn) {

      registerModeBtn.classList.add(
        'active'
      );

      registerModeBtn.setAttribute(
        'aria-selected',
        'true'
      );
    }


    if (modeTitle) {

      modeTitle.textContent =
        'ایجاد حساب کاربری';
    }


    if (modeText) {

      modeText.textContent =
        'اطلاعات خود را وارد کنید تا حساب شما ایجاد شود.';
    }
  }


  if (loginModeBtn) {

    loginModeBtn.addEventListener(
      'click',
      showLogin
    );
  }


  if (registerModeBtn) {

    registerModeBtn.addEventListener(
      'click',
      showRegister
    );
  }


  /*
  =======================================================
  LOGIN
  =======================================================
  */

  if (loginForm) {

    loginForm.addEventListener(
      'submit',
      async event => {

        event.preventDefault();

        clearMessage();


        const emailInput =
          document.getElementById(
            'loginEmail'
          );

        const passwordInput =
          document.getElementById(
            'loginPassword'
          );


        const email =
          normalizeEmail(
            emailInput?.value
          );

        const password =
          passwordInput?.value || '';


        if (!validEmail(email)) {

          showMessage(
            'لطفاً یک ایمیل معتبر وارد کنید.',
            'error'
          );

          emailInput?.focus();

          return;
        }


        if (!password) {

          showMessage(
            'رمز عبور را وارد کنید.',
            'error'
          );

          passwordInput?.focus();

          return;
        }


        setLoading(
          true,
          'در حال بررسی اطلاعات ورود...'
        );


        try {

          /*
          -----------------------------------------------
          IMPORTANT:
          Password login must use signInWithPassword.
          -----------------------------------------------
          */

          const {
            data,
            error
          } =
            await supabase.auth
              .signInWithPassword({

                email,

                password

              });


          if (error) {

            throw error;
          }


          if (!data?.session) {

            showMessage(
              'ورود انجام نشد. لطفاً دوباره تلاش کنید.',
              'error'
            );

            return;
          }


          showMessage(
            'ورود موفق بود. در حال ورود به سامانه...',
            'success'
          );


          /*
          -----------------------------------------------
          Small delay only for user feedback.
          -----------------------------------------------
          */

          setTimeout(
            () => {

              window.location.replace(
                appUrl()
              );

            },
            350
          );


        } catch (error) {

          console.error(
            '[Auth] Login error:',
            error
          );


          showMessage(
            getErrorMessage(error),
            'error'
          );


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
  REGISTER
  =======================================================
  */

  if (registerForm) {

    registerForm.addEventListener(
      'submit',
      async event => {

        event.preventDefault();

        clearMessage();


        const firstName =
          document.getElementById(
            'firstName'
          )?.value.trim() || '';


        const lastName =
          document.getElementById(
            'lastName'
          )?.value.trim() || '';


        const phone =
          document.getElementById(
            'registerPhone'
          )?.value.trim() || '';


        const email =
          normalizeEmail(
            document.getElementById(
              'registerEmail'
            )?.value
          );


        const password =
          document.getElementById(
            'registerPassword'
          )?.value || '';


        const passwordConfirm =
          document.getElementById(
            'registerPasswordConfirm'
          )?.value || '';


        if (!firstName) {

          showMessage(
            'نام را وارد کنید.',
            'error'
          );

          return;
        }


        if (!lastName) {

          showMessage(
            'نام خانوادگی را وارد کنید.',
            'error'
          );

          return;
        }


        if (!validEmail(email)) {

          showMessage(
            'لطفاً یک ایمیل معتبر وارد کنید.',
            'error'
          );

          return;
        }


        if (
          password.length < 8
        ) {

          showMessage(
            'رمز عبور باید حداقل ۸ کاراکتر باشد.',
            'error'
          );

          return;
        }


        if (
          password !==
          passwordConfirm
        ) {

          showMessage(
            'رمز عبور و تکرار آن یکسان نیستند.',
            'error'
          );

          return;
        }


        setLoading(
          true,
          'در حال ایجاد حساب کاربری...'
        );


        try {

          const {
            data,
            error
          } =
            await supabase.auth
              .signUp({

                email,

                password,

                options: {

                  emailRedirectTo:
                    appUrl(),

                  data: {

                    first_name:
                      firstName,

                    last_name:
                      lastName,

                    phone:
                      phone

                  }

                }

              });


          if (error) {

            throw error;
          }


          /*
          -----------------------------------------------
          Supabase may return a user without a session
          when email confirmation is enabled.
          -----------------------------------------------
          */

          if (
            data?.user &&
            !data?.session
          ) {

            showMessage(
              'حساب شما ایجاد شد. لینک تأیید به ایمیل شما ارسال شده است. پس از تأیید ایمیل، می‌توانید وارد سامانه شوید.',
              'success'
            );

            return;
          }


          if (data?.session) {

            showMessage(
              'حساب با موفقیت ایجاد شد. در حال ورود...',
              'success'
            );


            setTimeout(
              () => {

                window.location.replace(
                  appUrl()
                );

              },
              350
            );

            return;
          }


          showMessage(
            'حساب ایجاد شد. ایمیل خود را بررسی کنید.',
            'success'
          );


        } catch (error) {

          console.error(
            '[Auth] Signup error:',
            error
          );


          showMessage(
            getErrorMessage(error),
            'error'
          );


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
  PASSWORD RESET REQUEST
  =======================================================
  */

  if (forgotBtn) {

    forgotBtn.addEventListener(
      'click',
      async () => {

        clearMessage();


        const emailInput =
          document.getElementById(
            'loginEmail'
          );


        const email =
          normalizeEmail(
            emailInput?.value
          );


        if (!validEmail(email)) {

          showMessage(
            'ابتدا ایمیل حساب خود را وارد کنید.',
            'error'
          );

          emailInput?.focus();

          return;
        }


        setLoading(
          true,
          'در حال ارسال لینک بازیابی...'
        );


        try {

          /*
          -----------------------------------------------
          Official Supabase password recovery flow
          -----------------------------------------------
          */

          const {
            error
          } =
            await supabase.auth
              .resetPasswordForEmail(
                email,
                {

                  redirectTo:
                    resetUrl()

                }
              );


          if (error) {

            throw error;
          }


          showMessage(
            'لینک بازیابی رمز عبور به ایمیل شما ارسال شد. ایمیل را باز کنید و از همان دستگاه وارد لینک شوید.',
            'success'
          );


        } catch (error) {

          console.error(
            '[Auth] Password reset request error:',
            error
          );


          showMessage(
            getErrorMessage(error),
            'error'
          );


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
  MAGIC LINK
  =======================================================
  */

  if (magicLinkBtn) {

    magicLinkBtn.addEventListener(
      'click',
      async () => {

        clearMessage();


        const emailInput =
          document.getElementById(
            'loginEmail'
          );


        const email =
          normalizeEmail(
            emailInput?.value
          );


        if (!validEmail(email)) {

          showMessage(
            'ابتدا ایمیل خود را وارد کنید.',
            'error'
          );

          emailInput?.focus();

          return;
        }


        setLoading(
          true,
          'در حال ارسال لینک ورود...'
        );


        try {

          const {
            error
          } =
            await supabase.auth
              .signInWithOtp({

                email,

                options: {

                  emailRedirectTo:
                    appUrl(),

                  shouldCreateUser:
                    false

                }

              });


          if (error) {

            throw error;
          }


          showMessage(
            'لینک ورود به ایمیل شما ارسال شد. ایمیل را باز کنید و روی لینک ورود بزنید.',
            'success'
          );


        } catch (error) {

          console.error(
            '[Auth] Magic link error:',
            error
          );


          showMessage(
            getErrorMessage(error),
            'error'
          );


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
  AUTH STATE LISTENER
  =======================================================

  VERY IMPORTANT:

  PASSWORD_RECOVERY is NOT treated as normal login.

  This prevents the old problem where clicking the
  password reset email immediately opened index.html.
  =======================================================
  */

  const {
    data: authListener
  } =
    supabase.auth
      .onAuthStateChange(
        (event, session) => {

          console.info(
            '[Auth event]',
            event
          );


          /*
          -----------------------------------------------
          Password recovery
          -----------------------------------------------
          */

          if (
            event ===
            'PASSWORD_RECOVERY'
          ) {

            /*
            Do NOT redirect to index.html.

            Supabase has established the temporary
            recovery session. reset-password.html
            is responsible for changing the password.
            */

            return;
          }


          /*
          -----------------------------------------------
          Normal sign in
          -----------------------------------------------
          */

          if (
            event ===
            'SIGNED_IN' &&
            session &&
            !isRecoveryUrl()
          ) {

            /*
            Do not blindly redirect here.

            The explicit login handler above performs
            the redirect after successful password login.
            This prevents duplicate redirects.
            */

            return;
          }

        }
      );


  /*
  -------------------------------------------------------
  Store subscription so it can be cleaned if needed.
  -------------------------------------------------------
  */

  window.adinehAuthSubscription =
    authListener?.subscription || null;


  /*
  =======================================================
  INITIAL PAGE CHECK
  =======================================================
  */

  async function initialize() {

    try {

      /*
      -----------------------------------------------
      Recovery URL must never be treated as ordinary
      login.
      -----------------------------------------------
      */

      if (isRecoveryUrl()) {

        console.info(
          '[Auth] Recovery callback detected.'
        );

        return;
      }


      /*
      -----------------------------------------------
      Check existing session.
      -----------------------------------------------
      */

      const {
        data,
        error
      } =
        await supabase.auth
          .getSession();


      if (error) {

        console.warn(
          '[Auth] getSession:',
          error
        );

        return;
      }


      /*
      -----------------------------------------------
      Do NOT automatically redirect from login.html.

      This is intentional.

      The user must explicitly press Login.

      This fixes the previous problem where the page
      opened and immediately entered the application.
      -----------------------------------------------
      */

      if (data?.session) {

        console.info(
          '[Auth] Existing session detected; staying on login page until explicit login.'
        );

      }

    } catch (error) {

      console.error(
        '[Auth] Initialization error:',
        error
      );

    }

  }


  /*
  -------------------------------------------------------
  Start
  -------------------------------------------------------
  */

  initialize();


})();
