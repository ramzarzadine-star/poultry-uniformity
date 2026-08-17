'use strict';

/*
  =========================================================
  مرکز تخصصی سلامت طیور آدینه
  Professional Poultry Health & Performance Management
  APP.JS — Stable Professional Version
  =========================================================

  نکته مهم:
  تاریخ‌ها در دیتابیس به صورت Gregorian ذخیره می‌شوند
  اما تمام تاریخ‌های قابل مشاهده برای کاربر به صورت شمسی
  نمایش داده می‌شوند.

  محاسبات:
  Mean
  SD
  CV%
  Uniformity ±10%
  Uniformity ±15%
  Min
  Max
*/


/* =========================================================
   DATABASE KEY
========================================================= */

const DB_KEY =
  window.ADINEH_DB_KEY ||
  'adineh_poultry_db_v7';


/* =========================================================
   GENERAL HELPERS
========================================================= */

const uid = () =>
  Date.now().toString(36) +
  Math.random().toString(36).slice(2, 10);


const esc = value =>
  String(value ?? '').replace(
    /[&<>'"]/g,
    c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[c])
  );


const num = value => {

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : null;

};


const fmt = (
  value,
  digits = 1
) => {

  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return '—';
  }

  return Number(value).toLocaleString(
    'fa-IR',
    {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits
    }
  );

};


/* =========================================================
   DATE
   ---------------------------------------------------------
   Internal storage:
   Gregorian YYYY-MM-DD

   User display:
   Persian / Jalali YYYY/MM/DD

   IMPORTANT:
   The database continues to store Gregorian dates so that
   existing records remain compatible.
========================================================= */

/*
  تاریخ امروز به وقت محلی دستگاه
  بدون استفاده از UTC
*/
const today = () => {

  const d = new Date();

  const y =
    d.getFullYear();

  const m =
    String(
      d.getMonth() + 1
    ).padStart(2, '0');

  const day =
    String(
      d.getDate()
    ).padStart(2, '0');

  return `${y}-${m}-${day}`;

};


/*
  تبدیل اعداد فارسی و عربی به انگلیسی
  برای ورود اطلاعات عددی و تاریخ
*/
function normalizeDigits(value) {

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
        String(
          '۰۱۲۳۴۵۶۷۸۹'
            .indexOf(digit)
        )
    )

    .replace(
      /[٠-٩]/g,
      digit =>
        String(
          '٠١٢٣٤٥٦٧٨٩'
            .indexOf(digit)
        )
    )

    .replace(/٬/g, '')

    .replace(/٫/g, '.');

}


/*
  تبدیل Gregorian → Jalali
*/
function gregorianToJalali(
  gy,
  gm,
  gd
) {

  const g_d_m = [
    0,
    31,
    59,
    90,
    120,
    151,
    181,
    212,
    243,
    273,
    304,
    334
  ];

  let jy;

  if (gy > 1600) {

    jy = 979;

    gy -= 1600;

  } else {

    jy = 0;

    gy -= 621;

  }

  const gy2 =
    gm > 2
      ? gy + 1
      : gy;

  let days =
    365 * gy +
    Math.floor(
      (gy2 + 3) / 4
    ) -
    Math.floor(
      (gy2 + 99) / 100
    ) +
    Math.floor(
      (gy2 + 399) / 400
    ) -
    80 +
    gd +
    g_d_m[gm - 1];

  jy +=
    33 *
    Math.floor(
      days / 12053
    );

  days %= 12053;

  jy +=
    4 *
    Math.floor(
      days / 1461
    );

  days %= 1461;

  if (days > 365) {

    jy +=
      Math.floor(
        (days - 1) / 365
      );

    days =
      (days - 1) % 365;

  }

  const jm =
    days < 186

      ? 1 +
        Math.floor(
          days / 31
        )

      : 7 +
        Math.floor(
          (days - 186) / 30
        );


  const jd =
    1 +
    (
      days < 186

        ? days % 31

        : (days - 186) % 30
    );


  return [
    jy,
    jm,
    jd
  ];

}


/*
  نمایش تاریخ Gregorian به صورت شمسی

  مثال:
  2026-08-16
  →
  ۱۴۰۵/۰۵/۲۵
*/
function toPersianDate(
  value
) {

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—';
  }

  const normalized =
    normalizeDigits(
      value
    );

  const match =
    normalized.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})/
    );

  if (!match) {
    return esc(value);
  }

  const gy =
    Number(match[1]);

  const gm =
    Number(match[2]);

  const gd =
    Number(match[3]);

  if (
    !Number.isInteger(gy) ||
    !Number.isInteger(gm) ||
    !Number.isInteger(gd) ||
    gm < 1 ||
    gm > 12 ||
    gd < 1 ||
    gd > 31
  ) {
    return esc(value);
  }

  const result =
    gregorianToJalali(
      gy,
      gm,
      gd
    );

  if (!result) {
    return esc(value);
  }

  const [
    jy,
    jm,
    jd
  ] = result;

  return [
    toPersianDigits(jy),

    toPersianDigits(
      String(jm)
        .padStart(2, '0')
    ),

    toPersianDigits(
      String(jd)
        .padStart(2, '0')
    )

  ].join('/');

}
/* =========================================================
   JALALI → GREGORIAN
========================================================= */

function jalaliToGregorian(
  jy,
  jm,
  jd
) {

  jy = Number(jy);
  jm = Number(jm);
  jd = Number(jd);

  if (
    !Number.isInteger(jy) ||
    !Number.isInteger(jm) ||
    !Number.isInteger(jd) ||
    jy < 1200 ||
    jy > 1600 ||
    jm < 1 ||
    jm > 12 ||
    jd < 1 ||
    jd > 31
  ) {
    return null;
  }

  let gy;

  if (jy > 979) {
    gy = 1600;
    jy -= 979;
  } else {
    gy = 621;
  }

  let days =
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(
      ((jy % 33) + 3) / 4
    ) +
    78 +
    jd +
    (
      jm < 7
        ? (jm - 1) * 31
        : (jm - 7) * 30 + 186
    );

  gy +=
    400 *
    Math.floor(
      days / 146097
    );

  days %= 146097;

  if (days > 36524) {

    gy +=
      100 *
      Math.floor(
        --days / 36524
      );

    days %= 36524;

    if (days >= 365) {
      days++;
    }

  }

  gy +=
    4 *
    Math.floor(
      days / 1461
    );

  days %= 1461;

  if (days > 365) {

    gy +=
      Math.floor(
        (days - 1) / 365
      );

    days =
      (days - 1) % 365;

  }

  const gd =
    days + 1;

  const leap =
    (
      gy % 4 === 0 &&
      gy % 100 !== 0
    ) ||
    gy % 400 === 0;

  const monthDays = [
    31,
    leap ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31
  ];

  let gm = 1;
  let remaining = gd;

  for (
    let i = 0;
    i < monthDays.length;
    i++
  ) {

    if (
      remaining <=
      monthDays[i]
    ) {

      gm = i + 1;
      break;

    }

    remaining -=
      monthDays[i];

  }

  return [

    gy,

    gm,

    remaining

  ];
}


/* =========================================================
   JALALI DATE INPUT HELPERS
========================================================= */

