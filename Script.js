let weightChart = null;
let weightTrendChart = null;
let cvChart = null;
let uniformityChart = null;
let fcrChart = null;


/*
 Ross 308 / 308 FF
 As-Hatched Performance Objectives
 Aviagen 2022
*/

const ROSS_AGE = [
    7, 14, 21, 28, 35, 42, 49, 56
];

const ROSS_WEIGHT = [
    213, 533, 1012, 1616,
    2296, 2998, 3681, 4318
];

const ROSS_FCR = [
    0.780, 1.005, 1.142, 1.269,
    1.399, 1.531, 1.663, 1.793
];

const CV_REFERENCE = 10;
const UNIFORMITY_REFERENCE = 68;

const currentUser =
    localStorage.getItem("activeUser") || "guest";


function logout() {

    localStorage.removeItem("activeUser");

    location.href = "login.html";
}


function toEnglishNumbers(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/[۰-۹]/g, function(ch) {
            return "۰۱۲۳۴۵۶۷۸۹".indexOf(ch);
        })
        .replace(/[٠-٩]/g, function(ch) {
            return "٠١٢٣٤٥٦٧٨٩".indexOf(ch);
        });
}


function parseWeights(text) {

    text = toEnglishNumbers(text);

    return text
        .replace(/،/g, ",")
        .replace(/;/g, ",")
        .split(/[\s,]+/)
        .map(Number)
        .filter(x =>
            Number.isFinite(x) && x > 0
        );
}


function average(arr) {

    if (!arr.length) return 0;

    return arr.reduce(
        (sum, value) => sum + value,
        0
    ) / arr.length;
}


function standardDeviation(arr, mean) {

    if (arr.length < 2) return 0;

    const variance =
        arr.reduce(
            (sum, value) =>
                sum + Math.pow(value - mean, 2),
            0
        ) / (arr.length - 1);

    return Math.sqrt(variance);
}


function uniformity(arr, mean, percent) {

    if (!arr.length || !mean) return 0;

    const low = mean * (1 - percent);
    const high = mean * (1 + percent);

    return (
        arr.filter(
            x => x >= low && x <= high
        ).length / arr.length
    ) * 100;
}


function getWeightRecordsSafe() {

    if (typeof getWeightRecords === "function") {
        return getWeightRecords();
    }

    return [];
}


function getFeedRecordsSafe() {

    if (typeof getFeedRecords === "function") {
        return getFeedRecords();
    }

    return [];
}


function showUser() {

    const box =
        document.getElementById("userBox");

    if (!box) return;

    box.textContent =
        "👤 کاربر فعال: " +
        (currentUser === "guest"
            ? "مهمان"
            : currentUser);
}


function getFcrForAge(age, meanWeight) {

    const flock = loadFlock();

    const placementWeight =
        Number(flock.placementWeight || 44);

    const birds =
        Number(flock.countBird || 0);

    const feedRecords =
        getFeedRecordsSafe();

    const feedToAge =
        feedRecords
            .filter(r =>
                Number(r.age) <= Number(age)
            )
            .reduce(
                (sum,r) =>
                    sum + Number(r.feedKg || 0),
                0
            );

    if (
        !birds ||
        !feedToAge ||
        !meanWeight ||
        meanWeight <= placementWeight
    ) {
        return null;
    }

    const currentLiveWeight =
        birds * (meanWeight / 1000);

    const initialLiveWeight =
        birds * (placementWeight / 1000);

    const weightGain =
        currentLiveWeight -
        initialLiveWeight;

    if (weightGain <= 0) {
        return null;
    }

    return feedToAge / weightGain;
}


function calculateFromWeights(weights, age) {

    const mean = average(weights);

    const sd =
        standardDeviation(weights, mean);

    const cv =
        mean > 0
            ? (sd / mean) * 100
            : 0;

    const u10 =
        uniformity(weights, mean, .10);

    const u15 =
        uniformity(weights, mean, .15);

    return {
        age: Number(age),
        sample: weights.length,
        mean,
        sd,
        cv,
        u10,
        u15,
        min: Math.min(...weights),
        max: Math.max(...weights)
    };
}


function savePerformance(record) {

    addWeightRecord(record);

    const flock =
        loadFlock();

    flock.lastAge = record.age;
    flock.lastMean = record.mean;
    flock.lastCV = record.cv;
    flock.lastU10 = record.u10;
    flock.lastU15 = record.u15;

    saveFlock(flock);
}


