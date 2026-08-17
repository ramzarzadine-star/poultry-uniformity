'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
PASSWORD RECOVERY
نسخه اصلاح شده
=========================================================
*/

(() => {

  const supabase =
    window.adinehSupabase ||
    window.supabaseClient;


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


  let recoveryMode =
    false;


  let busy =
    false;


  /*
  ========================================================
  MESSAGE
  ========================================================
  */

  function showMessage(
    text = '',
    type = 'error'
  ) {

    if (!message)
      return;


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
  ========================================================
  LOADING
  ========================================================
  */

  function setLoading(
    state
  ) {

    busy =
      Boolean(state);


    if (saveButton) {

      saveButton.disabled =
        busy;

    }


    if (loading) {

      loading.classList.toggle(
        'show',
        busy
      );

    }

  }


  /*
  ========================================================
  GET SESSION
  ========================================================
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


      return (
        data?.session ||
        null
      );

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
  ========================================================
  SHOW RESET FORM
  ========================================================
  */

  function showResetForm() {

    recoveryMode =
      true;


    if (form) {

      form.style.display =
        '';

    }


    showMessage(
      'لینک بازیابی معتبر است. رمز عبور جدید خود را وارد کنید.',
      'success'
    );

  }


  /*
  ========================================================
  HIDE RESET FORM
  ========================================================
  */

  function hideResetForm() {

    if (form) {

      form.style.display =
        'none';

    }

  }


  /*
  ========================================================
  RECOVERY ERROR
  ========================================================
  */

  function showRecoveryError(
    text
  ) {

    recoveryMode =
      false;


    hideResetForm();


    showMessage(
      text ||
      'لینک بازیابی معتبر نیست یا منقضی شده است.'
    );

  }


  /*
  ========================================================
  تشخیص لینک Recovery
  ========================================================
  */

  function hasRecoveryUrl() {

    const hash =
      window.location.hash || '';


    const search =
      window.location.search || '';


    return (

      hash.includes(
        'type=recovery'
      )

      ||

      hash.includes(
        'access_token='
      )

      ||

      search.includes(
        'type=recovery'
      )

      ||

      search.includes(
        'code='
      )

    );

  }


  /*
  ========================================================
  پردازش Authorization Code
  ========================================================
  */

  async function exchangeCodeIfNeeded() {

    const code =
      new URLSearchParams(
        window.location.search
      ).get(
        'code'
      );


    if (!code)
      return null;


    try {

      console.log(
        'RECOVERY CODE FOUND'
      );


      const {
        data,
        error
      } =
        await supabase.auth
          .exchangeCodeForSession(
            code
          );


      if (error) {

        console.error(
          'EXCHANGE CODE ERROR:',
          error
        );

        return null;
      }


      return (
        data?.session ||
        null
      );

    }

    catch (error) {

      console.error(
        'EXCHANGE CODE EXCEPTION:',
        error
      );

      return null;
    }

  }


  /*
  ========================================================
  AUTH LISTENER
  ========================================================
  */

  function setupAuthListener() {

    supabase.auth
      .onAuthStateChange(
        (
          event,
          session
        ) => {

          console.log(
            'AUTH EVENT:',
            event,
            session?.user?.email
          );


          /*
          ================================================
          مهم‌ترین رویداد Recovery
          ================================================
          */

          if (
            event ===
            'PASSWORD_RECOVERY'
          ) {

            if (session?.user) {

              showResetForm();

            }
            else {

              showRecoveryError(
                'نشست بازیابی رمز معتبر نیست.'
              );

            }

            return;
          }


          /*
          بعضی حالت‌های Supabase
          Recovery را SIGNED_IN اعلام می‌کنند.
          */

          if (
            event ===
            'SIGNED_IN'
          ) {

            if (
              hasRecoveryUrl() &&
              session?.user
            ) {

              showResetForm();

            }

          }

        }
      );

  }


  /*
  ========================================================
  UPDATE PASSWORD
  ========================================================
  */

  async function updatePassword(
    event
  ) {

    event.preventDefault();


    if (busy)
      return;


    if (!recoveryMode) {

      showRecoveryError(
        'نشست بازیابی رمز عبور معتبر نیست.'
      );

      return;
    }


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
    ====================================================
    VALIDATION
    ====================================================
    */

    if (
      password.length < 8
    ) {

      showMessage(
        'رمز عبور باید حداقل ۸ کاراکتر باشد.'
      );

      return;
    }


    if (
      password !== confirmation
    ) {

      showMessage(
        'رمز عبور و تکرار آن یکسان نیست.'
      );

      return;
    }


    /*
    ====================================================
    SESSION
    ====================================================
    */

    const session =
      await getSession();


    if (!session?.user) {

      showRecoveryError(
        'نشست بازیابی منقضی شده است. لطفاً دوباره درخواست بازیابی رمز کنید.'
      );

      return;
    }


    setLoading(true);


    try {

      console.log(
        'UPDATING PASSWORD FOR:',
        session.user.email
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
      ====================================================
      موفق
      ====================================================
      */

      showMessage(
        'رمز عبور با موفقیت تغییر کرد.',
        'success'
      );


      if (form) {

        form.style.display =
          'none';

      }


      setLoading(false);


      /*
      Session بازیابی را می‌بندیم
      */

      await supabase.auth
        .signOut();


      /*
      برگشت به Login
      */

      setTimeout(
        () => {

          window.location.replace(
            'login.html?message=' +
            encodeURIComponent(
              'رمز عبور با موفقیت تغییر کرد. اکنون با رمز جدید وارد شوید.'
            )
          );

        },
        1200
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
        'خطایی هنگام تغییر رمز عبور رخ داد.'
      );

    }

  }


  /*
  ========================================================
  INITIALIZE
  ========================================================
  */

  async function initialize() {

    if (!supabase) {

      showRecoveryError(
        'اتصال به سامانه احراز هویت برقرار نشد.'
      );

      return;
    }


    /*
    Listener باید قبل از پردازش Session
    فعال شود.
    */

    setupAuthListener();


    /*
    ====================================================
    آیا واقعاً لینک Recovery است؟
    ====================================================
    */

    const recoveryUrl =
      hasRecoveryUrl();


    console.log(
      'RECOVERY URL:',
      recoveryUrl
    );


    console.log(
      'CURRENT URL:',
      window.location.href
    );


    if (!recoveryUrl) {

      showRecoveryError(
        'این صفحه فقط از طریق لینک بازیابی رمز عبور قابل استفاده است.'
      );

      return;
    }


    /*
    ====================================================
    اگر URL شامل code باشد
    ====================================================
    */

    const codeSession =
      await exchangeCodeIfNeeded();


    if (codeSession?.user) {

      showResetForm();

      return;
    }


    /*
    ====================================================
    کمی زمان برای پردازش token
    ====================================================
    */

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          500
        )
    );


    let session =
      await getSession();


    if (session?.user) {

      showResetForm();

      return;
    }


    /*
    ====================================================
    دوباره بررسی
    ====================================================
    */

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          1000
        )
    );


    session =
      await getSession();


    if (session?.user) {

      showResetForm();

      return;
    }


    /*
    ====================================================
    Session ساخته نشده
    ====================================================
    */

    showRecoveryError(
      'لینک بازیابی معتبر نیست یا منقضی شده است. لطفاً دوباره از صفحه ورود درخواست بازیابی رمز کنید.'
    );

  }


  /*
  ========================================================
  FORM EVENT
  ========================================================
  */

  if (form) {

    form.addEventListener(
      'submit',
      updatePassword
    );

  }


  /*
  ========================================================
  START
  ========================================================
  */

  initialize();

})();