function jalaliDateToGregorian(
  value
) {

  if (!value) {
    return '';
  }

  const normalized =
    normalizeDigits(
      value
    )
      .replace(
        /[-.]/g,
        '/'
      );

  const match =
    normalized.match(
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/
    );

  if (!match) {
    return '';
  }

  const jy =
    Number(match[1]);

  const jm =
    Number(match[2]);

  const jd =
    Number(match[3]);

  const result =
    jalaliToGregorian(
      jy,
      jm,
      jd
    );

  if (!result) {
    return '';
  }

  const [
    gy,
    gm,
    gd
  ] = result;

  return [
    gy,
    String(gm).padStart(2, '0'),
    String(gd).padStart(2, '0')
  ].join('-');

}


function gregorianDateToJalaliInput(
  value
) {

  if (!value) {
    return '';
  }

  const normalized =
    normalizeDigits(
      value
    );

  const match =
    normalized.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    );

  if (!match) {
    return '';
  }

  const result =
    gregorianToJalali(
      Number(match[1]),
      Number(match[2]),
      Number(match[3])
    );

  if (!result) {
    return '';
  }

  return [

    toPersianDigits(
      result[0]
    ),

    toPersianDigits(
      String(result[1])
        .padStart(2, '0')
    ),

    toPersianDigits(
      String(result[2])
        .padStart(2, '0')
    )

  ].join('/');
}


/* =========================================================
   JALALI DATE FIELD
========================================================= */

function jalaliDateField(
  id,
  label,
  gregorianValue = today()
) {

  const jalaliValue =
    gregorianDateToJalaliInput(
      gregorianValue
    );

  return `

    <div class="field">

      <label
        for="${esc(id)}Jalali"
      >
        ${esc(label)}
      </label>

      <input
  id="${esc(id)}Jalali"
  class="jalali-date-input"
  type="text"
        inputmode="numeric"
        autocomplete="off"
        dir="ltr"
        placeholder="۱۴۰۵/۰۵/۲۵"
        value="${esc(jalaliValue)}"
      >

      <input
        id="${esc(id)}"
        type="hidden"
        value="${esc(gregorianValue)}"
      >

      <small
        class="muted"
        id="${esc(id)}Message"
      >
        تاریخ را به صورت شمسی وارد کنید
      </small>

    </div>

  `;
}


/* =========================================================
   JALALI DATE EVENT BINDING
========================================================= */

function bindJalaliDate(
  id
) {

  const visible =
    document.getElementById(
      `${id}Jalali`
    );

  const hidden =
    document.getElementById(
      id
    );

  const message =
    document.getElementById(
      `${id}Message`
    );

  if (
    !visible ||
    !hidden
  ) {
    return;
  }

  const sync =
    () => {

      const raw =
        normalizeDigits(
          visible.value
        )
          .replace(
            /[-.]/g,
            '/'
          );

      const normalized =
        raw
          .split('/')
          .filter(Boolean)
          .map(
            part =>
              part.trim()
          )
          .join('/');

      const gregorian =
        jalaliDateToGregorian(
          normalized
        );

      if (gregorian) {

        hidden.value =
          gregorian;

        visible.value =
          gregorianDateToJalaliInput(
            gregorian
          );

        if (message) {

          message.textContent =
            `تاریخ میلادی ذخیره‌شده: ${gregorian}`;

        }

        visible.classList.remove(
          'invalid'
        );

        return;

      }

      /*
        اگر کاربر هنوز تاریخ را کامل
        وارد نکرده، خطا نشان نمی‌دهیم.
      */

      if (
        normalized.length >= 8
      ) {

        hidden.value = '';

        if (message) {

          message.textContent =
            'تاریخ شمسی واردشده معتبر نیست';

        }

        visible.classList.add(
          'invalid'
        );

      } else {

        visible.classList.remove(
          'invalid'
        );

        if (message) {

          message.textContent =
            'تاریخ را به صورت شمسی وارد کنید';

        }

      }

    };

  visible.addEventListener(
    'input',
    sync
  );

  visible.addEventListener(
    'change',
    sync
  );

  sync();

}
  

/*
  تبدیل اعداد انگلیسی به فارسی برای نمایش
*/
function toPersianDigits(
  value
) {

   String(
    value ?? ''
  ).replace(
    /\d/g,
    digit =>
      '۰۱۲۳۴۵۶۷۸۹'[
        Number(digit)
      ]
  );

}


/*
  نمایش تاریخ در تمام قسمت‌های برنامه
*/
function displayDate(
  value
) {

  return toPersianDate(
    value
  );

}


/*
  محاسبه اختلاف دو تاریخ Gregorian
*/
const daysBetween = (
  start,
  end = today()
) => {

  if (!start) {
    return 0;
  }


  const normalizedStart =
    normalizeDigits(
      start
    );

  const normalizedEnd =
    normalizeDigits(
      end
    );


  const a =
    new Date(
      `${normalizedStart}T00:00:00`
    );

  const b =
    new Date(
      `${normalizedEnd}T00:00:00`
    );


  if (
    Number.isNaN(
      a.getTime()
    ) ||
    Number.isNaN(
      b.getTime()
    )
  ) {

    return 0;

  }


  return Math.max(
    0,
    Math.floor(
      (
        b.getTime() -
        a.getTime()
      ) /
      86400000
    )
  );

};
/* =========================================================
   DATABASE
========================================================= */

const defaultDB = {

  farms: [],

  houses: [],

  flocks: [],

  weights: [],

  feed: [],

  water: [],

  mortality: [],

  eggs: [],

  health: [],

  vaccines: [],

  meds: [],

  labs: [],

  environment: [],

  tasks: [],

  settings: {

    clinic:
      'مرکز تخصصی سلامت طیور آدینه'

  }

};


function createDefaultDB() {

  return JSON.parse(
    JSON.stringify(
      defaultDB
    )
  );

}


function loadDB() {

  try {

    const raw =
      localStorage.getItem(
        DB_KEY
      );

    if (!raw)
      return createDefaultDB();

    const saved =
      JSON.parse(raw);

    if (
      !saved ||
      typeof saved !== 'object'
    ) {
      return createDefaultDB();
    }

    const result =
      createDefaultDB();

    Object.keys(result)
      .forEach(key => {

        if (
          saved[key] !== undefined
        ) {
          result[key] =
            saved[key];
        }

      });

    return result;

  } catch (error) {

    console.error(
      'Database load error:',
      error
    );

    return createDefaultDB();

  }

}


let db = loadDB();


function saveDB() {

  try {

    localStorage.setItem(
      DB_KEY,
      JSON.stringify(db)
    );

    return true;

  } catch (error) {

    console.error(
      'Database save error:',
      error
    );

    toast(
      'خطا در ذخیره اطلاعات'
    );

    return false;

  }

}


/* =========================================================
   PERFORMANCE STANDARDS
========================================================= */

const standards = {

  'Hy-Line W-80': {

    type: 'layer',

    unit: 'week',

    uniformity: 85,

    rows: {

      1: [67, 75],

      2: [125, 137],

      3: [187, 206],

      4: [256, 280],

      5: [331, 361],

      6: [414, 450],

      7: [504, 546],

      8: [598, 645],

      9: [692, 744],

      10: [783, 840],

      11: [867, 927],

      12: [942, 1004],

      13: [1008, 1070],

      14: [1066, 1127],

      15: [1116, 1177],

      16: [1164, 1223],

      17: [1212, 1269]

    }

  },


  'Hy-Line W-80 Plus': {

    type: 'layer',

    unit: 'week',

    uniformity: 85,

    rows: {

      18: [1280, 1360],

      26: [1560, 1660],

      32: [1660, 1770],

      70: [1710, 1820],

      100: [1710, 1820]

    }

  },


  'Custom': {

    type: 'custom',

    unit: 'week',

    uniformity: 85,

    rows: {}

  }

};


