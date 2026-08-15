let weightChart = null;
let cvChart = null;
let uniformityChart = null;
let fcrChart = null;

let currentUser =
  localStorage.getItem("activeUser") || "guest";


/* ===============================
   Ross 308 - As Hatched
   7 تا 56 روز
================================ */

const ROSS_DAYS = [
  7, 14, 21, 28,
  35, 42, 49, 56
];


const ROSS_WEIGHT = [
  213,
  533,
  1012,
  1616,
  2296,
  2998,
  3681,
  4318
];


const ROSS_FCR = [
  0.780,
  1.005,
  1.142,
  1.269,
  1.399,
  1.531,
  1.663,
  1.793
];


/* حدود مدیریتی */

const MANAGEMENT_CV_LIMIT = 10;

const MANAGEMENT_UNIFORMITY_LIMIT = 68;


/* تاریخچه واقعی فارم */

let performanceHistory = {

  weight:
    Array(ROSS_DAYS.length).fill(null),

  cv:
    Array(ROSS_DAYS.length).fill(null),

  uniformity:
    Array(ROSS_DAYS.length).fill(null),

  fcr:
    Array(ROSS_DAYS.length).fill(null)

};


/* ===============================
   ابزارها
================================ */

function qs(id) {

  return document.getElementById(id);

}


/* ===============================
   کاربر
================================ */

function showUser() {

  const box = qs("userBox");

  if (!box) return;

  box.textContent =
    "👤 کاربر فعال: " + currentUser;

}


/* ===============================
   خروج
================================ */

function logout() {

  localStorage.removeItem("activeUser");

  window.location.href =
    "login.html";

}


/* ===============================
   اعداد فارسی
================================ */

function persianNumber(value) {

  return String(value ?? "")
    .replace(/[۰-۹]/g, function(ch) {

      return "۰۱۲۳۴۵۶۷۸۹".indexOf(ch);

    });

}


/* ===============================
   خواندن وزن‌ها
================================ */

function parseWeights(text) {

  const normalized =
    persianNumber(text)
      .replace(/[،؛]/g, ",")
      .replace(/[\n\r\t]+/g, " ");

  return normalized
    .split(/[\s,]+/)
    .map(Number)
    .filter(function(v) {

      return Number.isFinite(v) && v > 0;

    });

}


/* ===============================
   میانگین
================================ */

function average(arr) {

  return arr.reduce(
    function(sum, value) {

      return sum + value;

    },
    0
  ) / arr.length;

}


/* ===============================
   SD
================================ */

function standardDeviation(arr, mean) {

  if (arr.length < 2) {

    return 0;

  }

  const sum =
    arr.reduce(
      function(total, value) {

        return total +
          Math.pow(value - mean, 2);

      },
      0
    );

  return Math.sqrt(
    sum / (arr.length - 1)
  );

}


/* ===============================
   Uniformity
================================ */

function uniformity(arr, mean, percent) {

  const low =
    mean * (1 - percent);

  const high =
    mean * (1 + percent);

  return (
    arr.filter(function(value) {

      return value >= low &&
             value <= high;

    }).length
    /
    arr.length
  ) * 100;

}


/* ===============================
   پیدا کردن سن
================================ */

function getDayIndex(age) {

  return ROSS_DAYS.indexOf(
    Number(age)
  );

}


/* ===============================
   پیام
================================ */

function setMessage(text, type = "") {

  const el =
    qs("calculationMessage");

  if (!el) return;

  el.textContent = text;

  el.className =
    "calculation-message " + type;

}


/* ===============================
   FCR واقعی
================================ */

function calculateFCR(
  meanWeightGrams,
  cumulativeFeedKg,
  startingBirds
) {

  const feed =
    Number(cumulativeFeedKg);

  const birds =
    Number(startingBirds);


  if (
    !Number.isFinite(feed) ||
    feed <= 0 ||
    !Number.isFinite(birds) ||
    birds <= 0
  ) {

    return null;

  }


  /*
    وزن اولیه جوجه:
    44 گرم

    FCR =
    دان مصرفی / افزایش وزن تجمعی
  */

  const initialWeightKg =
    birds * 0.044;


  const currentWeightKg =
    birds *
    (meanWeightGrams / 1000);


  const weightGainKg =
    currentWeightKg -
    initialWeightKg;


  if (weightGainKg <= 0) {

    return null;

  }


  return feed / weightGainKg;

}


