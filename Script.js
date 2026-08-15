let weightChart = null;
let cvChart = null;
let uniformityChart = null;
let fcrChart = null;


/* =========================
   USER
========================= */

let currentUser =
    localStorage.getItem("activeUser") || "guest";


/* =========================
   ROSS 308
========================= */

const ROSS_DAYS = [
    7, 14, 21, 28,
    35, 42, 49, 56
];


/*
   Ross 308 As-Hatched
*/

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

const CV_REFERENCE = 10;

const UNIFORMITY_REFERENCE = 68;


/* =========================
   HISTORY
========================= */

let performanceHistory = {

    weight:
        Array(8).fill(null),

    cv:
        Array(8).fill(null),

    uniformity:
        Array(8).fill(null),

    fcr:
        Array(8).fill(null)

};


/* =========================
   SHORTCUT
========================= */

function qs(id) {

    return document.getElementById(id);

}


/* =========================
   USER
========================= */

function showUser() {

    const box = qs("userBox");

    if (!box) return;

    box.textContent =
        "👤 کاربر فعال: " +
        currentUser;

}


/* =========================
   LOGOUT
========================= */

function logout() {

    localStorage.removeItem("activeUser");

    window.location.href =
        "login.html";

}


/* =========================
   PERSIAN NUMBERS
========================= */

function persianNumber(value) {

    return String(value || "")
        .replace(
            /[۰-۹]/g,
            function(x) {

                return "۰۱۲۳۴۵۶۷۸۹"
                    .indexOf(x);

            }
        );

}


/* =========================
   PARSE WEIGHTS
========================= */

function parseWeights(text) {

    text =
        persianNumber(text)
        .replace(/،/g, ",")
        .replace(/؛/g, ",")
        .replace(/\n/g, " ");

    return text
        .split(/[\s,]+/)
        .map(Number)
        .filter(
            x =>
                Number.isFinite(x) &&
                x > 0
        );

}


/* =========================
   AVERAGE
========================= */

function average(arr) {

    return arr.reduce(
        (a,b) => a + b,
        0
    ) / arr.length;

}


/* =========================
   SD
========================= */

function standardDeviation(
    arr,
    mean
) {

    if (arr.length < 2) {

        return 0;

    }

    let sum = 0;

    for (const value of arr) {

        sum +=
            Math.pow(
                value - mean,
                2
            );

    }

    return Math.sqrt(
        sum /
        (arr.length - 1)
    );

}


/* =========================
   UNIFORMITY
========================= */

function uniformity(
    arr,
    mean,
    percent
) {

    const low =
        mean *
        (1 - percent);

    const high =
        mean *
        (1 + percent);

    const count =
        arr.filter(
            x =>
                x >= low &&
                x <= high
        ).length;

    return (
        count /
        arr.length
    ) * 100;

}


/* =========================
   DAY INDEX
========================= */

function getDayIndex(age) {

    return ROSS_DAYS.indexOf(
        Number(age)
    );

}


/* =========================
   FCR
========================= */

function calculateFCR(
    meanWeight,
    feed,
    birds
) {

    feed =
        Number(feed);

    birds =
        Number(birds);

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
    */

    const initialWeight =
        birds * 0.044;


    const currentWeight =
        birds *
        (meanWeight / 1000);


    const gain =
        currentWeight -
        initialWeight;


    if (gain <= 0) {

        return null;

    }


    return feed / gain;

}


/* =========================
   FCR WITH MORTALITY
========================= */

function calculateAdjustedFCR(
    meanWeight,
    feed,
    birds,
    mortality
) {

    feed =
        Number(feed);

    birds =
        Number(birds);

    mortality =
        Number(mortality) || 0;


    const liveBirds =
        birds - mortality;


    if (
        feed <= 0 ||
        birds <= 0 ||
        liveBirds <= 0
    ) {

        return null;

    }


    const initialWeight =
        liveBirds * 0.044;


    const currentWeight =
        liveBirds *
        (meanWeight / 1000);


    const gain =
        currentWeight -
        initialWeight;


    if (gain <= 0) {

        return null;

    }


    return feed / gain;

}