/* =========================================================
   STATISTICS
========================================================= */

function calculateStatistics(
  weights
) {

  const values =
    weights
      .map(Number)
      .filter(
        Number.isFinite
      );


  if (!values.length)
    return null;


  const n =
    values.length;


  const sum =
    values.reduce(
      (total, value) =>
        total + value,
      0
    );


  const mean =
    sum / n;


  /*
    Sample SD
    n - 1
  */

  const variance =
    n > 1

      ? values.reduce(
          (
            total,
            value
          ) =>
            total +
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
        ) *
        100
      : 0;


  /*
    Uniformity ±10%
  */

  const lower10 =
    mean * 0.90;

  const upper10 =
    mean * 1.10;


  const u10 =
    (
      values.filter(
        value =>
          value >= lower10 &&
          value <= upper10
      ).length /
      n
    ) *
    100;


  /*
    Uniformity ±15%
  */

  const lower15 =
    mean * 0.85;

  const upper15 =
    mean * 1.15;


  const u15 =
    (
      values.filter(
        value =>
          value >= lower15 &&
          value <= upper15
      ).length /
      n
    ) *
    100;


  return {

    n,

    mean,

    sd,

    cv,

    u10,

    u15,

    min:
      Math.min(...values),

    max:
      Math.max(...values)

  };

}


/* =========================================================
   STANDARD LOOKUP
========================================================= */

function getReference(
  profile,
  ageDays
) {

  const standard =
    standards[profile];


  if (!standard)
    return null;


  const week =
    Math.max(
      1,
      Math.round(
        Number(ageDays || 0) /
        7
      )
    );


  const keys =
    Object.keys(
      standard.rows
    )
      .map(Number);


  if (!keys.length)
    return null;


  const closest =
    keys.reduce(
      (
        previous,
        current
      ) =>
        Math.abs(
          current - week
        ) <
        Math.abs(
          previous - week
        )
          ? current
          : previous
    );


  return {

    week:
      closest,

    range:
      standard.rows[
        closest
      ],

    approximate:
      closest !== week,

    targetUniformity:
      standard.uniformity

  };

}


/* =========================================================
   STATUS
========================================================= */

function performanceStatus(
  value,
  range
) {

  if (
    value === null ||
    value === undefined ||
    !range
  ) {
    return 'info';
  }


  if (
    value >= range[0] &&
    value <= range[1]
  ) {
    return 'ok';
  }


  const margin =
    (
      range[1] -
      range[0] ||
      10
    ) *
    0.15;


  if (
    value >=
      range[0] - margin &&
    value <=
      range[1] + margin
  ) {
    return 'warn';
  }


  return 'bad';

}


function badge(
  status
) {

  if (
    status === 'ok'
  ) {
    return `
      <span class="status ok">
        در محدوده
      </span>
    `;
  }


  if (
    status === 'warn'
  ) {
    return `
      <span class="status warn">
        نزدیک محدوده
      </span>
    `;
  }


  if (
    status === 'bad'
  ) {
    return `
      <span class="status bad">
        نیازمند بررسی
      </span>
    `;
  }


  return `
    <span class="status info">
      بدون مرجع
    </span>
  `;

}


/* =========================================================
   HELPERS
========================================================= */

function farmName(
  id
) {

  return (
    db.farms.find(
      item =>
        item.id === id
    )?.name ||
    '—'
  );

}


function houseName(
  id
) {

  return (
    db.houses.find(
      item =>
        item.id === id
    )?.name ||
    '—'
  );

}


function flockName(
  id
) {

  return (
    db.flocks.find(
      item =>
        item.id === id
    )?.name ||
    '—'
  );

}


function flockAge(
  flock,
  date = today()
) {

  return flock?.placement
    ? daysBetween(
        flock.placement,
        date
      )
    : 0;

}


/* =========================================================
   TOAST
========================================================= */

function toast(
  message
) {

  let element =
    document.querySelector(
      '.toast'
    );


  if (!element) {

    element =
      document.createElement(
        'div'
      );

    element.className =
      'toast';

    document.body.appendChild(
      element
    );

  }


  element.textContent =
    message;


  element.classList.add(
    'show'
  );


  setTimeout(
    () =>
      element.classList.remove(
        'show'
      ),
    2200
  );

}


/* =========================================================
   FIELD
========================================================= */

function field(
  name,
  label,
  type = 'text',
  value = '',
  options = ''
) {

  if (
    type === 'select'
  ) {

    return `
      <div class="field">

        <label
          for="${esc(name)}"
        >
          ${esc(label)}
        </label>

        <select
          id="${esc(name)}"
        >
          ${value}
        </select>

      </div>
    `;

  }


  return `
    <div class="field">

      <label
        for="${esc(name)}"
      >
        ${esc(label)}
      </label>

      <input
        id="${esc(name)}"
        type="${esc(type)}"
        value="${esc(value)}"
        ${options}
      >

    </div>
  `;

}


/* =========================================================
   NAVIGATION
========================================================= */

let currentPage =
  'dashboard';


function navigation() {

  const items = [

    [
      'dashboard',
      'داشبورد'
    ],

    [
      'farms',
      'فارم‌ها'
    ],

    [
      'houses',
      'سالن‌ها'
    ],

    [
      'flocks',
      'گله‌ها'
    ],

    [
      'weights',
      'وزن و یکنواختی'
    ],

    [
      'feed',
      'دان'
    ],

    [
      'water',
      'آب'
    ],

    [
      'eggs',
      'تولید تخم'
    ],

    [
      'health',
      'سلامت'
    ],

    [
      'labs',
      'آزمایشگاه'
    ],

    [
      'environment',
      'محیط'
    ],

    [
      'reports',
      'گزارش'
    ]

  ];


  return `
    <nav class="nav">

      ${items.map(
        (
          [
            page,
            title
          ]
        ) => `

          <button
            class="${
              currentPage === page
                ? 'active'
                : ''
            }"
            data-page="${page}"
            type="button"
          >
            ${esc(title)}
          </button>

        `
      ).join('')}

    </nav>
  `;

}


/* =========================================================
   SHELL
========================================================= */

function shell(
  title,
  description,
  content
) {

  return `

    <div class="app">

      <header class="top">

        <div class="topin">

          <div class="bar">

            <div class="brand">

              <div class="brandmark">
                🐔
              </div>

              <div>

                <b>
                  ${esc(
                    db.settings.clinic
                  )}
                </b>

                <small>
                  سامانه حرفه‌ای پایش و مدیریت طیور
                </small>

              </div>

            </div>


            <div class="topactions">

              <button
                class="glass"
                data-action="backup"
                type="button"
              >
                پشتیبان
              </button>

            </div>

          </div>

        </div>

      </header>


      <main class="shell">

        ${navigation()}


        <div class="pagehead">

          <div>

            <h1>
              ${esc(title)}
            </h1>

            <p>
              ${esc(description)}
            </p>

          </div>


          
        </div>


        ${content}


        <div class="footer">

          مرکز تخصصی سلامت طیور آدینه

          <br>

          اطلاعات این نسخه روی همین دستگاه ذخیره می‌شود.

        </div>

      </main>


      <div class="toast"></div>

    </div>

  `;

}


