'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
RESET PASSWORD
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

  function setBusy(
    value
  ) {

    busy =
      value;


    if (saveButton) {

      saveButton.disabled =
        value;

    }


    if (loading) {

      loading.classList.toggle(
        'show',
        value
      );

    }

  }


  /*
  =======================================================
  LOGIN URL
  =======================================================
  */

  function goLogin(
    messageText = ''
  ) {

    const url =
      new URL(
        'login.html',
        window.location.href
      );


    if (messageText) {

      url.searchParams.set(
        'message',
        messageText
      );

    }


    window.location.replace(
      url.href
    );

  }


  /*
  =======================================================
  INITIALIZE
  =======================================================
  */

  async function initialize() {

    if (!supabase) {

      showMessage(
        'اتصال به سامانه احراز هویت برقرار نشد.'
      );


      return;

    }


    /*
    =====================================================
    اگر لینک Recovery با Hash آمده باشد،
    Supabase باید آن را تبدیل به Session کند.
    =====================================================
    */

    const hash =
      window.location.hash || '';


    const search =
      window.location.search || '';


    const hasRecoveryData =
      hash.includes(
        'access_token='
      ) ||
      hash.includes(
        'type=recovery'
      ) ||
      search.includes(
        'code='
      );


    /*
    =====================================================
    اول اجازه می‌دهیم Supabase URL را پردازش کند.
    =====================================================
    */

    if (hasRecoveryData) {

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            800
          )
      );

    }


    /*
    =====================================================
    Session
    =====================================================
    */

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


      showMessage(
        'خطا در بررسی لینک بازیابی. لطفاً دوباره لینک بازیابی دریافت کنید.'
      );


      return;

    }


    /*
    =====================================================
    Session معتبر
    =====================================================
    */

    if (
      data?.session?.user
    ) {

      showMessage(
        'لینک بازیابی معتبر است. رمز عبور جدید خود را وارد کنید.',
        'success'
      );


      return;

    }


    /*
    =====================================================
    Session نداریم
    =====================================================
    */

    if (!hasRecoveryData) {

      showMessage(
        'این صفحه فقط از طریق لینک بازیابی ایمیل قابل استفاده است.'
      );


      if (form) {

        form.style.display =
          'none';

      }


      return;

    }


    /*
    لینک وجود دارد ولی Session ساخته نشده
    */

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


    if (busy) {

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
    رمز حداقل ۸ کاراکتر
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
    تطابق رمزها
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


    setBusy(true);


    try {

      /*
      قبل از تغییر رمز Session را بررسی کن
      */

      const {
        data: sessionData
      } =
        await supabase.auth
          .getSession();


      if (
        !sessionData?.session
      ) {

        setBusy(false);


        showMessage(
          'نشست بازیابی معتبر نیست. لطفاً دوباره لینک بازیابی دریافت کنید.'
        );


        return;

      }


      /*
      =====================================================
      تغییر رمز
      =====================================================
      */

      const {
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


        setBusy(false);


        showMessage(
          error.message ||
          'تغییر رمز عبور انجام نشد.'
        );


        return;

      }


      /*
      موفق
      */

      showMessage(
        'رمز عبور با موفقیت تغییر کرد.',
        'success'
      );


      setBusy(false);


      if (form) {

        form.style.display =
          'none';

      }


      /*
      Session را ببند
      */

      setTimeout(
        async () => {

          try {

            await supabase.auth
              .signOut();

          }

          catch (error) {

            console.warn(
              error
            );

          }


          goLogin(
            'رمز عبور با موفقیت تغییر کرد. اکنون با رمز جدید وارد شوید.'
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


      setBusy(false);


      showMessage(
        error?.message ||
        'خطایی هنگام تغییر رمز عبور رخ داد.'
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

  initialize();

})();