/* =========================
   CALCULATE
========================= */

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
            "حداقل دو وزن وارد کنید."
        );

        return;

    }


    if (!age) {

        alert(
            "سن گله را وارد کنید."
        );

        return;

    }


    const index =
        getDayIndex(age);


    if (index === -1) {

        alert(
            "برای مقایسه با Ross سن باید یکی از این موارد باشد:\n7، 14، 21، 28، 35، 42، 49 یا 56 روز."
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


    /* RESULTS */

    qs("sample").textContent =
        weights.length;


    qs("mean").textContent =
        mean.toFixed(1) +
        " g";


    qs("min").textContent =
        Math.min(...weights)
            .toFixed(1) +
        " g";


    qs("max").textContent =
        Math.max(...weights)
            .toFixed(1) +
        " g";


    qs("sd").textContent =
        sd.toFixed(1) +
        " g";


    qs("cv").textContent =
        cv.toFixed(2) +
        "%";


    qs("u10").textContent =
        u10.toFixed(1) +
        "%";


    qs("u15").textContent =
        u15.toFixed(1) +
        "%";


    qs("fcrActual").textContent =
        fcr === null
            ? "-"
            : fcr.toFixed(3);


    qs("fcrAdjusted").textContent =
        adjustedFCR === null
            ? "-"
            : adjustedFCR.toFixed(3);


    /* SAVE POINT */

    performanceHistory.weight[index] =
        Number(
            mean.toFixed(1)
        );


    performanceHistory.cv[index] =
        Number(
            cv.toFixed(2)
        );


    performanceHistory.uniformity[index] =
        Number(
            u10.toFixed(1)
        );


    performanceHistory.fcr[index] =
        fcr === null
            ? null
            : Number(
                fcr.toFixed(3)
            );


    /* STATUS */

    const weightDifference =
        (
            (
                mean -
                ROSS_WEIGHT[index]
            )
            /
            ROSS_WEIGHT[index]
        ) * 100;


    let status =
        "وزن: " +
        (
            weightDifference >= 0
                ? "+"
                : ""
        ) +
        weightDifference.toFixed(1) +
        "%";


    if (cv > CV_REFERENCE) {

        status +=
            " | CV بالا";

    }


    if (
        u10 <
        UNIFORMITY_REFERENCE
    ) {

        status +=
            " | یکنواختی پایین";

    }


    if (fcr !== null) {

        if (
            fcr <=
            ROSS_FCR[index]
        ) {

            status +=
                " | FCR بهتر از Ross";

        } else {

            status +=
                " | FCR بالاتر از Ross";

        }

    }


    qs(
        "performanceStatus"
    ).textContent =
        status;


    saveData();


    drawAllCharts(
        weights
    );


    qs(
        "calculationMessage"
    ).textContent =
        "اطلاعات روز " +
        age +
        " ثبت شد و روی نمودار قرار گرفت.";

}


/* =========================
   CHART LABELS
========================= */

function chartLabels() {

    return ROSS_DAYS.map(
        day =>
            day + " روز"
    );

}


/* =========================
   CHART OPTIONS
========================= */

function chartOptions(
    title
) {

    return {

        responsive: true,

        maintainAspectRatio: false,

        animation: false,

        interaction: {

            mode: "index",

            intersect: false

        },

        plugins: {

            legend: {

                position: "top",

                rtl: true,

                labels: {

                    usePointStyle: true

                }

            },

            tooltip: {

                rtl: true

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

                    text: title

                }

            }

        }

    };

}


/* =========================
   DRAW WEIGHT
========================= */