/* ===============================
   FCR تعدیل‌شده با تلفات
================================ */

function calculateAdjustedFCR(
  meanWeightGrams,
  cumulativeFeedKg,
  startingBirds,
  mortality
) {

  const feed =
    Number(cumulativeFeedKg);

  const birds =
    Number(startingBirds);

  const dead =
    Math.max(
      0,
      Number(mortality) || 0
    );


  if (
    !Number.isFinite(feed) ||
    feed <= 0 ||
    !Number.isFinite(birds) ||
    birds <= 0
  ) {

    return null;

  }


  const liveBirds =
    birds - dead;


  if (liveBirds <= 0) {

    return null;

  }


  const initialLiveWeightKg =
    liveBirds * 0.044;


  const currentLiveWeightKg =
    liveBirds *
    (meanWeightGrams / 1000);


  const liveWeightGainKg =
    currentLiveWeightKg -
    initialLiveWeightKg;


  if (liveWeightGainKg <= 0) {

    return null;

  }


  return feed / liveWeightGainKg;

}


/* ===============================
   محاسبه اصلی
================================ */

function calculate() {

  const weights =
    parseWeights(
      qs("weightsInput").value
    );


  const age =
    Number(
      qs("age").value
    );


  if (weights.length < 2) {

    alert(
      "حداقل دو وزن معتبر وارد کنید."
    );

    return;

  }


  if (
    !Number.isFinite(age) ||
    age <= 0
  ) {

    alert(
      "سن گله را وارد کنید."
    );

    return;

  }


  const index =
    getDayIndex(age);


  if (index === -1) {

    alert(
      "برای نمودار استاندارد، سن باید یکی از این موارد باشد:\n۷، ۱۴، ۲۱، ۲۸، ۳۵، ۴۲، ۴۹ یا ۵۶ روز."
    );

    return;

  }


  const mean =
    average(weights);


  const sd =
    standardDeviation(
      weights,
      mean
    );


  const cv =
    (sd / mean) * 100;


  const u10 =
    uniformity(
      weights,
      mean,
      0.10
    );


  const u15 =
    uniformity(
      weights,
      mean,
      0.15
    );


  const fcr =
    calculateFCR(
      mean,
      qs("feedCumulative").value,
      qs("countBird").value
    );


  const adjustedFCR =
    calculateAdjustedFCR(
      mean,
      qs("feedCumulative").value,
      qs("countBird").value,
      qs("mortalityCumulative").value
    );


  /* نمایش نتایج */

  qs("sample").textContent =
    weights.length;


  qs("mean").textContent =
    mean.toFixed(1) + " g";


  qs("min").textContent =
    Math.min(...weights)
      .toFixed(1) + " g";


  qs("max").textContent =
    Math.max(...weights)
      .toFixed(1) + " g";


  qs("sd").textContent =
    sd.toFixed(1) + " g";


  qs("cv").textContent =
    cv.toFixed(2) + "%";


  qs("u10").textContent =
    u10.toFixed(1) + "%";


  qs("u15").textContent =
    u15.toFixed(1) + "%";


  qs("fcrActual").textContent =
    fcr === null
      ? "—"
      : fcr.toFixed(3);


  qs("fcrAdjusted").textContent =
    adjustedFCR === null
      ? "—"
      : adjustedFCR.toFixed(3);


  /* ذخیره نقطه واقعی */

  performanceHistory.weight[index] =
    Number(mean.toFixed(1));


  performanceHistory.cv[index] =
    Number(cv.toFixed(2));


  performanceHistory.uniformity[index] =
    Number(u10.toFixed(1));


  performanceHistory.fcr[index] =
    fcr === null
      ? null
      : Number(fcr.toFixed(3));


  /* وضعیت عملکرد */

  const weightDiff =
    (
      (mean - ROSS_WEIGHT[index])
      /
      ROSS_WEIGHT[index]
    ) * 100;


  let status =
    weightDiff >= 0
      ? "وزن +" +
        weightDiff.toFixed(1) +
        "%"
      : "وزن " +
        weightDiff.toFixed(1) +
        "%";


  if (
    cv >
    MANAGEMENT_CV_LIMIT
  ) {

    status +=
      " | CV بالاتر از حد";

  }


  if (
    u10 <
    MANAGEMENT_UNIFORMITY_LIMIT
  ) {

    status +=
      " | یکنواختی پایین";

  }


  if (fcr !== null) {

    const fcrDiff =
      fcr -
      ROSS_FCR[index];


    status +=
      " | FCR " +
      (
        fcrDiff <= 0
          ? "بهتر"
          : "بالاتر"
      ) +
      " از Ross";

  }


  qs("performanceStatus")
    .textContent = status;


  saveData();


  drawAllCharts(weights);


  setMessage(
    "داده روز " +
    age +
    " ثبت شد و نقطه واقعی روی نمودارها قرار گرفت.",
    "success"
  );

}


