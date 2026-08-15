'use strict';

/*
  مرکز تخصصی سلامت طیور آدینه
  Professional Poultry Health & Performance Management
  V7
*/

const DB_KEY =
  window.ADINEH_DB_KEY ||
  'adineh_poultry_db_v7'; 

const uid = () =>
  Date.now().toString(36) +
  Math.random().toString(36).slice(2, 8);

const esc = value =>
  String(value ?? '').replace(/[&<>'"]/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[c]));

const num = value => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const fmt = (value, digits = 1) => {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) return '—';

  return Number(value).toLocaleString('fa-IR', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  });
};

const today = () =>
  new Date().toISOString().slice(0, 10);

const daysBetween = (start, end = today()) => {
  if (!start) return 0;

  const a = new Date(start);
  const b = new Date(end);

  return Math.max(
    0,
    Math.floor((b - a) / 86400000)
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
    clinic: 'مرکز تخصصی سلامت طیور آدینه'
  }
};

function loadDB() {

  try {

    const saved =
      JSON.parse(
        localStorage.getItem(DB_KEY) || '{}'
      );

    return {
      ...structuredClone(defaultDB),
      ...saved
    };

  } catch {

    return structuredClone(defaultDB);

  }
}

let db = loadDB();

function saveDB() {
  localStorage.setItem(
    DB_KEY,
    JSON.stringify(db)
  );
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

  /*
    استاندارد سفارشی
    اعداد فرضی برای سویه‌های دیگر وارد نشده‌اند.
  */

  'Custom': {

    type: 'custom',
    unit: 'week',
    uniformity: 85,
    rows: {}

  }

};


/* =========================================================
   CALCULATIONS
========================================================= */

function calculateStatistics(weights) {

  const values = weights
    .map(Number)
    .filter(Number.isFinite);

  if (!values.length)
    return null;

  const n = values.length;

  const mean =
    values.reduce(
      (sum, value) => sum + value,
      0
    ) / n;

  const variance =
  n > 1
    ? values.reduce(
        (sum, value) =>
          sum + Math.pow(value - mean, 2),
        0
      ) / (n - 1)
    : 0;

  const sd = Math.sqrt(variance);

  const cv =
    mean > 0
      ? (sd / mean) * 100
      : 0;

  const u10 =
    values.filter(
      value =>
        value >= mean * 0.90 &&
        value <= mean * 1.10
    ).length / n * 100;

  const u15 =
    values.filter(
      value =>
        value >= mean * 0.85 &&
        value <= mean * 1.15
    ).length / n * 100;

  return {

    n,
    mean,
    sd,
    cv,
    u10,
    u15,

    min: Math.min(...values),
    max: Math.max(...values)

  };
}


/* =========================================================
   STANDARD LOOKUP
========================================================= */

function getReference(profile, ageDays) {

  const standard =
    standards[profile];

  if (!standard)
    return null;

  const week =
    Math.max(
      1,
      Math.round(ageDays / 7)
    );

  const keys =
    Object.keys(
      standard.rows
    ).map(Number);

  if (!keys.length)
    return null;

  const closest =
    keys.reduce(
      (previous, current) =>
        Math.abs(current - week) <
        Math.abs(previous - week)
          ? current
          : previous
    );

  return {

    week: closest,

    range:
      standard.rows[closest],

    approximate:
      closest !== week,

    targetUniformity:
      standard.uniformity

  };
}


/* =========================================================
   STATUS
========================================================= */

function performanceStatus(value, range) {

  if (
    value === null ||
    value === undefined ||
    !range
  )
    return 'info';

  if (
    value >= range[0] &&
    value <= range[1]
  )
    return 'ok';

  const margin =
    (range[1] - range[0] || 10) * 0.15;

  if (
    value >= range[0] - margin &&
    value <= range[1] + margin
  )
    return 'warn';

  return 'bad';
}


function badge(status) {

  if (status === 'ok')
    return '<span class="status ok">در محدوده</span>';

  if (status === 'warn')
    return '<span class="status warn">نزدیک محدوده</span>';

  if (status === 'bad')
    return '<span class="status bad">نیازمند بررسی</span>';

  return '<span class="status info">بدون مرجع</span>';
}


/* =========================================================
   HELPERS
========================================================= */

function farmName(id) {

  return db.farms.find(
    item => item.id === id
  )?.name || '—';

}

function houseName(id) {

  return db.houses.find(
    item => item.id === id
  )?.name || '—';

}

function flockName(id) {

  return db.flocks.find(
    item => item.id === id
  )?.name || '—';

}