/* =========================================================
   DASHBOARD
========================================================= */

function dashboard() {

  let warnings = 0;


  const cards =
    db.flocks.map(
      flock => {

        const records =
          db.weights
            .filter(
              record =>
                record.flock ===
                flock.id
            )
            .sort(
              (
                a,
                b
              ) =>
                String(b.date)
                  .localeCompare(
                    String(a.date)
                  )
            );


        const latest =
          records[0];


        const reference =
          latest
            ? getReference(
                flock.standard,
                latest.ageDays
              )
            : null;


        const status =
          latest &&
          reference
            ? performanceStatus(
                latest.stats.mean,
                reference.range
              )
            : 'info';


        if (
          status === 'bad'
        ) {
          warnings++;
        }


        return `

          <div class="card">

            <div class="sectionTitle">

              <h2>
                ${esc(
                  flock.name
                )}
              </h2>

              ${badge(status)}

            </div>


            <p class="muted">

              ${esc(
                farmName(
                  flock.farm
                )
              )}

              ·

              ${esc(
                houseName(
                  flock.house
                )
              )}

              ·

              سن

              ${fmt(
                latest?.ageDays ||
                flockAge(flock),
                0
              )}

              روز

              ·

              ${esc(
                flock.standard ||
                'بدون استاندارد'
              )}

            </p>


            <div class="kpis">

              <div class="kpi">

                <small>
                  وزن
                </small>

                <strong>

                  ${
                    latest
                      ? fmt(
                          latest.stats.mean,
                          0
                        ) +
                        ' g'
                      : '—'
                  }

                </strong>

              </div>


              <div class="kpi">

                <small>
                  CV
                </small>

                <strong>

                  ${
                    latest
                      ? fmt(
                          latest.stats.cv,
                          1
                        ) +
                        '٪'
                      : '—'
                  }

                </strong>

              </div>


              <div class="kpi">

                <small>
                  Uniformity ±10%
                </small>

                <strong>

                  ${
                    latest
                      ? fmt(
                          latest.stats.u10,
                          1
                        ) +
                        '٪'
                      : '—'
                  }

                </strong>

              </div>


              <div class="kpi">

                <small>
                  مرجع وزن
                </small>

                <strong>

                  ${
                    reference
                      ? fmt(
                          reference.range[0],
                          0
                        ) +
                        '–' +
                        fmt(
                          reference.range[1],
                          0
                        )
                      : '—'
                  }

                </strong>

              </div>

            </div>

          </div>

        `;

      }
    )
    .join('');


  return shell(

    'داشبورد',

    'نمای کلی سلامت و عملکرد گله‌ها',

    `

      <div class="hero">

        <div class="heroMain">

          <h2>
            کنترل سلامت و عملکرد فارم
          </h2>

          <p>
            سن، وزن، یکنواختی، دان، آب،
            تلفات و تولید را در یک نمای واحد
            پایش کنید.
          </p>


          <div class="kpis">

            <div class="kpi">
              <small>فارم</small>
              <strong>
                ${fmt(
                  db.farms.length,
                  0
                )}
              </strong>
            </div>

            <div class="kpi">
              <small>سالن</small>
              <strong>
                ${fmt(
                  db.houses.length,
                  0
                )}
              </strong>
            </div>

            <div class="kpi">
              <small>گله</small>
              <strong>
                ${fmt(
                  db.flocks.length,
                  0
                )}
              </strong>
            </div>

            <div class="kpi">
              <small>هشدار</small>
              <strong>
                ${fmt(
                  warnings,
                  0
                )}
              </strong>
            </div>

          </div>

        </div>


        <div class="card">

          <h2>
            اقدامات سریع
          </h2>

          <div class="actions">

            <button
              class="btn"
              data-page="weights"
              type="button"
            >
              ثبت وزن
            </button>

            <button
              class="btn secondary"
              data-page="feed"
              type="button"
            >
              ثبت دان
            </button>

            <button
              class="btn secondary"
              data-page="water"
              type="button"
            >
              ثبت آب
            </button>

            <button
              class="btn secondary"
              data-page="health"
              type="button"
            >
              ثبت سلامت
            </button>

          </div>

        </div>

      </div>


      <section class="card">

        <div class="sectionTitle">

          <h2>
            وضعیت گله‌ها
          </h2>

          <span class="muted">
            آخرین رکورد
          </span>

        </div>

        ${
          cards ||
          `
            <div class="empty">
              هنوز گله‌ای ثبت نشده است.
            </div>
          `
        }

      </section>

    `

  );

}


/* =========================================================
   FARMS
========================================================= */

function farmsPage() {

  return shell(

    'مدیریت فارم',

    'ساختار اصلی اطلاعات مرکز',

    `

      <section class="card">

        <h2>
          ثبت فارم
        </h2>

        <div class="grid">

          ${field(
            'farmName',
            'نام فارم'
          )}

          ${field(
            'farmCode',
            'کد فارم'
          )}

        </div>


        <div class="actions">

          <button
            class="btn"
            data-save="farm"
            type="button"
          >
            ثبت فارم
          </button>

        </div>

      </section>


      <section class="card">

        <h2>
          فارم‌های ثبت‌شده
        </h2>

        ${table(
          db.farms,
          [
            [
              'name',
              'نام'
            ],
            [
              'code',
              'کد'
            ]
          ]
        )}

      </section>

    `

  );

}


/* =========================================================
   HOUSES
========================================================= */

function housesPage() {

  const farmOptions =
    db.farms.length

      ? db.farms.map(
          farm => `
            <option
              value="${esc(
                farm.id
              )}"
            >
              ${esc(
                farm.name
              )}
            </option>
          `
        ).join('')

      : `
          <option value="">
            ابتدا فارم ثبت کنید
          </option>
        `;


  return shell(

    'سالن‌ها',

    'هر سالن به یک فارم متصل است',

    `

      <section class="card">

        <h2>
          ثبت سالن
        </h2>

        <div class="grid">

          ${field(
            'houseName',
            'نام / شماره سالن'
          )}

          ${field(
            'houseCapacity',
            'ظرفیت',
            'number'
          )}

          ${field(
            'houseFarm',
            'فارم',
            'select',
            farmOptions
          )}

        </div>


        <div class="actions">

          <button
            class="btn"
            data-save="house"
            type="button"
          >
            ثبت سالن
          </button>

        </div>

      </section>


      <section class="card">

        <h2>
          سالن‌های ثبت‌شده
        </h2>

        ${table(

          db.houses,

          [
            [
              'name',
              'سالن'
            ],
            [
              'farm',
              'فارم'
            ],
            [
              'capacity',
              'ظرفیت'
            ]
          ],

          item => ({

            name:
              item.name,

            farm:
              farmName(
                item.farm
              ),

            capacity:
              item.capacity

          })

        )}

      </section>

    `

  );

}


/* =========================================================
   FLOCKS
========================================================= */