/* ===============================
   برچسب نمودار
================================ */

function chartLabels() {

  return ROSS_DAYS.map(
    function(day) {

      return "روز " + day;

    }
  );

}


/* ===============================
   تنظیمات عمومی Chart
================================ */

function commonChartOptions(
  yTitle
) {

  return {

    responsive: true,

    maintainAspectRatio: false,

    interaction: {

      mode: "index",

      intersect: false

    },

    plugins: {

      legend: {

        position: "top",

        labels: {

          usePointStyle: true,

          font: {

            family:
              "Tahoma, Arial",

            size: 12

          }

        }

      },

      tooltip: {

        rtl: true,

        titleAlign: "right",

        bodyAlign: "right"

      }

    },

    scales: {

      x: {

        title: {

          display: true,

          text: "سن گله"

        }

      },

      y: {

        title: {

          display: true,

          text: yTitle

        },

        beginAtZero: false

      }

    }

  };

}


/* ===============================
   Dataset
================================ */

function makeDataset(
  label,
  data,
  type = "actual"
) {

  const actual =
    type === "actual";


  return {

    label: label,

    data: data,

    borderWidth:
      actual ? 3 : 2,

    pointRadius:
      actual ? 5 : 4,

    pointHoverRadius: 7,

    tension: 0.25,

    fill: false,

    spanGaps: false,

    borderDash:
      actual
        ? []
        : [8, 6]

  };

}


/* ===============================
   نمودار وزن
================================ */

function drawWeightTrend() {

  if (weightTrendChart) {

    weightTrendChart.destroy();

  }


  weightTrendChart =
    new Chart(
      qs("weightTrendChart"),
      {

        type: "line",

        data: {

          labels:
            chartLabels(),

          datasets: [

            makeDataset(
              "وزن واقعی گله (g)",
              performanceHistory.weight,
              "actual"
            ),

            makeDataset(
              "Ross 308 استاندارد (g)",
              ROSS_WEIGHT,
              "reference"
            )

          ]

        },

        options:
          commonChartOptions(
            "وزن (گرم)"
          )

      }
    );

}


/* ===============================
   نمودار CV
================================ */

function drawCV() {

  if (cvChart) {

    cvChart.destroy();

  }


  cvChart =
    new Chart(
      qs("cvChart"),
      {

        type: "line",

        data: {

          labels:
            chartLabels(),

          datasets: [

            makeDataset(
              "CV واقعی گله (%)",
              performanceHistory.cv,
              "actual"
            ),

            makeDataset(
              "حد مدیریتی CV = 10%",
              Array(
                ROSS_DAYS.length
              ).fill(
                MANAGEMENT_CV_LIMIT
              ),
              "reference"
            )

          ]

        },

        options: {

          ...commonChartOptions(
            "CV (%)"
          ),

          scales: {

            ...commonChartOptions(
              "CV (%)"
            ).scales,

            y: {

              min: 0,

              title: {

                display: true,

                text: "CV (%)"

              }

            }

          }

        }

      }
    );

}