function calculate() {

    const input =
        document.getElementById("weightsInput");

    if (!input) return;

    const weights =
        parseWeights(input.value);

    if (weights.length < 2) {

        alert(
            "حداقل دو وزن معتبر وارد کنید."
        );

        return;
    }

    const ageInput =
        document.getElementById("age");

    const age =
        Number(
            ageInput?.value || 0
        );

    if (!age || age < 1) {

        alert(
            "سن گله را وارد کنید."
        );

        return;
    }

    const result =
        calculateFromWeights(
            weights,
            age
        );

    renderResult(result);

    savePerformance(result);

    drawAllCharts();

    alert(
        "ارزیابی گله با موفقیت ثبت شد."
    );
}


function renderResult(result) {

    const map = {
        sample: result.sample,
        mean: result.mean.toFixed(1) + " g",
        min: result.min.toFixed(0) + " g",
        max: result.max.toFixed(0) + " g",
        sd: result.sd.toFixed(1) + " g",
        cv: result.cv.toFixed(2) + "%",
        u10: result.u10.toFixed(1) + "%",
        u15: result.u15.toFixed(1) + "%"
    };

    Object.keys(map).forEach(id => {

        const el =
            document.getElementById(id);

        if (el) {
            el.textContent = map[id];
        }
    });
}


function loadLatestResult() {

    const records =
        getWeightRecordsSafe();

    if (!records.length) return;

    const last =
        records[records.length - 1];

    renderResult(last);

    updateDashboardStats(last);
}


function updateDashboardStats(last) {

    const age =
        document.getElementById("dashAge");

    const weight =
        document.getElementById("dashWeight");

    const cv =
        document.getElementById("dashCV");

    const uniformity =
        document.getElementById("dashUniformity");

    if (age)
        age.textContent =
            Number(last.age) + " روز";

    if (weight)
        weight.textContent =
            Number(last.mean).toFixed(0) + " g";

    if (cv)
        cv.textContent =
            Number(last.cv).toFixed(1) + "%";

    if (uniformity)
        uniformity.textContent =
            Number(last.u10).toFixed(1) + "%";
}


function getChartLabels() {

    return ROSS_AGE.map(
        age => "روز " + age
    );
}


function destroyChart(chart) {

    if (chart) {
        chart.destroy();
    }

    return null;
}


function makeChart(id, config) {

    const canvas =
        document.getElementById(id);

    if (!canvas) return null;

    return new Chart(
        canvas.getContext("2d"),
        config
    );
}


function actualByAge(records, field) {

    return ROSS_AGE.map(age => {

        const found =
            records.find(
                r => Number(r.age) === age
            );

        return found
            ? Number(found[field])
            : null;
    });
}


function drawWeightTrend() {

    weightTrendChart =
        destroyChart(weightTrendChart);

    const records =
        getWeightRecordsSafe();

    weightTrendChart =
        makeChart(
            "weightTrendChart",
            {
                type: "line",

                data: {

                    labels: getChartLabels(),

                    datasets: [

                        {
                            label: "وزن واقعی گله",
                            data: actualByAge(
                                records,
                                "mean"
                            ),
                            borderWidth: 3,
                            pointRadius: 5,
                            tension: .25,
                            spanGaps: true
                        },

                        {
                            label: "Ross 308",
                            data: ROSS_WEIGHT,
                            borderWidth: 3,
                            borderDash: [8,5],
                            pointRadius: 4,
                            tension: .2
                        }

                    ]
                },

                options: chartOptions(
                    "وزن (گرم)"
                )
            }
        );
}


function drawCV() {

    cvChart =
        destroyChart(cvChart);

    const records =
        getWeightRecordsSafe();

    cvChart =
        makeChart(
            "cvChart",
            {
                type: "line",

                data: {

                    labels: getChartLabels(),

                    datasets: [

                        {
                            label: "CV واقعی",
                            data: actualByAge(
                                records,
                                "cv"
                            ),
                            borderWidth: 3,
                            pointRadius: 5,
                            tension: .25,
                            spanGaps: true
                        },

                        {
                            label: "مرجع مدیریتی CV = 10%",
                            data: ROSS_AGE.map(
                                () => CV_REFERENCE
                            ),
                            borderWidth: 2,
                            borderDash: [8,5],
                            pointRadius: 0
                        }

                    ]
                },

                options: chartOptions(
                    "CV (%)"
                )
            }
        );
}