function flocksPage() {

  const farmOptions =
    db.farms.length

      ? db.farms.map(
          farm => `
            <option
              value="${esc(
                farm.id
              )}"
            >
              ${esc(
                farm.name
              )}
            </option>
          `
        ).join('')

      : `
          <option value="">
            ابتدا فارم ثبت کنید
          </option>
        `;


  const houseOptions =
    db.houses.length

      ? db.houses.map(
          house => `
            <option
              value="${esc(
                house.id
              )}"
            >
              ${esc(
                house.name
              )}
              —
              ${esc(
                farmName(
                  house.farm
                )
              )}
            </option>
          `
        ).join('')

      : `
          <option value="">
            ابتدا سالن ثبت کنید
          </option>
        `;


  const standardOptions =

    `
      <option value="">
        بدون استاندارد
      </option>
    ` +

    Object.keys(
      standards
    )
      .filter(
        name =>
          name !== 'Custom'
      )
      .map(
        name => `
          <option
            value="${esc(name)}"
          >
            ${esc(name)}
          </option>
        `
      )
      .join('');


  return shell(

    'مدیریت گله',

    'فارم ← سالن ← گله ← سویه ← استاندارد',

    `

      <section class="card">

        <h2>
          ثبت گله
        </h2>

        <div class="grid">

          ${field(
            'flockName',
            'نام / کد گله'
          )}

          ${field(
            'flockFarm',
            'فارم',
            'select',
            farmOptions
          )}

          ${field(
            'flockHouse',
            'سالن',
            'select',
            houseOptions
          )}

          ${field(
            'flockType',
            'نوع',
            'select',

            `
              <option>
                گوشتی
              </option>

              <option>
                تخمگذار
              </option>

              <option>
                پولت
              </option>

              <option>
                مادر
              </option>
            `
          )}

          ${jalaliDateField(
  'flockPlacement',
  'تاریخ جوجه‌ریزی',
  today()
)}

          ${field(
            'flockInitial',
            'تعداد اولیه',
            'number'
          )}

          ${field(
            'flockStrain',
            'سویه'
          )}

          ${field(
            'flockStandard',
            'استاندارد',
            'select',
            standardOptions
          )}

        </div>


        <div class="actions">

          <button
            class="btn"
            data-save="flock"
            type="button"
          >
            ثبت گله
          </button>

        </div>

      </section>


      <section class="card">

        <h2>
          گله‌های ثبت‌شده
        </h2>

        ${table(

          db.flocks,

          [
            [
              'name',
              'گله'
            ],
            [
              'farm',
              'فارم'
            ],
            [
              'house',
              'سالن'
            ],
            [
              'type',
              'نوع'
            ],
            [
              'placement',
              'جوجه‌ریزی'
            ],
            [
              'age',
              'سن'
            ],
            [
              'standard',
              'استاندارد'
            ]
          ],

          item => ({

            name:
              item.name,

            farm:
              farmName(
                item.farm
              ),

            house:
              houseName(
                item.house
              ),

            type:
              item.type,

            placement:
              displayDate(
                item.placement
              ),

            age:
              fmt(
                flockAge(item),
                0
              ) +
              ' روز',

            standard:
              item.standard ||
              '—'

          })

        )}

      </section>

    `

  );

}


/* =========================================================
   WEIGHTS
========================================================= */

function weightsPage() {

  const flockOptions =
    db.flocks.length

      ? db.flocks.map(
          flock => `
            <option
              value="${esc(
                flock.id
              )}"
            >
              ${esc(
                flock.name
              )}
            </option>
          `
        ).join('')

      : `
          <option value="">
            ابتدا گله ثبت کنید
          </option>
        `;


  return shell(

    'وزن و یکنواختی',

    'محاسبه Mean، SD، CV و Uniformity',

    `

      <section class="card">

        <h2>
          ثبت وزن‌کشی
        </h2>


        <div class="grid2">

          ${field(
            'weightFlock',
            'گله',
            'select',
            flockOptions
          )}

        ${jalaliDateField(
  'weightDate',
  'تاریخ ارزیابی',
  today()
)}

        </div>


        <div
          class="field"
          style="margin-top:10px"
        >

          <label>
            وزن‌ها بر حسب گرم
          </label>

          <textarea
            id="weightsInput"
            placeholder="مثال:
1250
1280
1190
1310
..."
          ></textarea>

        </div>


        <div class="actions">

          <button
            class="btn"
            data-action="calculateWeight"
            type="button"
          >
            محاسبه و ثبت
          </button>

        </div>


        <div id="weightResult"></div>

      </section>


      <section class="card">

        <h2>
          آخرین رکوردهای وزن
        </h2>

        ${table(

          db.weights,

          [
            [
              'date',
              'تاریخ ارزیابی'
            ],
            [
              'flock',
              'گله'
            ],
            [
              'n',
              'نمونه'
            ],
            [
              'mean',
              'میانگین'
            ],
            [
              'cv',
              'CV'
            ],
            [
              'u10',
              '±10%'
            ]
          ],

          item => ({

            date:
              displayDate(
                item.date
              ),

            flock:
              flockName(
                item.flock
              ),

            n:
              item.stats?.n ??
              '—',

            mean:
              item.stats
                ? fmt(
                    item.stats.mean,
                    1
                  ) +
                  ' g'
                : '—',

            cv:
              item.stats
                ? fmt(
                    item.stats.cv,
                    2
                  ) +
                  '٪'
                : '—',

            u10:
              item.stats
                ? fmt(
                    item.stats.u10,
                    1
                  ) +
                  '٪'
                : '—'

          })

        )}

      </section>

    `

  );

}


/* =========================================================
   SIMPLE DATA PAGES
========================================================= */

function simplePage(
  type,
  title,
  description,
  extraFields
) {

  const flockOptions =
    db.flocks.length

      ? db.flocks.map(
          flock => `
            <option
              value="${esc(
                flock.id
              )}"
            >
              ${esc(
                flock.name
              )}
            </option>
          `
        ).join('')

      : `
          <option value="">
            ابتدا گله ثبت کنید
          </option>
        `;


  const dataKey =
    type === 'environment'
      ? 'environment'
      : type;


  const records =
    Array.isArray(
      db[dataKey]
    )
      ? db[dataKey]
      : [];


  const columns =
    records.length
      ? Object.keys(
          records[0]
        )
        .filter(
          key =>
            key !== 'id'
        )
        .slice(0, 7)
      : [];


  return shell(

    title,

    description,

    `

      <section class="card">

        <h2>
          ثبت اطلاعات
        </h2>


        <div class="grid">

          ${field(
            `${type}Flock`,
            'گله',
            'select',
            flockOptions
          )}

          ${jalaliDateField(
            `${type}Date`,
            'تاریخ',
            today()
          )}

          ${extraFields}

        </div>


        <div class="actions">

          <button
            class="btn"
            data-save="${esc(type)}"
            type="button"
          >
            ثبت اطلاعات
          </button>

        </div>

      </section>


      <section class="card">

        <h2>
          سوابق
        </h2>

        ${
          records.length
            ? table(
                records,
                columns
              )
            : `
                <div class="empty">
                  هنوز رکوردی ثبت نشده است.
                </div>
              `
        }

      </section>

    `

  );

}
/* =========================================================
   TABLE
========================================================= */