/* ===============================
   نمودار یکنواختی
================================ */

function drawUniformity() {

  if (uniformityChart) {

    uniformityChart.destroy();

  }


  uniformityChart =
    new Chart(
      qs("uniformityChart"),
      {

        type: "line",

        data: {

          labels:
            chartLabels(),

          datasets: [

            makeDataset(
              "یکنواختی واقعی ±10% (%)",
              performanceHistory.uniformity,
              "actual"
            ),

            makeDataset(
              "حد مدیریتی ≥ 68%",
              Array(
                ROSS_DAYS.length
              ).fill(
                MANAGEMENT_UNIFORMITY_LIMIT
              ),
              "reference"
            )

          ]

        },

        options: {

          ...commonChartOptions(
            "یکنواختی (%)"
          ),

          scales: {

            ...commonChartOptions(
              "یکنواختی (%)"
            ).scales,

            y: {

              min: 0,

              max: 100,

              title: {

                display: true,

                text: "یکنواختی (%)"

              }

            }

          }

        }

      }
    );

}


/* ===============================
   نمودار FCR
================================ */

function drawFCR() {

  if (fcrChart) {

    fcrChart.destroy();

  }


  fcrChart =
    new Chart(
      qs("fcrChart"),
      {

        type: "line",

        data: {

          labels:
            chartLabels(),

          datasets: [

            makeDataset(
              "FCR واقعی فارم",
              performanceHistory.fcr,
              "actual"
            ),

            makeDataset(
              "Ross 308 استاندارد",
              ROSS_FCR,
              "reference"
            )

          ]

        },

        options:
          commonChartOptions(
            "FCR"
          )

      }
    );

}


/* ===============================
   نمودار توزیع وزن
================================ */

function drawWeight(data) {

  if (weightChart) {

    weightChart.destroy();

  }


  weightChart =
    new Chart(
      qs("weightChart"),
      {

        type: "bar",

        data: {

          labels:
            data.map(
              function(_, i) {

                return "نمونه " +
                  (i + 1);

              }
            ),

          datasets: [

            {

              label:
                "وزن نمونه (g)",

              data: data,

              borderWidth: 1

            }

          ]

        },

        options: {

          responsive: true,

          maintainAspectRatio: false,

          plugins: {

            legend: {

              position: "top"

            }

          },

          scales: {

            y: {

              beginAtZero: true,

              title: {

                display: true,

                text: "وزن (گرم)"

              }

            }

          }

        }

      }
    );

}


/* ===============================
   رسم تمام نمودارها
================================ */

function drawAllCharts(
  weights = null
) {

  drawWeightTrend();

  drawCV();

  drawUniformity();

  drawFCR();


  if (
    weights &&
    weights.length
  ) {

    drawWeight(weights);

  }

}


/* ===============================
   جدول Ross
================================ */

function renderRossTable() {

  const body =
    qs("rossReferenceBody");


  if (!body) return;


  body.innerHTML =
    ROSS_DAYS.map(
      function(day, i) {

        return `

          <tr>

            <td>${day}</td>

            <td>${ROSS_WEIGHT[i]}</td>

            <td>
              ${ROSS_FCR[i].toFixed(3)}
            </td>

            <td>
              ≤ ${MANAGEMENT_CV_LIMIT}%
            </td>

            <td>
              ≥ ${MANAGEMENT_UNIFORMITY_LIMIT}%
            </td>

          </tr>

        `;

      }
    ).join("");

}


/* ===============================
   ذخیره اطلاعات
================================ */

