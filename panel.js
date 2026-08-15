'use strict';

/*
  =========================================================
  ADINEH POULTRY
  panel.js
  Legacy Panel Controller
  =========================================================

  پنل قدیمی دیگر سیستم مستقل نیست.
  تمام اطلاعات باید توسط app.js مدیریت شود.
*/


(function () {

    function getRequestedPage() {

        try {

            return (
                sessionStorage.getItem(
                    'adineh_requested_page'
                ) ||
                'dashboard'
            );

        } catch {

            return 'dashboard';

        }

    }


    function clearRequestedPage() {

        try {

            sessionStorage.removeItem(
                'adineh_requested_page'
            );

        } catch {

            /* ignore */

        }

    }


    function goToMainApp() {

        const page =
            getRequestedPage();


        clearRequestedPage();


        /*
          اگر app.js روی index.html
          صفحه را از sessionStorage
          بخواند، همان صفحه باز می‌شود.
        */

        location.href =
            'index.html';

    }


    document.addEventListener(
        'DOMContentLoaded',
        () => {

            /*
              panel.html دیگر داشبورد مستقل نیست.
              سیستم اصلی index.html است.
            */

            goToMainApp();

        }
    );

})();
