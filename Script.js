"use strict";


/* =========================================================
   کاربر
========================================================= */

let currentUser =
    localStorage.getItem("activeUser") || "guest";


/* =========================================================
   نمودارها
========================================================= */

let weightChart = null;
let cvChart = null;
let uniformityChart = null;
let fcrChart = null;
let weightDistributionChart = null;


/* =========================================================
   اطلاعات تاریخی
========================================================= */

let flockHistory = [];


/* =========================================================
   مرجع Ross 308 As-Hatched
   هفته‌های 1 تا 8
========================================================= */

const rossAge = [
    7, 14, 21, 28,
    35, 42, 49, 56
];


const rossWeight = [
    213,
    533,
    1012,
    1616,
    2296,
    2998,
    3681,
    4318
];


const rossFCR = [
    0.780,
    1.005,
    1.142,
    1.269,
    1.399,
    1.531,
    1.663,
    1.793
];


/*
   CV و Uniformity مرجع مدیریتی
*/

const referenceCV = 10;
const referenceUniformity = 68;


/* =========================================================
   تبدیل اعداد فارسی
========================================================= */

function persianNumber(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/[۰-۹]/g, function (x) {
            return "۰۱۲۳۴۵۶۷۸۹".indexOf(x);
        })
        .replace(/[٠-٩]/g, function (x) {
            return "٠١٢٣٤٥٦٧٨٩".indexOf(x);
        });
}


/* =========================================================
   تبدیل وزن‌ها
========================================================= */

function parseWeights(text) {

    text = persianNumber(text);

    return text
        .replace(/،/g, ",")
        .replace(/;/g, ",")
        .split(/[\s,]+/)
        .map(Number)
        .filter(function (x) {
            return Number.isFinite(x) && x > 0;
        });
}


/* =========================================================
   میانگین
========================================================= */

function average(arr) {

    if (!arr.length) {
        return 0;
    }

    return arr.reduce(function (sum, value) {
        return sum + value;
    }, 0) / arr.length;
}


/* =========================================================
   SD
========================================================= */

function standardDeviation(arr, mean) {

    if (arr.length < 2) {
        return 0;
    }

    const variance =
        arr.reduce(function (sum, value) {

            return sum + Math.pow(value - mean, 2);

        }, 0) / (arr.length - 1);

    return Math.sqrt(variance);
}


/* =========================================================
   CV
========================================================= */

function calculateCV(sd, mean) {

    if (!mean) {
        return 0;
    }

    return (sd / mean) * 100;
}


/* =========================================================
   Uniformity
========================================================= */

function calculateUniformity(arr, mean, percentage) {

    if (!arr.length || !mean) {
        return 0;
    }

    const low = mean * (1 - percentage);
    const high = mean * (1 + percentage);

    const count = arr.filter(function (weight) {

        return weight >= low && weight <= high;

    }).length;

    return (count / arr.length) * 100;
}


/* =========================================================
   FCR
   Ross:
   cumulative feed / live body weight
========================================================= */

function calculateFCR(feed, meanWeight) {

    if (!feed || !meanWeight) {
        return null;
    }

    return feed / meanWeight;
}


/* =========================================================
   ذخیره اطلاعات
========================================================= */

function saveData() {

    if (currentUser === "guest") {
        return;
    }

    const data = {

        farm:
            document.getElementById("farm")?.value || "",

        hall:
            document.getElementById("hall")?.value || "",

        type:
            document.getElementById("type")?.value || "",

        age:
            document.getElementById("age")?.value || "",

        countBird:
            document.getElementById("countBird")?.value || "",

        date:
            document.getElementById("date")?.value || "",

        weights:
            document.getElementById("weightsInput")?.value || "",

        feedAverage:
            document.getElementById("feedAverage")?.value || "",

        flockHistory:
            flockHistory

    };


    localStorage.setItem(
        "adineh_" + currentUser,
        JSON.stringify(data)
    );
}


/* =========================================================
   بارگذاری اطلاعات
========================================================= */

function loadData() {

    if (currentUser === "guest") {
        return;
    }


    const saved =
        localStorage.getItem(
            "adineh_" + currentUser
        );


    if (!saved) {
        return;
    }


    try {

        const data = JSON.parse(saved);


        setValue("farm", data.farm);
        setValue("hall", data.hall);
        setValue("type", data.type);
        setValue("age", data.age);
        setValue("countBird", data.countBird);
        setValue("date", data.date);
        setValue("weightsInput", data.weights);
        setValue("feedAverage", data.feedAverage);


        flockHistory =
            Array.isArray(data.flockHistory)
                ? data.flockHistory
                : [];


        redrawAllCharts();


    } catch (error) {

        console.error(
            "خطا در بارگذاری اطلاعات:",
            error
        );

    }
}