function saveData() {

  if (
    currentUser === "guest"
  ) {

    return;

  }


  const data = {

    farm:
      qs("farm").value,

    hall:
      qs("hall").value,

    type:
      qs("type").value,

    age:
      qs("age").value,

    countBird:
      qs("countBird").value,

    date:
      qs("date").value,

    weights:
      qs("weightsInput").value,

    feedCumulative:
      qs("feedCumulative").value,

    mortalityCumulative:
      qs("mortalityCumulative").value,

    performanceHistory:
      performanceHistory

  };


  localStorage.setItem(

    "adineh_" +
    currentUser,

    JSON.stringify(data)

  );

}


/* ===============================
   بارگذاری اطلاعات
================================ */

function loadData() {

  if (
    currentUser === "guest"
  ) {

    return;

  }


  const raw =
    localStorage.getItem(
      "adineh_" +
      currentUser
    );


  if (!raw) {

    return;

  }


  try {

    const obj =
      JSON.parse(raw);


    qs("farm").value =
      obj.farm || "";


    qs("hall").value =
      obj.hall || "";


    qs("type").value =
      obj.type || "";


    qs("age").value =
      obj.age || "";


    qs("countBird").value =
      obj.countBird || "";


    qs("date").value =
      obj.date || "";


    qs("weightsInput").value =
      obj.weights || "";


    qs("feedCumulative").value =
      obj.feedCumulative || "";


    qs("mortalityCumulative").value =
      obj.mortalityCumulative || "";


    if (
      obj.performanceHistory
    ) {

      performanceHistory = {

        weight:
          Array.isArray(
            obj.performanceHistory.weight
          )
            ? obj.performanceHistory.weight
            : Array(
                ROSS_DAYS.length
              ).fill(null),

        cv:
          Array.isArray(
            obj.performanceHistory.cv
          )
            ? obj.performanceHistory.cv
            : Array(
                ROSS_DAYS.length
              ).fill(null),

        uniformity:
          Array.isArray(
            obj.performanceHistory.uniformity
          )
            ? obj.performanceHistory.uniformity
            : Array(
                ROSS_DAYS.length
              ).fill(null),

        fcr:
          Array.isArray(
            obj.performanceHistory.fcr
          )
            ? obj.performanceHistory.fcr
            : Array(
                ROSS_DAYS.length
              ).fill(null)

      };

    }

  }

  catch (error) {

    console.error(
      "خطا در بارگذاری داده:",
      error
    );

  }

}


/* ===============================
   حذف داده یک سن
================================ */

function clearCurrentDay() {

  const age =
    Number(
      qs("age").value
    );


  const index =
    getDayIndex(age);


  if (index === -1) {

    alert(
      "سن باید یکی از سنین استاندارد ۷ تا ۵۶ روز باشد."
    );

    return;

  }


  performanceHistory.weight[index] =
    null;

  performanceHistory.cv[index] =
    null;

  performanceHistory.uniformity[index] =
    null;

  performanceHistory.fcr[index] =
    null;


  saveData();

  drawAllCharts();


  setMessage(
    "داده روز " +
    age +
    " از تاریخچه نمودار حذف شد.",
    "success"
  );

}


/* ===============================
   پاک کردن تاریخچه
================================ */

function clearHistory() {

  if (
    !confirm(
      "تمام نقاط واقعی نمودارها حذف شوند؟"
    )
  ) {

    return;

  }


  performanceHistory = {

    weight:
      Array(
        ROSS_DAYS.length
      ).fill(null),

    cv:
      Array(
        ROSS_DAYS.length
      ).fill(null),

    uniformity:
      Array(
        ROSS_DAYS.length
      ).fill(null),

    fcr:
      Array(
        ROSS_DAYS.length
      ).fill(null)

  };


  saveData();

  drawAllCharts();


  setMessage(
    "تاریخچه نمودارها پاک شد.",
    "success"
  );

}


/* ===============================
   شروع برنامه
================================ */

document.addEventListener(
  "DOMContentLoaded",
  function() {

    showUser();

    loadData();

    renderRossTable();

    drawAllCharts();


    document
      .querySelectorAll(
        "input, select, textarea"
      )
      .forEach(
        function(el) {

          el.addEventListener(
            "input",
            saveData
          );

          el.addEventListener(
            "change",
            saveData
          );

        }
      );

  }
);
