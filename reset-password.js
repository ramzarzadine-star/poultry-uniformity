'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
PASSWORD RECOVERY
=========================================================
*/

(() => {

  const supabase =
    window.adinehSupabase ||
    window.supabaseClient;


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


  let recoveryMode =
    false;


  let busy =
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
  =======================================================
  SESSION
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
  =======================================================
  نمایش فرم
  =======================================================
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
  =======================================================
  خطای Recovery
  =======================================================
  */

  function showRecoveryError(
    text
  ) {

    recoveryMode =
      false;


    if (form) {

      form.style.display =
        'none';

    }


    showMessage(
      text ||
      'لینک بازیابی معتبر نیست یا منقضی شده است.'
    );

  }


  /*
  =======================================================
  PASSWORD RECOVERY EVENT
  =======================================================
  */

  function setupAuthListener() {

    supabase.auth
      .onAuthStateChange(
        async (
          event,
          session
        ) => {

          console.log(
            'AUTH EVENT:',
            event
          );


          /*
          ================================================
          این مهم‌ترین قسمت است.
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
                'لینک بازیابی دریافت شد اما نشست بازیابی معتبر نیست.'
              );

            }


            return;

          }


          /*
          بعضی نسخه‌ها Recovery را
          با SIGNED_IN اعلام می‌کنند.
          */

          if (
            event ===
            'SIGNED_IN'
          ) {

            /*
            اگر URL واقعاً Recovery است،
            SIGNED_IN را Login عادی
            حساب نکن.
            */

            const hash =
              window.location.hash ||
              '';


            const search =
              window.location.search ||
              '';


            const recoveryUrl =
              hash.includes(
                'type=recovery'
              ) ||
              hash.includes(
                'access_token='
              ) ||
              search.includes(
                'type=recovery'
              );


            if (
              recoveryUrl &&
              session?.user
            ) {

              showResetForm();

            }

          }

        }
      );

  }


  /*
  =======================================================
  تشخیص URL بازیابی
  =======================================================
  */

  function hasRecoveryUrl() {

    const hash =
      window.location.hash ||
      '';


    const search =
      window.location.search ||
      '';


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
  =======================================================
  INITIALIZE
  =======================================================
  */

  async function initialize() {

    if (!supabase) {

      showRecoveryError(
        'اتصال به سامانه احراز هویت برقرار نشد.'
      );


      return;

    }


    /*
    ================================================
    Listener باید قبل از getSession فعال شود.
    ================================================
    */

    setupAuthListener();


    /*
    ================================================
    آیا URL واقعاً Recovery است؟
    ================================================
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


    /*
    ================================================
    اگر URL Recovery نیست،
    اجازه نمایش فرم نده.
    ================================================
    */

    if (!recoveryUrl) {

      showRecoveryError(
        'این صفحه فقط از طریق لینک بازیابی رمز عبور قابل استفاده است.'
      );


      return;

    }


    /*
    ================================================
    چند لحظه برای پردازش Token توسط Supabase
    ================================================
    */

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          700
        )
    );


    /*
    ================================================
    Session
    ================================================
    */

    let session =
      await getSession();


    if (session?.user) {

      showResetForm();


      return;

    }


    /*
    ================================================
    یک بار دیگر صبر کن
    ================================================
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
    ================================================
    Token وجود دارد ولی Session ساخته نشد
    ================================================
    */

    showRecoveryError(
      'لینک بازیابی معتبر نیست یا منقضی شده است. لطفاً دوباره از صفحه ورود درخواست بازیابی رمز کنید.'
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


    if (busy) {

      return;

    }


    /*
    ================================================
    فقط در Recovery Mode
    ================================================
    */

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
    ================================================
    اعتبارسنجی
    ================================================
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
      password !==
      confirmation
    ) {

      showMessage(
        'رمز عبور و تکرار آن یکسان نیست.'
      );


      return;

    }


    /*
    ================================================
    Session
    ================================================
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

      /*
      ==============================================
      تغییر رمز
      ==============================================
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
      ================================================
      موفق
      ================================================
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
      ================================================
      Session بازیابی را ببند
      ================================================
      */

      await supabase.auth
        .signOut();


      /*
      ================================================
      برگشت به Login
      ================================================
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
  =======================================================
  FORM
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