function setValue(id, value) {

    const element =
        document.getElementById(id);

    if (element && value !== undefined && value !== null) {
        element.value = value;
    }
}


/* =========================================================
   نمایش کاربر
========================================================= */

function showUser() {

    const box =
        document.getElementById("userBox");

    if (!box) {
        return;
    }

    box.innerHTML =
        "👤 کاربر فعال: " +
        escapeHTML(currentUser);
}


/* =========================================================
   جلوگیری از HTML Injection
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   خروج
========================================================= */

function logout() {

    localStorage.removeItem("activeUser");

    window.location.href = "login.html";
}


/* =========================================================
   محاسبه اصلی
========================================================= */

function calculate() {

    const weights =
        parseWeights(
            document.getElementById(
                "weightsInput"
            ).value
        );


    if (weights.length < 2) {

        alert(
            "حداقل دو وزن معتبر وارد کنید."
        );

        return;
    }


    const ageValue =
        Number(
            persianNumber(
                document.getElementById("age").value
            )
        );


    if (!ageValue || ageValue < 1 || ageValue > 56) {

        alert(
            "سن گله را بین 1 تا 56 روز وارد کنید."
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
        calculateCV(
            sd,
            mean
        );


    const uniformity10 =
        calculateUniformity(
            weights,
            mean,
            0.10
        );


    const uniformity15 =
        calculateUniformity(
            weights,
            mean,
            0.15
        );


    const feed =
        Number(
            persianNumber(
                document.getElementById(
                    "feedAverage"
                ).value
            )
        );


    let fcr = null;


    if (feed > 0) {

        fcr =
            calculateFCR(
                feed,
                mean
            );

    }


    /* نمایش نتایج */

    setText(
        "sample",
        weights.length
    );


    setText(
        "mean",
        mean.toFixed(1)
    );


    setText(
        "min",
        Math.min(...weights).toFixed(1)
    );


    setText(
        "max",
        Math.max(...weights).toFixed(1)
    );


    setText(
        "sd",
        sd.toFixed(1)
    );


    setText(
        "cv",
        cv.toFixed(2) + "%"
    );


    setText(
        "u10",
        uniformity10.toFixed(1) + "%"
    );


    setText(
        "u15",
        uniformity15.toFixed(1) + "%"
    );


    setText(
        "feedResult",
        feed > 0
            ? feed.toFixed(1)
            : "-"
    );


    setText(
        "fcr",
        fcr !== null
            ? fcr.toFixed(3)
            : "-"
    );


    /* =====================================================
       ذخیره نقطه سنی
    ===================================================== */

    const record = {

        age: ageValue,

        mean:
            Number(mean.toFixed(1)),

        cv:
            Number(cv.toFixed(2)),

        uniformity:
            Number(
                uniformity10.toFixed(1)
            ),

        uniformity15:
            Number(
                uniformity15.toFixed(1)
            ),

        feed:
            feed > 0
                ? Number(feed.toFixed(1))
                : null,

        fcr:
            fcr !== null
                ? Number(fcr.toFixed(3))
                : null,

        updatedAt:
            new Date().toISOString()

    };


    /*
       اگر همان سن قبلاً وجود داشت،
       همان نقطه را اصلاح کن.
    */

    const existingIndex =
        flockHistory.findIndex(
            function (item) {

                return Number(item.age) === ageValue;

            }
        );


    if (existingIndex >= 0) {

        flockHistory[existingIndex] =
            record;

    } else {

        flockHistory.push(record);

    }


    flockHistory.sort(
        function (a, b) {

            return Number(a.age) -
                   Number(b.age);

        }
    );


    saveData();


    drawAllCharts(weights);


    /*
       اسکرول نرم به نتایج
    */

    document
        .querySelector(".results-grid")
        ?.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
}


/* =========================================================
   قرار دادن متن
========================================================= */

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


/* =========================================================
   ساخت محور 1 تا 56 روز
========================================================= */

function dayLabels() {

    return Array.from(
        { length: 56 },
        function (_, index) {

            return index + 1;

        }
    );
}


/* =========================================================
   درون‌یابی استاندارد Ross
========================================================= */

function interpolateRossValue(
    age,
    ages,
    values
) {

    if (age <= ages[0]) {
        return values[0];
    }


    if (age >= ages[ages.length - 1]) {
        return values[values.length - 1];
    }


    for (
        let i = 0;
        i < ages.length - 1;
        i++
    ) {

        const x1 = ages[i];
        const x2 = ages[i + 1];

        const y1 = values[i];
        const y2 = values[i + 1];


        if (age >= x1 && age <= x2) {

            const ratio =
                (age - x1) /
                (x2 - x1);

            return (
                y1 +
                (y2 - y1) * ratio
            );
        }
    }

    return null;
}


/* =========================================================
   ساخت خط Ross وزن
========================================================= */

function buildRossWeightSeries() {

    return dayLabels().map(
        function (day) {

            return interpolateRossValue(
                day,
                rossAge,
                rossWeight
            );

        }
    );
}


/* =========================================================
   ساخت خط Ross FCR
========================================================= */

function buildRossFCRSeries() {

    return dayLabels().map(
        function (day) {

            return interpolateRossValue(
                day,
                rossAge,
                rossFCR
            );

        }
    );
}


/* =========================================================
   تنظیمات عمومی نمودار
========================================================= */

function chartOptions(yTitle) {

    return {

        responsive: true,

        maintainAspectRatio: false,

        interaction: {
            mode: "index",
            intersect: false
        },

        plugins: {

            legend: {
                display: true,
                position: "top",
                rtl: true,
                labels: {
                    usePointStyle: true,
                    padding: 16
                }
            },

            tooltip: {

                rtl: true,

                callbacks: {

                    title: function (items) {

                        if (!items.length) {
                            return "";
                        }

                        return (
                            "روز " +
                            items[0].label
                        );
                    }

                }

            }

        },

        scales: {

            x: {

                title: {
                    display: true,
                    text: "سن گله (روز)"
                },

                ticks: {
                    maxTicksLimit: 8
                }

            },

            y: {

                beginAtZero: true,

                title: {
                    display: true,
                    text: yTitle
                }

            }

        }

    };
}


/* =========================================================
   مقادیر واقعی روی محور 56 روز
========================================================= */

function historySeries(property) {

    const values =
        Array(56).fill(null);


    flockHistory.forEach(
        function (item) {

            const age =
                Number(item.age);


            if (
                age >= 1 &&
                age <= 56 &&
                item[property] !== null &&
                item[property] !== undefined
            ) {

                values[age - 1] =
                    Number(item[property]);

            }

        }
    );


    return values;
}


/* =========================================================
   مقایسه وزن
========================================================= */

function drawWeightChart() {

    const canvas =
        document.getElementById(
            "weightChart"
        );


    if (!canvas) {
        return;
    }


    if (weightChart) {
        weightChart.destroy();
    }


    weightChart =
        new Chart(
            canvas,
            {

                type: "line",

                data: {

                    labels: dayLabels(),

                    datasets: [

                        {

                            label:
                                "وزن واقعی گله",

                            data:
                                historySeries(
                                    "mean"
                                ),

                            borderWidth: 3,

                            pointRadius: 5,

                            pointHoverRadius: 7,

                            spanGaps: true,

                            tension: 0.25

                        },

                        {

                            label:
                                "Ross 308",

                            data:
                                buildRossWeightSeries(),

                            borderWidth: 2,

                            borderDash: [
                                7,
                                5
                            ],

                            pointRadius: 0,

                            tension: 0.25

                        }

                    ]

                },

                options:
                    chartOptions(
                        "وزن (گرم)"
                    )

            }
        );
}


/* =========================================================
   نمودار CV
========================================================= */

function drawCVChart() {

    const canvas =
        document.getElementById(
            "cvChart"
        );


    if (!canvas) {
        return;
    }


    if (cvChart) {
        cvChart.destroy();
    }


    cvChart =
        new Chart(
            canvas,
            {

                type: "line",

                data: {

                    labels: dayLabels(),

                    datasets: [

                        {

                            label:
                                "CV واقعی گله",

                            data:
                                historySeries(
                                    "cv"
                                ),

                            borderWidth: 3,

                            pointRadius: 5,

                            spanGaps: true,

                            tension: 0.25

                        },

                        {

                            label:
                                "مرجع مدیریتی 10%",

                            data:
                                Array(56)
                                    .fill(referenceCV),

                            borderWidth: 2,

                            borderDash: [
                                7,
                                5
                            ],

                            pointRadius: 0,

                            tension: 0

                        }

                    ]

                },

                options:
                    chartOptions(
                        "CV (%)"
                    )

            }
        );
}


/* =========================================================
   نمودار Uniformity
========================================================= */

function drawUniformityChart() {

    const canvas =
        document.getElementById(
            "uniformityChart"
        );


    if (!canvas) {
        return;
    }


    if (uniformityChart) {
        uniformityChart.destroy();
    }


    uniformityChart =
        new Chart(
            canvas,
            {

                type: "line",

                data: {

                    labels: dayLabels(),

                    datasets: [

                        {

                            label:
                                "یکنواختی واقعی ±10%",

                            data:
                                historySeries(
                                    "uniformity"
                                ),

                            borderWidth: 3,

                            pointRadius: 5,

                            spanGaps: true,

                            tension: 0.25

                        },

                        {

                            label:
                                "مرجع 68%",

                            data:
                                Array(56)
                                    .fill(
                                        referenceUniformity
                                    ),

                            borderWidth: 2,

                            borderDash: [
                                7,
                                5
                            ],

                            pointRadius: 0,

                            tension: 0

                        }

                    ]

                },

                options:
                    chartOptions(
                        "یکنواختی (%)"
                    )

            }
        );
}


/* =========================================================
   نمودار FCR
========================================================= */

function drawFCRChart() {

    const canvas =
        document.getElementById(
            "fcrChart"
        );


    if (!canvas) {
        return;
    }


    if (fcrChart) {
        fcrChart.destroy();
    }


    fcrChart =
        new Chart(
            canvas,
            {

                type: "line",

                data: {

                    labels: dayLabels(),

                    datasets: [

                        {

                            label:
                                "FCR واقعی گله",

                            data:
                                historySeries(
                                    "fcr"
                                ),

                            borderWidth: 3,

                            pointRadius: 5,

                            spanGaps: true,

                            tension: 0.25

                        },

                        {

                            label:
                                "Ross 308",

                            data:
                                buildRossFCRSeries(),

                            borderWidth: 2,

                            borderDash: [
                                7,
                                5
                            ],

                            pointRadius: 0,

                            tension: 0.25

                        }

                    ]

                },

                options:
                    chartOptions(
                        "FCR"
                    )

            }
        );
}


/* =========================================================
   نمودار توزیع وزن
========================================================= */

function drawWeightDistribution(
    weights
) {

    const canvas =
        document.getElementById(
            "weightDistributionChart"
        );


    if (!canvas) {
        return;
    }


    if (weightDistributionChart) {
        weightDistributionChart.destroy();
    }


    if (
        !weights ||
        !weights.length
    ) {
        return;
    }


    const sorted =
        [...weights].sort(
            function (a, b) {
                return a - b;
            }
        );


    const labels =
        sorted.map(
            function (_, index) {
                return "نمونه " + (index + 1);
            }
        );


    weightDistributionChart =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label:
                                "وزن نمونه (g)",

                            data: sorted,

                            borderWidth: 1

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            rtl: true
                        }

                    },

                    scales: {

                        x: {

                            ticks: {
                                maxTicksLimit: 12
                            }

                        },

                        y: {

                            beginAtZero: true,

                            title: {

                                display: true,

                                text:
                                    "وزن (گرم)"

                            }

                        }

                    }

                }

            }
        );
}


/* =========================================================
   رسم همه نمودارها
========================================================= */

function drawAllCharts(
    currentWeights
) {

    drawWeightChart();

    drawCVChart();

    drawUniformityChart();

    drawFCRChart();


    if (
        currentWeights &&
        currentWeights.length
    ) {

        drawWeightDistribution(
            currentWeights
        );

    }
}


/* =========================================================
   رسم مجدد از اطلاعات ذخیره‌شده
========================================================= */

function redrawAllCharts() {

    drawWeightChart();

    drawCVChart();

    drawUniformityChart();

    drawFCRChart();
}


/* =========================================================
   ذخیره خودکار فرم
========================================================= */

document.addEventListener(
    "input",
    function () {
        saveData();
    }
);


/* =========================================================
   شروع برنامه
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        showUser();

        loadData();

        /*
           اگر داده‌ای ذخیره شده باشد،
           نمودارها نمایش داده می‌شوند.
        */

        setTimeout(
            function () {
                redrawAllCharts();
            },
            100
        );

    }
);
