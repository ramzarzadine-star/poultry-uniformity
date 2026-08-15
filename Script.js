'use strict';

/*
  =========================================================
  ADINEH POULTRY
  Script.js Compatibility Layer
  =========================================================

  سیستم اصلی برنامه:
      index.html
          ↓
      app.js

  این فایل فقط برای سازگاری با صفحات قدیمی
  نگه داشته شده است.
*/


/* =========================================================
   کاربر فعال
========================================================= */

function getActiveUser() {

    return (
        localStorage.getItem(
            'activeUser'
        ) || 'guest'
    );

}


/* =========================================================
   نمایش کاربر
========================================================= */

function showUser() {

    const box =
        document.getElementById(
            'userBox'
        );


    if (!box) return;


    const user =
        getActiveUser();


    box.textContent =
        user === 'guest'
            ? '👤 حالت مهمان'
            : `👤 ${user}`;

}


/* =========================================================
   خروج
========================================================= */

function logout() {

    localStorage.removeItem(
        'activeUser'
    );


    location.href =
        'login.html';

}


/* =========================================================
   رفتن به سیستم اصلی
========================================================= */

function openMainApp(
    page = 'dashboard'
) {

    try {

        sessionStorage.setItem(
            'adineh_requested_page',
            page
        );

    } catch {

        /* ignore */

    }


    location.href =
        'index.html';

}


/* =========================================================
   تبدیل اعداد فارسی
========================================================= */

function normalizeNumber(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return '';
    }


    return String(value)

        .replace(
            /[۰-۹]/g,
            digit =>
                '۰۱۲۳۴۵۶۷۸۹'
                    .indexOf(digit)
        )

        .replace(
            /[٠-٩]/g,
            digit =>
                '٠١٢٣٤٥٦٧٨٩'
                    .indexOf(digit)
        )

        .replace(
            /٫/g,
            '.'
        )

        .replace(
            /،/g,
            ','
        );

}


/* =========================================================
   تبدیل وزن‌ها
========================================================= */

function parseWeights(text) {

    const normalized =
        normalizeNumber(text);


    return normalized

        .replace(
            /[،;؛\n\r]+/g,
            ','
        )

        .split(
            /[\s,]+/
        )

        .map(
            Number
        )

        .filter(
            value =>
                Number.isFinite(value) &&
                value > 0
        );

}


/* =========================================================
   محاسبات استاندارد
========================================================= */

function calculateWeightStatistics(
    weights
) {

    const values =
        Array.isArray(weights)
            ? weights
                .map(Number)
                .filter(
                    Number.isFinite
                )
            : [];


    if (!values.length) {

        return null;

    }


    const n =
        values.length;


    const mean =
        values.reduce(
            (sum, value) =>
                sum + value,
            0
        ) / n;


    /*
      SD نمونه‌ای
      برای ارزیابی نمونه وزن‌کشی
    */

    const variance =
        n > 1

            ? values.reduce(
                (sum, value) =>
                    sum +
                    Math.pow(
                        value - mean,
                        2
                    ),
                0
              ) /
              (n - 1)

            : 0;


    const sd =
        Math.sqrt(
            variance
        );


    const cv =
        mean > 0
            ? (
                sd /
                mean
              ) * 100
            : 0;


    const uniformity =
        tolerance =>
            values.filter(
                value =>
                    value >=
                    mean *
                    (1 - tolerance) &&

                    value <=
                    mean *
                    (1 + tolerance)
            ).length /
            n *
            100;


    return {

        n,

        mean,

        sd,

        cv,

        u10:
            uniformity(
                0.10
            ),

        u15:
            uniformity(
                0.15
            ),

        min:
            Math.min(
                ...values
            ),

        max:
            Math.max(
                ...values
            )

    };

}


/* =========================================================
   اجرای اولیه
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        showUser();

    }
);