function drawWeightTrend() {

    if (weightTrendChart) {

        weightTrendChart.destroy();

    }


    weightTrendChart =
        new Chart(
            qs(
                "weightTrendChart"
            ),
            {

                type: "line",

                data: {

                    labels:
                        chartLabels(),

                    datasets: [

                        {

                            label:
                                "وزن واقعی گله",

                            data:
                                performanceHistory.weight,

                            borderColor:
                                "#087f5b",

                            backgroundColor:
                                "#087f5b",

                            borderWidth: 3,

                            pointRadius: 5,

                            tension: 0.25,

                            spanGaps: false,

                            fill: false

                        },

                        {

                            label:
                                "Ross 308",

                            data:
                                ROSS_WEIGHT,

                            borderColor:
                                "#777",

                            borderWidth: 2,

                            borderDash:
                                [8,6],

                            pointRadius: 3,

                            tension: 0.2,

                            fill: false

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


/* =========================
   DRAW CV
========================= */

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

                        {

                            label:
                                "CV واقعی گله",

                            data:
                                performanceHistory.cv,

                            borderColor:
                                "#087f5b",

                            backgroundColor:
                                "#087f5b",

                            borderWidth: 3,

                            pointRadius: 5,

                            tension: 0.25,

                            fill: false

                        },

                        {

                            label:
                                "حد مرجع 10%",

                            data:
                                Array(8)
                                    .fill(
                                        CV_REFERENCE
                                    ),

                            borderColor:
                                "#777",

                            borderWidth: 2,

                            borderDash:
                                [8,6],

                            pointRadius: 0,

                            fill: false

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


/* =========================
   DRAW UNIFORMITY
========================= */

function drawUniformity() {

    if (uniformityChart) {

        uniformityChart.destroy();

    }


    uniformityChart =
        new Chart(
            qs(
                "uniformityChart"
            ),
            {

                type: "line",

                data: {

                    labels:
                        chartLabels(),

                    datasets: [

                        {

                            label:
                                "یکنواختی واقعی ±10%",

                            data:
                                performanceHistory.uniformity,

                            borderColor:
                                "#087f5b",

                            backgroundColor:
                                "#087f5b",

                            borderWidth: 3,

                            pointRadius: 5,

                            tension: 0.25,

                            fill: false

                        },

                        {

                            label:
                                "حد مرجع 68%",

                            data:
                                Array(8)
                                    .fill(
                                        UNIFORMITY_REFERENCE
                                    ),

                            borderColor:
                                "#777",

                            borderWidth: 2,

                            borderDash:
                                [8,6],

                            pointRadius: 0,

                            fill: false

                        }

                    ]

                },

                options: {

                    ...chartOptions(
                        "یکنواختی (%)"
                    ),

                    scales: {

                        x: {

                            title: {

                                display: true,

                                text: "سن گله"

                            }

                        },

                        y: {

                            min: 0,

                            max: 100,

                            title: {

                                display: true,

                                text:
                                    "یکنواختی (%)"

                            }

                        }

                    }

                }

            }
        );

}


/* =========================
   DRAW FCR
========================= */

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

                        {

                            label:
                                "FCR واقعی فارم",

                            data:
                                performanceHistory.fcr,

                            borderColor:
                                "#087f5b",

                            backgroundColor:
                                "#087f5b",

                            borderWidth: 3,

                            pointRadius: 5,

                            tension: 0.25,

                            fill: false

                        },

                        {

                            label:
                                "Ross 308",

                            data:
                                ROSS_FCR,

                            borderColor:
                                "#777",

                            borderWidth: 2,

                            borderDash:
                                [8,6],

                            pointRadius: 3,

                            tension: 0.2,

                            fill: false

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


/* =========================
   WEIGHT SAMPLES
========================= */

function drawWeight(
    data
) {

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
                            (_, i) =>
                                "نمونه " +
                                (i + 1)
                        ),

                    datasets: [

                        {

                            label:
                                "وزن نمونه",

                            data:
                                data,

                            borderWidth: 1

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    animation: false,

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

                                text:
                                    "وزن (گرم)"

                            }

                        }

                    }

                }

            }
        );

}


/* =========================
   DRAW ALL
========================= */

function drawAllCharts(
    weights = null
) {

    drawWeightTrend();

    drawCV();

    drawUniformity();

    drawFCR();


    if (
        weights &&
        weights.length > 0
    ) {

        drawWeight(weights);

    }

}


/* =========================
   SAVE
========================= */

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


/* =========================
   LOAD
========================= */

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

        const data =
            JSON.parse(raw);


        qs("farm").value =
            data.farm || "";


        qs("hall").value =
            data.hall || "";


        qs("type").value =
            data.type || "";


        qs("age").value =
            data.age || "";


        qs("countBird").value =
            data.countBird || "";


        qs("date").value =
            data.date || "";


        qs("weightsInput").value =
            data.weights || "";


        qs("feedCumulative").value =
            data.feedCumulative || "";


        qs("mortalityCumulative").value =
            data.mortalityCumulative || "";


        if (
            data.performanceHistory
        ) {

            performanceHistory =
                data.performanceHistory;

        }

    }
    catch(error) {

        console.error(error);

    }

}


/* =========================
   DELETE CURRENT AGE
========================= */

function clearCurrentDay() {

    const age =
        Number(
            qs("age").value
        );


    const index =
        getDayIndex(age);


    if (index === -1) {

        alert(
            "سن معتبر نیست."
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


    qs(
        "calculationMessage"
    ).textContent =
        "داده این سن حذف شد.";

}


/* =========================
   CLEAR HISTORY
========================= */

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
            Array(8).fill(null),

        cv:
            Array(8).fill(null),

        uniformity:
            Array(8).fill(null),

        fcr:
            Array(8).fill(null)

    };


    saveData();

    drawAllCharts();


    qs(
        "calculationMessage"
    ).textContent =
        "تاریخچه نمودارها پاک شد.";

}


/* =========================
   START
========================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        showUser();

        loadData();

        drawAllCharts();


        document
            .querySelectorAll(
                "input,select,textarea"
            )
            .forEach(
                element => {

                    element.addEventListener(
                        "input",
                        saveData
                    );

                    element.addEventListener(
                        "change",
                        saveData
                    );

                }
            );

    }
);