function table(
  array,
  columns,
  mapper
) {

  const rows =
    Array.isArray(array)
      ? array.map(
          item =>
            mapper
              ? mapper(item)
              : item
        )
      : [];


  const cellValue = (
    row,
    column
  ) => {

    const key =
      Array.isArray(column)
        ? column[0]
        : column;


    const value =
      row?.[key];


    if (
      key === 'date' ||
      key === 'placement'
    ) {

      return displayDate(
        value
      );

    }


    return value ??
      '—';

  };


  return `

    <div class="tablewrap">

      <table>

        <thead>

          <tr>

            ${columns.map(
              column => `

                <th>
                  ${esc(
                    Array.isArray(
                      column
                    )
                      ? column[1]
                      : column
                  )}
                </th>

              `
            ).join('')}

          </tr>

        </thead>


        <tbody>

          ${
            rows.length

              ? rows.map(
                  row => `

                    <tr>

                      ${columns.map(
                        column => `

                          <td>
                            ${esc(
                              cellValue(
                                row,
                                column
                              )
                            )}
                          </td>

                        `
                      ).join('')}

                    </tr>

                  `
                ).join('')

              : `

                  <tr>

                    <td
                      colspan="${
                        columns.length ||
                        1
                      }"
                    >
                      هنوز اطلاعاتی ثبت نشده است.
                    </td>

                  </tr>

                `
          }

        </tbody>

      </table>

    </div>

  `;

}
/* =========================================================
   REPORTS
========================================================= */

function reportsPage() {

  const flockOptions =
    db.flocks.map(
      flock => `
        <option
          value="${esc(
            flock.id
          )}"
        >
          ${esc(
            flock.name
          )}
        </option>
      `
    ).join('');


  return shell(

    'گزارش مدیریتی',

    'خلاصه عملکرد گله',

    `

      <section class="card">

        <h2>
          انتخاب گله
        </h2>


        <div class="grid">

          ${field(
            'reportFlock',
            'گله',
            'select',
            flockOptions
          )}

        </div>


        <div class="actions">

          <button
            class="btn"
            data-action="report"
            type="button"
          >
            ساخت گزارش
          </button>

          <button
            class="btn secondary"
            type="button"
            data-action="printReport"
          >
            چاپ / PDF
          </button>

        </div>


        <div id="reportResult"></div>

      </section>

    `

  );

}


/* =========================================================
   RENDER
========================================================= */

function render() {

  let html = '';


  switch (
    currentPage
  ) {

    case 'farms':

      html =
        farmsPage();

      break;


    case 'houses':

      html =
        housesPage();

      break;


    case 'flocks':

      html =
        flocksPage();

      break;


    case 'weights':

      html =
        weightsPage();

      break;


    case 'feed':

      html =
        simplePage(

          'feed',

          'مصرف دان',

          'ثبت مصرف روزانه دان',

          field(
            'feedKg',
            'دان مصرفی kg',
            'number'
          )

        );

      break;


    case 'water':

      html =
        simplePage(

          'water',

          'مصرف آب',

          'ثبت مصرف روزانه آب',

          field(
            'waterL',
            'آب مصرفی L',
            'number'
          )

        );

      break;


    case 'eggs':

      html =
        simplePage(

          'eggs',

          'تولید تخم',

          'ثبت تولید روزانه تخم',

          field(
            'eggCount',
            'تعداد تخم',
            'number'
          ) +

          field(
            'eggBirds',
            'تعداد پرنده',
            'number'
          ) +

          field(
            'eggWeight',
            'میانگین وزن تخم g',
            'number'
          )

        );

      break;


    case 'health':

      html =
        simplePage(

          'health',

          'سلامت و تلفات',

          'ثبت تلفات و وضعیت سلامت',

          field(
            'healthMortality',
            'تلفات',
            'number'
          ) +

          field(
            'healthCull',
            'حذفی',
            'number'
          ) +

          field(
            'healthNote',
            'یادداشت'
          )

        );

      break;


    case 'labs':

      html =
        simplePage(

          'labs',

          'آزمایشگاه',

          'PCR / ELISA / پایش آزمایشگاهی',

          field(
            'labTest',
            'نوع آزمایش'
          ) +

          field(
            'labCt',
            'Ct',
            'number'
          ) +

          field(
            'labGmt',
            'GMT',
            'number'
          ) +

          field(
            'labCv',
            'CV %',
            'number'
          )

        );

      break;


    case 'environment':

      html =
        simplePage(

          'environment',

          'محیط سالن',

          'پایش دما، رطوبت، آمونیاک و CO₂',

          field(
            'environmentTemp',
            'دما °C',
            'number'
          ) +

          field(
            'environmentRh',
            'RH %',
            'number'
          ) +

          field(
            'environmentNh3',
            'NH₃ ppm',
            'number'
          ) +

          field(
            'environmentCo2',
            'CO₂ ppm',
            'number'
          )

        );

      break;


    case 'reports':

      html =
        reportsPage();

      break;


    default:

      html =
        dashboard();

  }


  const app =
    document.getElementById(
      'app'
    );


  if (!app) {

    console.error(
      'Element #app not found.'
    );

    return;

  }


  app.innerHTML =
    html;


  bindEvents();

}


/* =========================================================
   SAVE FORMS
========================================================= */

function saveForm(
  type
) {

  const id =
    uid();


  if (
    type === 'farm'
  ) {

    const name =
      document
        .getElementById(
          'farmName'
        )
        ?.value
        .trim();


    if (!name) {

      toast(
        'نام فارم را وارد کنید'
      );

      return;

    }


    db.farms.push({

      id,

      name,

      code:
        document
          .getElementById(
            'farmCode'
          )
          ?.value
          .trim() ||
        ''

    });

  }


  else if (
    type === 'house'
  ) {

    const name =
      document
        .getElementById(
          'houseName'
        )
        ?.value
        .trim();


    const farm =
      document
        .getElementById(
          'houseFarm'
        )
        ?.value;


    const capacity =
      num(
        document
          .getElementById(
            'houseCapacity'
          )
          ?.value
      ) || 0;


    if (
      !name ||
      !farm
    ) {

      toast(
        'نام سالن و فارم الزامی است'
      );

      return;

    }


    db.houses.push({

      id,

      name,

      farm,

      capacity

    });

  }


  else if (
    type === 'flock'
  ) {

    const name =
      document
        .getElementById(
          'flockName'
        )
        ?.value
        .trim();


    const farm =
      document
        .getElementById(
          'flockFarm'
        )
        ?.value;


    const house =
      document
        .getElementById(
          'flockHouse'
        )
        ?.value;


    const placement =
      document
        .getElementById(
          'flockPlacement'
        )
        ?.value;


    const initial =
      num(
        document
          .getElementById(
            'flockInitial'
          )
          ?.value
      );


    if (
      !name ||
      !farm ||
      !house ||
      !placement ||
      !initial ||
      initial < 1
    ) {

      toast(
        'اطلاعات اصلی گله را کامل کنید'
      );

      return;

    }


    const selectedHouse =
      db.houses.find(
        item =>
          item.id ===
          house
      );


    if (
      !selectedHouse ||
      selectedHouse.farm !==
        farm
    ) {

      toast(
        'سالن انتخاب‌شده متعلق به این فارم نیست'
      );

      return;

    }


    db.flocks.push({

      id,

      name,

      farm,

      house,

      type:
        document
          .getElementById(
            'flockType'
          )
          ?.value ||
        '',

      placement,

      initial,

      strain:
        document
          .getElementById(
            'flockStrain'
          )
          ?.value
          .trim() ||
        '',

      standard:
        document
          .getElementById(
            'flockStandard'
          )
          ?.value ||
        ''

    });

  }


  else {

    const flockElement =
      document.getElementById(
        `${type}Flock`
      );


    const dateElement =
      document.getElementById(
        `${type}Date`
      );


    const flock =
      flockElement?.value;


    const date =
      dateElement?.value ||
      today();


    if (!flock) {

      toast(
        'گله را انتخاب کنید'
      );

      return;

    }


    const record = {

      id,

      date,

      flock

    };


    if (
      type === 'feed'
    ) {

      record.kg =
        num(
          document
            .getElementById(
              'feedKg'
            )
            ?.value
        );

    }


    if (
      type === 'water'
    ) {

      record.l =
        num(
          document
            .getElementById(
              'waterL'
            )
            ?.value
        );

    }


    if (
      type === 'eggs'
    ) {

      record.count =
        num(
          document
            .getElementById(
              'eggCount'
            )
            ?.value
        );


      record.birds =
        num(
          document
            .getElementById(
              'eggBirds'
            )
            ?.value
        );


      record.weight =
        num(
          document
            .getElementById(
              'eggWeight'
            )
            ?.value
        );


      if (
        record.birds &&
        record.birds > 0
      ) {

        record.hd =
          (
            record.count /
            record.birds
          ) *
          100;

      }

    }


    if (
      type === 'health'
    ) {

      record.mortality =
        num(
          document
            .getElementById(
              'healthMortality'
            )
            ?.value
        ) || 0;


      record.cull =
        num(
          document
            .getElementById(
              'healthCull'
            )
            ?.value
        ) || 0;


      record.note =
        document
          .getElementById(
            'healthNote'
          )
          ?.value ||
        '';

    }


    if (
      type === 'labs'
    ) {

      record.test =
        document
          .getElementById(
            'labTest'
          )
          ?.value ||
        '';


      record.ct =
        num(
          document
            .getElementById(
              'labCt'
            )
            ?.value
        );


      record.gmt =
        num(
          document
            .getElementById(
              'labGmt'
            )
            ?.value
        );


      record.cv =
        num(
          document
            .getElementById(
              'labCv'
            )
            ?.value
        );

    }


    if (
      type === 'environment'
    ) {

      record.temp =
        num(
          document
            .getElementById(
              'environmentTemp'
            )
            ?.value
        );


      record.rh =
        num(
          document
            .getElementById(
              'environmentRh'
            )
            ?.value
        );


      record.nh3 =
        num(
          document
            .getElementById(
              'environmentNh3'
            )
            ?.value
        );


      record.co2 =
        num(
          document
            .getElementById(
              'environmentCo2'
            )
            ?.value
        );

    }


    const key =
      type === 'environment'
        ? 'environment'
        : type;


    if (
      !Array.isArray(
        db[key]
      )
    ) {

      db[key] = [];

    }


    db[key].push(
      record
    );

  }


  if (
    saveDB()
  ) {

    toast(
      'اطلاعات با موفقیت ثبت شد'
    );

    render();

  }

}


