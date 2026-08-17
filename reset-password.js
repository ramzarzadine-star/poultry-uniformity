'use strict';

const SUPABASE_URL =
  'https://qxiktabmwwjygsocjcyl.supabase.co';

const SUPABASE_KEY =
  'sb_publishable_sZvkwvD50rkboFtZzTElAQ_bxGDw-Ye';


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'implicit'
      }
    }
  );


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


function showMessage(
  text,
  type = 'error'
) {

  message.textContent =
    text;

  message.className =
    'message show ' + type;

}


function setLoading(
  state
) {

  saveButton.disabled =
    state;

  loading.classList.toggle(
    'show',
    state
  );

}


async function checkRecoverySession() {

  const {
    data,
    error
  } =
    await supabaseClient.auth
      .getSession();


  if (error) {

    showMessage(
      'خطا در بررسی لینک بازیابی. لطفاً دوباره درخواست بازیابی رمز کنید.'
    );

    return false;

  }


  if (!data.session) {

    showMessage(
      'لینک بازیابی معتبر نیست یا منقضی شده است. لطفاً دوباره درخواست بازیابی رمز کنید.'
    );

    form.style.display =
      'none';

    return false;

  }


  return true;

}


form.addEventListener(
  'submit',
  async function(event) {

    event.preventDefault();

    showMessage('');

    const password =
      newPassword.value;

    const confirmation =
      confirmPassword.value;


    if (password.length < 8) {

      showMessage(
        'رمز عبور باید حداقل ۸ کاراکتر باشد.'
      );

      return;

    }


    if (password !== confirmation) {

      showMessage(
        'رمز عبور و تکرار آن یکسان نیست.'
      );

      return;

    }


    setLoading(true);


    try {

      const validSession =
        await checkRecoverySession();


      if (!validSession) {

        setLoading(false);

        return;

      }


      const {
        data,
        error
      } =
        await supabaseClient.auth
          .updateUser({
            password: password
          });


      if (error) {

        console.error(
          'UPDATE PASSWORD ERROR:',
          error
        );

        showMessage(
          error.message ||
          'تغییر رمز عبور انجام نشد.'
        );

        setLoading(false);

        return;

      }


      if (!data?.user) {

        showMessage(
          'تغییر رمز عبور تأیید نشد.'
        );

        setLoading(false);

        return;

      }


      showMessage(
        'رمز عبور با موفقیت تغییر کرد. در حال ورود به سامانه...',
        'success'
      );


      form.style.display =
        'none';


      setTimeout(
        function() {

          window.location.href =
            'index.html';

        },
        1500
      );


    } catch (error) {

      console.error(
        error
      );

      showMessage(
        'خطایی هنگام تغییر رمز عبور رخ داد. دوباره تلاش کنید.'
      );

      setLoading(false);

    }

  }
);
