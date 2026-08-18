'use strict';

/* =========================================================
   مرکز تخصصی سلامت طیور آدینه
   APPLICATION BOOTSTRAP
========================================================= */

(function () {

  let started = false;


  async function startApp() {

    if (started) {
      return;
    }


    started = true;


    try {

      if (
        !window.ADINEH_AUTH?.ready
      ) {

        throw new Error(
          'احراز هویت هنوز آماده نیست.'
        );

      }


      if (
        !window.AdinehCloudDB
      ) {

        throw new Error(
          'لایه پایگاه داده بارگذاری نشده است.'
        );

      }


      const initialDB =
        await window.AdinehCloudDB.hydrate();


      window.ADINEH_INITIAL_DB =
        initialDB;


      const script =
        document.createElement(
          'script'
        );


      script.src =
        'app.js?v=20260818-cloud1';


      script.async =
        false;


      script.onload =
        function () {

          console.info(
            '[Adineh] Application loaded successfully.'
          );

        };


      script.onerror =
        function () {

          started =
            false;


          showFatal(
            'خطا در بارگذاری برنامه.'
          );

        };


      document.body.appendChild(
        script
      );

    }

    catch (error) {

      console.error(
        '[Adineh] Startup error:',
        error
      );


      started =
        false;


      showFatal(
        error?.message ||
        'ارتباط با پایگاه داده برقرار نشد.'
      );

    }

  }


  function showFatal(
    message
  ) {

    const app =
      document.getElementById(
        'app'
      );


    if (!app) {
      return;
    }


    app.innerHTML = `

      <div style="
        padding:32px;
        text-align:center;
        font-family:Vazirmatn,Tahoma,sans-serif;
        line-height:2;
      ">

        <strong style="
          display:block;
          font-size:18px;
          color:#b42318;
        ">
          ${message}
        </strong>


        <button
          onclick="location.reload()"
          style="
            margin-top:16px;
            padding:10px 18px;
            border:0;
            border-radius:10px;
            background:#0b766e;
            color:#fff;
            cursor:pointer;
          "
        >
          تلاش مجدد
        </button>

      </div>

    `;

  }


  if (
    window.ADINEH_AUTH?.ready
  ) {

    startApp();

  }

  else {

    document.addEventListener(
      'adineh-auth-ready',
      startApp,
      {
        once: true
      }
    );

  }

})();