/* =========================================================
   ACTIONS
========================================================= */

function actions(
  action
) {

  if (
    action ===
    'calculateWeight'
  ) {

    calculateWeight();

    return;

  }


  if (
    action ===
    'backup'
  ) {

    backupDatabase();

    return;

  }


  if (
    action ===
    'report'
  ) {

    buildReport();

    return;

  }


  if (
    action ===
    'printReport'
  ) {

    window.print();

    return;

  }

}


/* =========================================================
   WEIGHT CALCULATION
========================================================= */

function calculateWeight() {

  const flockElement =
    document.getElementById(
      'weightFlock'
    );


  const dateElement =
    document.getElementById(
      'weightDate'
    );


  const inputElement =
    document.getElementById(
      'weightsInput'
    );


  if (
    !flockElement ||
    !inputElement
  ) {

    toast(
      'فرم وزن‌کشی پیدا نشد'
    );

    return;

  }


  const flockId =
    flockElement.value;


  const date =
    dateElement?.value ||
    today();


  const raw =
    inputElement.value
      .trim();


  /*
    پشتیبانی از:
    Enter
    فاصله
    ,
    ،
    ;
  */

  const values =
    raw
      .split(
        /[\s,،;]+/
      )
      .map(
        value => {

          /*
            پشتیبانی از اعداد فارسی
          */

          const normalized =
            String(value)
              .replace(
                /[۰-۹]/g,
                d =>
                  String(
                    '۰۱۲۳۴۵۶۷۸۹'
                      .indexOf(d)
                  )
              )
              .replace(
                /٬/g,
                ''
              )
              .replace(
                /٫/g,
                '.'
              );

          return Number(
            normalized
          );

        }
      )
      .filter(
        Number.isFinite
      );


  /*
    حداقل نمونه عملیاتی:
    30 پرنده
  */

  if (
    values.length < 30
  ) {

    toast(
      `حداقل ۳۰ وزن لازم است؛ اکنون ${fmt(
        values.length,
        0
      )} وزن وارد شده`
    );

    return;

  }


  /*
    کنترل محدوده وزن
  */

  if (
    values.some(
      value =>
        value < 20 ||
        value > 10000
    )
  ) {

    toast(
      'حداقل یکی از وزن‌ها نامعتبر است'
    );

    return;

  }


  const stats =
    calculateStatistics(
      values
    );


  if (!stats) {

    toast(
      'محاسبه آماری انجام نشد'
    );

    return;

  }


  const flock =
    db.flocks.find(
      item =>
        item.id ===
        flockId
    );


  if (!flock) {

    toast(
      'گله انتخاب نشده است'
    );

    return;

  }


  /*
    سن گله در تاریخ ارزیابی
  */

  const ageDays =
    flockAge(
      flock,
      date
    );


  const record = {

    id:
      uid(),

    date,

    flock:
      flockId,

    ageDays,

    weights:
      values,

    stats,

    createdAt:
      Date.now()

  };


  db.weights.push(
    record
  );


  if (
    !saveDB()
  ) {

    return;

  }


  const reference =
    getReference(
      flock.standard,
      ageDays
    );


  const status =
    reference
      ? performanceStatus(
          stats.mean,
          reference.range
        )
      : 'info';


  const result =
    document.getElementById(
      'weightResult'
    );


  if (!result)
    return;


  result.innerHTML = `

    <section class="card">

      <div class="sectionTitle">

        <h2>
          نتیجه ارزیابی
        </h2>

        ${badge(status)}

      </div>


      <div class="alert">

        <strong>
          تاریخ ارزیابی:
        </strong>

        ${esc(
          displayDate(
            date
          )
        )}

        <br>

        <strong>
          سن گله:
        </strong>

        ${fmt(
          ageDays,
          0
        )}

        روز

      </div>


      <div class="kpis">

        <div class="kpi">

          <small>
            تعداد نمونه
          </small>

          <strong>
            ${fmt(
              stats.n,
              0
            )}
          </strong>

        </div>


        <div class="kpi">

          <small>
            میانگین
          </small>

          <strong>
            ${fmt(
              stats.mean,
              1
            )}
            g
          </strong>

        </div>


        <div class="kpi">

          <small>
            SD
          </small>

          <strong>
            ${fmt(
              stats.sd,
              1
            )}
          </strong>

        </div>


        <div class="kpi">

          <small>
            CV
          </small>

          <strong>
            ${fmt(
              stats.cv,
              2
            )}٪
          </strong>

        </div>


        <div class="kpi">

          <small>
            Uniformity ±10%
          </small>

          <strong>
            ${fmt(
              stats.u10,
              1
            )}٪
          </strong>

        </div>


        <div class="kpi">

          <small>
            Uniformity ±15%
          </small>

          <strong>
            ${fmt(
              stats.u15,
              1
            )}٪
          </strong>

        </div>


        <div class="kpi">

          <small>
            حداقل
          </small>

          <strong>
            ${fmt(
              stats.min,
              0
            )}
            g
          </strong>

        </div>


        <div class="kpi">

          <small>
            حداکثر
          </small>

          <strong>
            ${fmt(
              stats.max,
              0
            )}
            g
          </strong>

        </div>

      </div>


      ${
        reference

          ? `

            <div
              class="alert ${
                status === 'bad'
                  ? 'bad'
                  : status === 'ok'
                    ? 'good'
                    : ''
              }"
            >

              <strong>
                استاندارد:
              </strong>

              ${esc(
                flock.standard
              )}

              <br>

              <strong>
                سن مرجع:
              </strong>

              ${fmt(
                reference.week,
                0
              )}
              هفته

              <br>

              <strong>
                محدوده وزن:
              </strong>

              ${fmt(
                reference.range[0],
                0
              )}

              تا

              ${fmt(
                reference.range[1],
                0
              )}
              گرم

              <br>

              <strong>
                هدف Uniformity:
              </strong>

              ≥

              ${fmt(
                reference.targetUniformity,
                0
              )}٪

              ${
                reference.approximate
                  ? `
                    <br>

                    <span class="muted">
                      برای این سن، نزدیک‌ترین
                      سن موجود در جدول استاندارد
                      برای مقایسه استفاده شده است.
                    </span>
                  `
                  : ''
              }

            </div>

          `

          : `

            <div class="alert">

              برای این گله استاندارد مرجع
              انتخاب نشده است.

            </div>

          `
      }


      <p class="muted">

        توجه:
        خروج از محدوده استاندارد به‌تنهایی
        تشخیص بیماری نیست و باید روند گله،
        دان، آب، محیط و وضعیت سلامت نیز بررسی شود.

      </p>

    </section>

  `;


  toast(
    'وزن محاسبه و ثبت شد'
  );

}