function flockAge(flock, date = today()) {

  return flock?.placement
    ? daysBetween(flock.placement, date)
    : 0;

}


/* =========================================================
   TOAST
========================================================= */

function toast(message) {

  let element =
    document.querySelector('.toast');

  if (!element) {

    element =
      document.createElement('div');

    element.className = 'toast';

    document.body.appendChild(element);

  }

  element.textContent = message;

  element.classList.add('show');

  setTimeout(
    () =>
      element.classList.remove('show'),
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

  if (type === 'select') {

    return `
      <div class="field">

        <label>${esc(label)}</label>

        <select id="${name}">
          ${value}
        </select>

      </div>
    `;

  }

  return `
    <div class="field">

      <label>${esc(label)}</label>

      <input
        id="${name}"
        type="${type}"
        value="${esc(value)}"
        ${options}
      >

    </div>
  `;

}


/* =========================================================
   NAVIGATION
========================================================= */

let currentPage = 'dashboard';

function navigation() {

  const items = [

    ['dashboard', 'داشبورد'],

    ['farms', 'فارم‌ها'],

    ['houses', 'سالن‌ها'],

    ['flocks', 'گله‌ها'],

    ['weights', 'وزن و یکنواختی'],

    ['feed', 'دان'],

    ['water', 'آب'],

    ['eggs', 'تولید تخم'],

    ['health', 'سلامت'],

    ['labs', 'آزمایشگاه'],

    ['environment', 'محیط'],

    ['reports', 'گزارش']

  ];

  return `
    <nav class="nav">

      ${items.map(
        ([page, title]) => `

          <button
            class="${currentPage === page ? 'active' : ''}"
            data-page="${page}"
          >
            ${title}
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
                  ${esc(db.settings.clinic)}
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


          <div class="quick">

            <button
              class="btn small"
              data-page="flocks"
            >
              + گله
            </button>

            <button
              class="btn small"
              data-page="weights"
            >
              + وزن‌کشی
            </button>

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
    db.flocks.map(flock => {

      const records =
        db.weights
          .filter(
            record =>
              record.flock === flock.id
          )
          .sort(
            (a, b) =>
              b.date.localeCompare(a.date)
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
        latest && reference
          ? performanceStatus(
              latest.stats.mean,
              reference.range
            )
          : 'info';

      if (status === 'bad')
        warnings++;

      return `

        <div class="card">

          <div class="sectionTitle">

            <h2>
              ${esc(flock.name)}
            </h2>

            ${badge(status)}

          </div>


          <p class="muted">

            ${esc(farmName(flock.farm))}
            ·
            ${esc(houseName(flock.house))}
            ·
            سن ${fmt(
              latest?.ageDays ||
              flockAge(flock),
              0
            )} روز

            ·

            ${esc(
              flock.standard ||
              'بدون استاندارد'
            )}

          </p>


          <div class="kpis">

            <div class="kpi">
              <small>وزن</small>
              <strong>
                ${
                  latest
                    ? fmt(
                        latest.stats.mean,
                        0
                      ) + ' g'
                    : '—'
                }
              </strong>
            </div>


            <div class="kpi">
              <small>CV</small>
              <strong>
                ${
                  latest
                    ? fmt(
                        latest.stats.cv,
                        1
                      ) + '٪'
                    : '—'
                }
              </strong>
            </div>


            <div class="kpi">
              <small>Uniformity ±10%</small>
              <strong>
                ${
                  latest
                    ? fmt(
                        latest.stats.u10,
                        1
                      ) + '٪'
                    : '—'
                }
              </strong>
            </div>


            <div class="kpi">
              <small>مرجع وزن</small>
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

    }).join('');


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
              <strong>${db.farms.length}</strong>
            </div>

            <div class="kpi">
              <small>سالن</small>
              <strong>${db.houses.length}</strong>
            </div>

            <div class="kpi">
              <small>گله</small>
              <strong>${db.flocks.length}</strong>
            </div>

            <div class="kpi">
              <small>هشدار</small>
              <strong>${warnings}</strong>
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
            >
              ثبت وزن
            </button>

            <button
              class="btn secondary"
              data-page="feed"
            >
              ثبت دان
            </button>

            <button
              class="btn secondary"
              data-page="water"
            >
              ثبت آب
            </button>

            <button
              class="btn secondary"
              data-page="health"
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
   FARM
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
            ['name', 'نام'],
            ['code', 'کد']
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
          farm =>
            `<option value="${farm.id}">
              ${esc(farm.name)}
            </option>`
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
            ['name', 'سالن'],
            ['farm', 'فارم'],
            ['capacity', 'ظرفیت']
          ],
          item => ({
            name: item.name,
            farm: farmName(item.farm),
            capacity: item.capacity
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
          farm =>
            `<option value="${farm.id}">
              ${esc(farm.name)}
            </option>`
        ).join('')
      : `
          <option value="">
            ابتدا فارم ثبت کنید
          </option>
        `;


  const houseOptions =
    db.houses.length
      ? db.houses.map(
          house =>
            `<option
              value="${house.id}"
            >
              ${esc(house.name)}
              —
              ${esc(
                farmName(house.farm)
              )}
            </option>`
        ).join('')
      : `
          <option value="">
            ابتدا سالن ثبت کنید
          </option>
        `;


  const standardOptions =

    `<option value="">
      بدون استاندارد
    </option>` +

    Object.keys(standards)
      .filter(
        name => name !== 'Custom'
      )
      .map(
        name =>
          `<option value="${esc(name)}">
            ${esc(name)}
          </option>`
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
              <option>گوشتی</option>
              <option>تخمگذار</option>
              <option>پولت</option>
              <option>مادر</option>
            `
          )}

          ${field(
            'flockPlacement',
            'تاریخ جوجه‌ریزی',
            'date',
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
            ['name', 'گله'],
            ['farm', 'فارم'],
            ['house', 'سالن'],
            ['type', 'نوع'],
            ['placement', 'جوجه‌ریزی'],
            ['age', 'سن'],
            ['standard', 'استاندارد']
          ],

          item => ({

            name: item.name,

            farm:
              farmName(item.farm),

            house:
              houseName(item.house),

            type: item.type,

            placement:
              item.placement,

            age:
              fmt(
                flockAge(item),
                0
              ) + ' روز',

            standard:
              item.standard || '—'

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
          flock =>
            `<option value="${flock.id}">
              ${esc(flock.name)}
            </option>`
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

          ${field(
            'weightDate',
            'تاریخ',
            'date',
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
            ['date', 'تاریخ'],
            ['flock', 'گله'],
            ['n', 'نمونه'],
            ['mean', 'میانگین'],
            ['cv', 'CV'],
            ['u10', '±10%']
          ],

          item => ({

            date: item.date,

            flock:
              flockName(item.flock),

            n:
              item.stats.n,

            mean:
              fmt(
                item.stats.mean,
                1
              ) + ' g',

            cv:
              fmt(
                item.stats.cv,
                2
              ) + '٪',

            u10:
              fmt(
                item.stats.u10,
                1
              ) + '٪'

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
          flock =>
            `<option value="${flock.id}">
              ${esc(flock.name)}
            </option>`
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
    db[dataKey] || [];


  const columns =
    records.length
      ? Object.keys(records[0])
          .filter(
            key => key !== 'id'
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

          ${field(
            `${type}Date`,
            'تاریخ',
            'date',
            today()
          )}

          ${extraFields}

        </div>


        <div class="actions">

          <button
            class="btn"
            data-save="${type}"
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
    array.map(
      item =>
        mapper
          ? mapper(item)
          : item
    );


  return `

    <div class="tablewrap">

      <table>

        <thead>

          <tr>

            ${columns.map(
              column => `

                <th>
                  ${esc(
                    Array.isArray(column)
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
                        column => {

                          const key =
                            Array.isArray(
                              column
                            )
                              ? column[0]
                              : column;

                          return `
                            <td>
                              ${esc(
                                row[key]
                              )}
                            </td>
                          `;

                        }
                      ).join('')}

                    </tr>

                  `
                ).join('')

              : `

                  <tr>

                    <td
                      colspan="${columns.length || 1}"
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
      flock =>
        `<option value="${flock.id}">
          ${esc(flock.name)}
        </option>`
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
          >
            ساخت گزارش
          </button>

          <button
            class="btn secondary"
            onclick="window.print()"
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

  switch (currentPage) {

    case 'farms':
      html = farmsPage();
      break;

    case 'houses':
      html = housesPage();
      break;

    case 'flocks':
      html = flocksPage();
      break;

    case 'weights':
      html = weightsPage();
      break;

    case 'feed':

      html = simplePage(
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

      html = simplePage(
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

      html = simplePage(
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

      html = simplePage(
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

      html = simplePage(
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

      html = simplePage(
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
      html = reportsPage();
      break;

    default:
      html = dashboard();

  }


  document.getElementById(
    'app'
  ).innerHTML = html;


  bindEvents();

}


/* =========================================================
   SAVE FORMS
========================================================= */

function saveForm(type) {

  const id = uid();


  if (type === 'farm') {

    const name =
      document
        .getElementById('farmName')
        .value
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
          .getElementById('farmCode')
          .value
          .trim()

    });

  }


  else if (type === 'house') {

    const name =
      document
        .getElementById('houseName')
        .value
        .trim();

    const farm =
      document
        .getElementById('houseFarm')
        .value;

    const capacity =
      num(
        document
          .getElementById(
            'houseCapacity'
          )
          .value
      ) || 0;


    if (!name || !farm) {

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


  else if (type === 'flock') {

    const name =
      document
        .getElementById('flockName')
        .value
        .trim();

    const farm =
      document
        .getElementById('flockFarm')
        .value;

    const house =
      document
        .getElementById('flockHouse')
        .value;

    const placement =
      document
        .getElementById(
          'flockPlacement'
        )
        .value;

    const initial =
      num(
        document
          .getElementById(
            'flockInitial'
          )
          .value
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
          item.id === house
      );


    if (
      !selectedHouse ||
      selectedHouse.farm !== farm
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
          .value,

      placement,

      initial,

      strain:
        document
          .getElementById(
            'flockStrain'
          )
          .value
          .trim(),

      standard:
        document
          .getElementById(
            'flockStandard'
          )
          .value

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


    if (type === 'feed') {

      record.kg =
        num(
          document
            .getElementById(
              'feedKg'
            )
            .value
        );

    }


    if (type === 'water') {

      record.l =
        num(
          document
            .getElementById(
              'waterL'
            )
            .value
        );

    }


    if (type === 'eggs') {

      record.count =
        num(
          document
            .getElementById(
              'eggCount'
            )
            .value
        );

      record.birds =
        num(
          document
            .getElementById(
              'eggBirds'
            )
            .value
        );

      record.weight =
        num(
          document
            .getElementById(
              'eggWeight'
            )
            .value
        );


      if (
        record.birds &&
        record.birds > 0
      ) {

        record.hd =
          record.count /
          record.birds *
          100;

      }

    }


    if (type === 'health') {

      record.mortality =
        num(
          document
            .getElementById(
              'healthMortality'
            )
            .value
        ) || 0;

      record.cull =
        num(
          document
            .getElementById(
              'healthCull'
            )
            .value
        ) || 0;

      record.note =
        document
          .getElementById(
            'healthNote'
          )
          .value;

    }


    if (type === 'labs') {

      record.test =
        document
          .getElementById(
            'labTest'
          )
          .value;

      record.ct =
        num(
          document
            .getElementById(
              'labCt'
            )
            .value
        );

      record.gmt =
        num(
          document
            .getElementById(
              'labGmt'
            )
            .value
        );

      record.cv =
        num(
          document
            .getElementById(
              'labCv'
            )
            .value
        );

    }


    if (type === 'environment') {

      record.temp =
        num(
          document
            .getElementById(
              'environmentTemp'
            )
            .value
        );

      record.rh =
        num(
          document
            .getElementById(
              'environmentRh'
            )
            .value
        );

      record.nh3 =
        num(
          document
            .getElementById(
              'environmentNh3'
            )
            .value
        );

      record.co2 =
        num(
          document
            .getElementById(
              'environmentCo2'
            )
            .value
        );

    }


    const key =
      type === 'environment'
        ? 'environment'
        : type;


    db[key].push(record);

  }


  saveDB();

  toast(
    'اطلاعات با موفقیت ثبت شد'
  );

  render();

}


/* =========================================================
   ACTIONS
========================================================= */

function actions(action) {


  if (action === 'calculateWeight') {

    calculateWeight();

    return;

  }


  if (action === 'backup') {

    backupDatabase();

    return;

  }


  if (action === 'report') {

    buildReport();

    return;

  }

}


/* =========================================================
   WEIGHT CALCULATION
========================================================= */

function calculateWeight() {

  const flockId =
    document
      .getElementById(
        'weightFlock'
      )
      .value;

  const date =
    document
      .getElementById(
        'weightDate'
      )
      .value ||
    today();


  const raw =
    document
      .getElementById(
        'weightsInput'
      )
      .value
      .trim();


  const values =
    raw
      .split(
        /[\s,،;]+/
      )
      .map(Number)
      .filter(
        Number.isFinite
      );


  /*
    حداقل نمونه عملیاتی این نسخه:
    30 پرنده.
  */

  if (values.length < 30) {

    toast(
      'برای تحلیل این بخش حداقل ۳۰ وزن وارد کنید'
    );

    return;

  }


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


  const flock =
    db.flocks.find(
      item =>
        item.id === flockId
    );


  if (!flock) {

    toast(
      'گله انتخاب نشده است'
    );

    return;

  }


  const ageDays =
    flockAge(
      flock,
      date
    );


  const record = {

    id: uid(),

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

  saveDB();


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


  result.innerHTML = `

    <section class="card">

      <div class="sectionTitle">

        <h2>
          نتیجه محاسبه
        </h2>

        ${badge(status)}

      </div>


      <div class="kpis">

        <div class="kpi">
          <small>تعداد نمونه</small>
          <strong>
            ${fmt(stats.n, 0)}
          </strong>
        </div>


        <div class="kpi">
          <small>میانگین</small>
          <strong>
            ${fmt(stats.mean, 1)} g
          </strong>
        </div>


        <div class="kpi">
          <small>SD</small>
          <strong>
            ${fmt(stats.sd, 1)}
          </strong>
        </div>


        <div class="kpi">
          <small>CV</small>
          <strong>
            ${fmt(stats.cv, 2)}٪
          </strong>
        </div>


        <div class="kpi">
          <small>Uniformity ±10%</small>
          <strong>
            ${fmt(stats.u10, 1)}٪
          </strong>
        </div>


        <div class="kpi">
          <small>Uniformity ±15%</small>
          <strong>
            ${fmt(stats.u15, 1)}٪
          </strong>
        </div>


        <div class="kpi">
          <small>حداقل</small>
          <strong>
            ${fmt(stats.min, 0)} g
          </strong>
        </div>


        <div class="kpi">
          <small>حداکثر</small>
          <strong>
            ${fmt(stats.max, 0)} g
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

              استاندارد:
              <strong>
                ${esc(
                  flock.standard
                )}
              </strong>

              <br>

              سن مرجع:
              ${fmt(
                reference.week,
                0
              )}
              هفته

              <br>

              محدوده وزن:
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

              هدف Uniformity:
              ≥
              ${fmt(
                reference.targetUniformity,
                0
              )}٪

              ${
  reference.approximate
    ? `
                    <br>
                    نزدیک‌ترین سن موجود در جدول
                    برای مقایسه استفاده شده است.
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

  link.href = url;

  link.download =
    'adineh-poultry-backup.json';

  link.click();


  URL.revokeObjectURL(
    url
  );


  toast(
    'پشتیبان ساخته شد'
  );

}


/* =========================================================
   REPORT
========================================================= */

function buildReport() {

  const flockId =
    document
      .getElementById(
        'reportFlock'
      )
      .value;


  const flock =
    db.flocks.find(
      item =>
        item.id === flockId
    );


  if (!flock)
    return;


  const records =
    db.weights
      .filter(
        item =>
          item.flock === flock.id
      )
      .sort(
        (a, b) =>
          b.date.localeCompare(
            a.date
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


  document.getElementById(
    'reportResult'
  ).innerHTML = `

    <div class="card">

      <h2>
        گزارش گله
        ${esc(flock.name)}
      </h2>


      <p>
        فارم:
        ${esc(
          farmName(flock.farm)
        )}

        ·

        سالن:
        ${esc(
          houseName(flock.house)
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

            <div class="kpis">

              <div class="kpi">
                <small>میانگین وزن</small>
                <strong>
                  ${fmt(
                    latest.stats.mean,
                    1
                  )} g
                </strong>
              </div>


              <div class="kpi">
                <small>CV</small>
                <strong>
                  ${fmt(
                    latest.stats.cv,
                    2
                  )}٪
                </strong>
              </div>


              <div class="kpi">
                <small>Uniformity ±10%</small>
                <strong>
                  ${fmt(
                    latest.stats.u10,
                    1
                  )}٪
                </strong>
              </div>


              <div class="kpi">
                <small>استاندارد</small>
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

  document
    .querySelectorAll(
      '[data-page]'
    )
    .forEach(
      button => {

        button.onclick = () => {

          currentPage =
            button.dataset.page;

          render();

        };

      }
    );


  document
    .querySelectorAll(
      '[data-save]'
    )
    .forEach(
      button => {

        button.onclick = () => {

          saveForm(
            button.dataset.save
          );

        };

      }
    );


  document
    .querySelectorAll(
      '[data-action]'
    )
    .forEach(
      button => {

        button.onclick = () => {

          actions(
            button.dataset.action
          );

        };

      }
    );

}


/* =========================================================
   ERROR PROTECTION
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