function drawUniformity() {

    uniformityChart =
        destroyChart(uniformityChart);

    const records =
        getWeightRecordsSafe();

    uniformityChart =
        makeChart(
            "uniformityChart",
            {
                type: "line",

                data: {

                    labels: getChartLabels(),

                    datasets: [

                        {
                            label: "یکنواختی واقعی ±10%",
                            data: actualByAge(
                                records,
                                "u10"
                            ),
                            borderWidth: 3,
                            pointRadius: 5,
                            tension: .25,
                            spanGaps: true
                        },

                        {
                            label: "مرجع مدیریتی 68%",
                            data: ROSS_AGE.map(
                                () => UNIFORMITY_REFERENCE
                            ),
                            borderWidth: 2,
                            borderDash: [8,5],
                            pointRadius: 0
                        }

                    ]
                },

                options: {
                    ...chartOptions(
                        "یکنواختی (%)"
                    ),
                    scales: {
                        y: {
                            min: 0,
                            max: 100,
                            title: {
                                display: true,
                                text: "درصد"
                            }
                        }
                    }
                }
            }
        );
}


function drawFCR() {

    fcrChart =
        destroyChart(fcrChart);

    const records =
        getWeightRecordsSafe();

    const actual =
        ROSS_AGE.map(age => {

            const record =
                records.find(
                    r => Number(r.age) === age
                );

            if (!record) return null;

            const fcr =
                getFcrForAge(
                    age,
                    Number(record.mean)
                );

            return fcr === null
                ? null
                : Number(fcr.toFixed(3));
        });

    fcrChart =
        makeChart(
            "fcrChart",
            {
                type: "line",

                data: {

                    labels: getChartLabels(),

                    datasets: [

                        {
                            label: "FCR واقعی گله",
                            data: actual,
                            borderWidth: 3,
                            pointRadius: 5,
                            tension: .25,
                            spanGaps: true
                        },

                        {
                            label: "هدف Ross 308",
                            data: ROSS_FCR,
                            borderWidth: 3,
                            borderDash: [8,5],
                            pointRadius: 4,
                            tension: .2
                        }

                    ]
                },

                options: chartOptions(
                    "FCR"
                )
            }
        );
}


function drawWeightDistribution() {

    weightChart =
        destroyChart(weightChart);

    const records =
        getWeightRecordsSafe();

    if (!records.length) return;

    const latest =
        records[records.length - 1];

    const weights =
        latest.weights || [];

    if (!weights.length) return;

    weightChart =
        makeChart(
            "weightChart",
            {
                type: "bar",

                data: {

                    labels:
                        weights.map(
                            (_,i) =>
                                "نمونه " + (i + 1)
                        ),

                    datasets: [

                        {
                            label: "وزن نمونه",
                            data: weights,
                            borderWidth: 1
                        }

                    ]
                },

                options: chartOptions(
                    "وزن (گرم)"
                )
            }
        );
}


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
                position: "top",
                rtl: true,
                labels: {
                    usePointStyle: true,
                    padding: 14
                }
            },

            tooltip: {
                rtl: true
            }

        },

        scales: {

            x: {
                ticks: {
                    maxRotation: 35,
                    minRotation: 0
                }
            },

            y: {
                beginAtZero: false,
                title: {
                    display: true,
                    text: yTitle
                }
            }

        }
    };
}


function drawAllCharts() {

    drawWeightTrend();
    drawCV();
    drawUniformity();
    drawFCR();
    drawWeightDistribution();
}


function saveFormAutomatically() {

    const fields = [
        "farm",
        "hall",
        "type",
        "age",
        "countBird",
        "date",
        "placementWeight"
    ];

    const data = {};

    fields.forEach(id => {

        const el =
            document.getElementById(id);

        if (el) {
            data[id] = el.value;
        }
    });

    if (Object.keys(data).length) {
        saveFlock(data);
    }
}


function loadForm() {

    const data =
        loadFlock();

    Object.keys(data).forEach(id => {

        const el =
            document.getElementById(id);

        if (el && data[id] !== undefined) {
            el.value = data[id];
        }
    });
}


document.addEventListener(
    "DOMContentLoaded",
    function() {

        showUser();

        loadForm();

        loadLatestResult();

        drawAllCharts();

        document.addEventListener(
            "input",
            saveFormAutomatically
        );
    }
);