/* =========================================================
   BACKUP
========================================================= */

function backupDatabase() {

  try {

    const data =
      JSON.stringify(
        db,
        null,
        2
      );


    const blob =
      new Blob(
        [data],
        {
          type:
            'application/json'
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        'a'
      );


    link.href =
      url;


    link.download =
      'adineh-poultry-backup.json';


    document.body.appendChild(
      link
    );


    link.click();


    link.remove();


    setTimeout(
      () =>
        URL.revokeObjectURL(
          url
        ),
      1000
    );


    toast(
      'پشتیبان ساخته شد'
    );

  } catch (error) {

    console.error(
      'Backup error:',
      error
    );

    toast(
      'ساخت پشتیبان ناموفق بود'
    );

  }

}


/* =========================================================
   REPORT
========================================================= */

function buildReport() {

  const flockElement =
    document.getElementById(
      'reportFlock'
    );


  const result =
    document.getElementById(
      'reportResult'
    );


  const flockId =
    flockElement?.value;


  const flock =
    db.flocks.find(
      item =>
        item.id ===
        flockId
    );


  if (
    !flock ||
    !result
  ) {

    toast(
      'گله‌ای برای گزارش انتخاب نشده است'
    );

    return;

  }


  const records =
    db.weights
      .filter(
        item =>
          item.flock ===
          flock.id
      )
      .sort(
        (
          a,
          b
        ) =>
          String(b.date)
            .localeCompare(
              String(a.date)
            )
      );


  const latest =
    records[0];


  const reference =
    latest
      ? getReference(
          flock.standard,
          latest.ageDays
        )
      : null;


  result.innerHTML = `

    <div class="card">

      <h2>
        گزارش گله
        ${esc(
          flock.name
        )}
      </h2>


      <p>

        فارم:

        ${esc(
          farmName(
            flock.farm
          )
        )}

        ·

        سالن:

        ${esc(
          houseName(
            flock.house
          )
        )}

        ·

        سن:

        ${fmt(
          flockAge(flock),
          0
        )}
        روز

      </p>


      ${
        latest

          ? `

            <div class="alert">

              <strong>
                آخرین تاریخ ارزیابی:
              </strong>

              ${esc(
                displayDate(
                  latest.date
                )
              )}

            </div>


            <div class="kpis">

              <div class="kpi">

                <small>
                  میانگین وزن
                </small>

                <strong>
                  ${fmt(
                    latest.stats.mean,
                    1
                  )}
                  g
                </strong>

              </div>


              <div class="kpi">

                <small>
                  SD
                </small>

                <strong>
                  ${fmt(
                    latest.stats.sd,
                    1
                  )}
                </strong>

              </div>


              <div class="kpi">

                <small>
                  CV
                </small>

                <strong>
                  ${fmt(
                    latest.stats.cv,
                    2
                  )}٪
                </strong>

              </div>


              <div class="kpi">

                <small>
                  Uniformity ±10%
                </small>

                <strong>
                  ${fmt(
                    latest.stats.u10,
                    1
                  )}٪
                </strong>

              </div>


              <div class="kpi">

                <small>
                  Uniformity ±15%
                </small>

                <strong>
                  ${fmt(
                    latest.stats.u15,
                    1
                  )}٪
                </strong>

              </div>


              <div class="kpi">

                <small>
                  استاندارد
                </small>

                <strong>

                  ${
                    reference
                      ? fmt(
                          reference.range[0],
                          0
                        ) +
                        '–' +
                        fmt(
                          reference.range[1],
                          0
                        ) +
                        ' g'
                      : '—'
                  }

                </strong>

              </div>

            </div>

          `

          : `

            <div class="empty">

              برای این گله هنوز
              وزن ثبت نشده است.

            </div>

          `
      }

    </div>

  `;

}


/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {

  /*
    Navigation
  */

  document
    .querySelectorAll(
      '[data-page]'
    )
    .forEach(
      button => {

        button.onclick =
          () => {

            currentPage =
              button.dataset.page;

            render();

          };

      }
    );


  /*
    Save buttons
  */

  document
    .querySelectorAll(
      '[data-save]'
    )
    .forEach(
      button => {

        button.onclick =
          () => {

            saveForm(
              button.dataset.save
            );

          };

      }
    );


  /*
    Actions
  */

  document
    .querySelectorAll(
      '[data-action]'
    )
    .forEach(
      button => {

        button.onclick =
          () => {

            actions(
              button.dataset.action
            );

          };

      }
    );


  /*
    Jalali date fields

    تمام فیلدهایی که با
    jalaliDateField()
    ساخته شده‌اند به صورت خودکار
    متصل می‌شوند.
  */

  document
    .querySelectorAll(
      '.jalali-date-input'
    )
    .forEach(
      input => {

        const id =
          String(
            input.id || ''
          ).replace(
            /Jalali$/,
            ''
          );


        if (id) {

          bindJalaliDate(
            id
          );

        }

      }
    );

}
/* =========================================================
   GLOBAL ERROR PROTECTION
========================================================= */

window.addEventListener(
  'error',
  event => {

    console.error(
      'Adineh App Error:',
      event.error ||
      event.message
    );

  }
);


window.addEventListener(
  'unhandledrejection',
  event => {

    console.error(
      'Adineh Promise Error:',
      event.reason
    );

  }
);


/* =========================================================
   START
========================================================= */

if (
  window.ADINEH_AUTH &&
  window.ADINEH_AUTH.ready
) {

  render();

} else {

  document.addEventListener(
    'adineh-auth-ready',
    () => {

      render();

    },
    {
      once: true
    }
  );

}
