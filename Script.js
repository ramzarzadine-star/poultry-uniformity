/* =========================================================
   ADINEH POULTRY HEALTH CENTER
   Flock Performance Dashboard
   Ross 308 Reference
   ========================================================= */


let weightChart = null;
let weightTrendChart = null;
let cvChart = null;
let uniformityChart = null;
let fcrChart = null;


const currentUser =
    localStorage.getItem("activeUser") || "guest";


/* =========================================================
   ROSS 308 AS-HATCHED PERFORMANCE OBJECTIVES
   Source: Aviagen Ross 308/308 FF Performance Objectives 2022
   ========================================================= */

const rossReference = {

    age: [7, 14, 21, 28, 35, 42, 49, 56],

    weight: [
        213,
        533,
        1012,
        1616,
        2296,
        2998,
        3681,
        4318
    ],

    fcr: [
        0.780,
        1.005,
        1.142,
        1.269,
        1.399,
        1.531,
        1.663,
        1.793
    ]

};


/* =========================================================
   ROSS MANAGEMENT REFERENCE
   Ross does NOT publish an age-specific CV curve.
   These are reference values from Ross management guidance.
   ========================================================= */

const rossCVReference = 10;

const rossUniformityReference = 68;


/* =========================================================
   HISTORY
   ========================================================= */

let performanceHistory = [];


/* =========================================================
   USER
   ========================================================= */

function showUser() {

    const box = document.getElementById("userBox");

    if (!box) return;

    box.innerHTML =
        "👤 کاربر فعال: " +
        (currentUser === "guest" ? "مهمان" : currentUser);

}


/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {

    localStorage.removeItem("activeUser");

    window.location.href = "login.html";

}


/* =========================================================
   PERSIAN NUMBERS
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
   PARSE WEIGHTS
   ========================================================= */

function parseWeights(text) {

    text = persianNumber(text);

    return text
        .replace(/،/g, ",")
        .replace(/؛/g, ",")
        .replace(/\n/g, " ")
        .split(/[\s,]+/)
        .map(Number)
        .filter(function (x) {

            return Number.isFinite(x) && x > 0;

        });

}


/* =========================================================
   AVERAGE
   ========================================================= */

function average(arr) {

    if (!arr.length) return 0;

    return arr.reduce(function (sum, value) {

        return sum + value;

    }, 0) / arr.length;

}


/* =========================================================
   SAMPLE STANDARD DEVIATION
   ========================================================= */

function standardDeviation(arr, mean) {

    if (arr.length < 2) return 0;

    const sum = arr.reduce(function (total, value) {

        return total + Math.pow(value - mean, 2);

    }, 0);

    return Math.sqrt(sum / (arr.length - 1));

}


/* =========================================================
   UNIFORMITY
   ========================================================= */

function calculateUniformity(arr, mean, percentage) {

    if (!arr.length || mean <= 0) {
        return 0;
    }

    const low =
        mean * (1 - percentage);

    const high =
        mean * (1 + percentage);

    const inside =
        arr.filter(function (weight) {

            return weight >= low &&
                   weight <= high;

        }).length;

    return (inside / arr.length) * 100;

}


/* =========================================================
   FIND ROSS TARGET
   ========================================================= */

function getRossTarget(age, values) {

    const numericAge = Number(age);

    if (!Number.isFinite(numericAge)) {
        return null;
    }

    const index =
        rossReference.age.indexOf(numericAge);

    if (index === -1) {
        return null;
    }

    return values[index];

}


/* =========================================================
   INTERPOLATE ROSS TARGET
   Allows ages between weekly points.
   ========================================================= */

function interpolate(age, ages, values) {

    age = Number(age);

    if (!Number.isFinite(age)) {
        return null;
    }

    if (age <= ages[0]) {
        return values[0];
    }

    if (age >= ages[ages.length - 1]) {
        return values[values.length - 1];
    }

    for (let i = 0; i < ages.length - 1; i++) {

        const x1 = ages[i];
        const x2 = ages[i + 1];

        if (age >= x1 && age <= x2) {

            const y1 = values[i];
            const y2 = values[i + 1];

            const ratio =
                (age - x1) /
                (x2 - x1);

            return y1 +
                (y2 - y1) * ratio;

        }

    }

    return null;

}


/* =========================================================
   FCR CALCULATION
   ========================================================= */

function calculateFCR(meanWeight) {

    const directFCR =
        Number(
            persianNumber(
                document.getElementById("actualFCR")?.value
            )
        );

    /*
       If user enters actual FCR, use it.
    */

    if (
        Number.isFinite(directFCR) &&
        directFCR > 0
    ) {

        return directFCR;

    }


    /*
       Otherwise calculate from cumulative feed.
       Ross FCR includes initial body weight.
       Placement weight reference = 44 g.
    */

    const feed =
        Number(
            persianNumber(
                document.getElementById("feedCumulative")?.value
            )
        );


    if (
        !Number.isFinite(feed) ||
        feed <= 0 ||
        meanWeight <= 44
    ) {

        return null;

    }


    const gain =
        meanWeight - 44;


    return feed / gain;

}


/* =========================================================
   SAVE DATA
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

        feedCumulative:
            document.getElementById("feedCumulative")?.value || "",

        actualFCR:
            document.getElementById("actualFCR")?.value || "",

        performanceHistory:
            performanceHistory

    };


    localStorage.setItem(
        "adineh_" + currentUser,
        JSON.stringify(data)
    );

}


/* =========================================================
   LOAD DATA
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

        const obj =
            JSON.parse(saved);


        setValue("farm", obj.farm);
        setValue("hall", obj.hall);
        setValue("type", obj.type);
        setValue("age", obj.age);
        setValue("countBird", obj.countBird);
        setValue("date", obj.date);
        setValue("weightsInput", obj.weights);
        setValue("feedCumulative", obj.feedCumulative);
        setValue("actualFCR", obj.actualFCR);


        performanceHistory =
            Array.isArray(obj.performanceHistory)
                ? obj.performanceHistory
                : [];


        drawAllCharts();

    }

    catch (error) {

        console.error(
            "خطا در بارگذاری اطلاعات:",
            error
        );

    }

}


/* =========================================================
   SET VALUE
   ========================================================= */

function setValue(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.value =
            value || "";

    }

}


/* =========================================================
   UPDATE CURRENT AGE RECORD
   ========================================================= */

function updateHistory(record) {

    const existingIndex =
        performanceHistory.findIndex(function (item) {

            return Number(item.age) ===
                   Number(record.age);

        });


    if (existingIndex >= 0) {

        performanceHistory[existingIndex] =
            record;

    }

    else {

        performanceHistory.push(record);

    }


    performanceHistory.sort(function (a, b) {

        return Number(a.age) -
               Number(b.age);

    });


    /*
       Only keep the first 8 weeks.
    */

    performanceHistory =
        performanceHistory.filter(function (item) {

            return Number(item.age) >= 1 &&
                   Number(item.age) <= 56;

        });

}


/* =========================================================
   MAIN CALCULATION
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


    const age =
        Number(
            persianNumber(
                document.getElementById(
                    "age"
                ).value
            )
        );


    if (
        !Number.isFinite(age) ||
        age <= 0
    ) {

        alert(
            "سن گله را وارد کنید."
        );

        return;

    }


    if (age > 56) {

        alert(
            "نمودار مرجع Ross این بخش تا ۸ هفتگی طراحی شده است."
        );

    }


    const mean =
        average(weights);


    const sd =
        standardDeviation(
            weights,
            mean
        );


    const cv =
        mean > 0
            ? (sd / mean) * 100
            : 0;


    const u10 =
        calculateUniformity(
            weights,
            mean,
            0.10
        );


    const u15 =
        calculateUniformity(
            weights,
            mean,
            0.15
        );


    const fcr =
        calculateFCR(mean);


    const rossWeight =
        interpolate(
            age,
            rossReference.age,
            rossReference.weight
        );


    const rossFCR =
        interpolate(
            age,
            rossReference.age,
            rossReference.fcr
        );


    const weightDifference =
        rossWeight !== null
            ? mean - rossWeight
            : null;


    const weightDifferencePercent =
        rossWeight !== null
            ? ((mean - rossWeight) /
               rossWeight) * 100
            : null;


    const record = {

        age: age,

        mean: Number(
            mean.toFixed(1)
        ),

        sd: Number(
            sd.toFixed(1)
        ),

        cv: Number(
            cv.toFixed(2)
        ),

        uniformity10: Number(
            u10.toFixed(1)
        ),

        uniformity15: Number(
            u15.toFixed(1)
        ),

        fcr:
            fcr !== null
                ? Number(fcr.toFixed(3))
                : null,

        rossWeight:
            rossWeight !== null
                ? Number(rossWeight.toFixed(1))
                : null,

        rossFCR:
            rossFCR !== null
                ? Number(rossFCR.toFixed(3))
                : null,

        weightDifference:
            weightDifference !== null
                ? Number(
                    weightDifference.toFixed(1)
                  )
                : null,

        weightDifferencePercent:
            weightDifferencePercent !== null
                ? Number(
                    weightDifferencePercent.toFixed(1)
                  )
                : null

    };


    updateHistory(record);


    updateResults(
        weights,
        mean,
        sd,
        cv,
        u10,
        u15,
        fcr,
        rossWeight
    );


    saveData();


    drawWeight(weights);

    drawWeightTrend();

    drawCV();

    drawUniformity();

    drawFCR();


    updatePerformanceStatus(
        record
    );

}


/* =========================================================
   UPDATE RESULT CARDS
   ========================================================= */

function updateResults(
    weights,
    mean,
    sd,
    cv,
    u10,
    u15,
    fcr,
    rossWeight
) {

    setHTML(
        "sample",
        weights.length
    );


    setHTML(
        "mean",
        mean.toFixed(1) + " g"
    );


    setHTML(
        "min",
        Math.min(...weights) + " g"
    );


    setHTML(
        "max",
        Math.max(...weights) + " g"
    );


    setHTML(
        "sd",
        sd.toFixed(1) + " g"
    );


    setHTML(
        "cv",
        cv.toFixed(2) + "%"
    );


    setHTML(
        "u10",
        u10.toFixed(1) + "%"
    );


    setHTML(
        "u15",
        u15.toFixed(1) + "%"
    );


    setHTML(
        "fcr",
        fcr !== null
            ? fcr.toFixed(3)
            : "-"
    );

}


/* =========================================================
   STATUS
   ========================================================= */

function updatePerformanceStatus(record) {

    const box =
        document.getElementById(
            "performanceStatus"
        );


    if (!box) return;


    let status = "ثبت شد";


    if (
        record.weightDifferencePercent !== null
    ) {

        if (
            record.weightDifferencePercent >= -5
        ) {

            status =
                "✓ نزدیک / بالاتر از هدف Ross";

        }

        else if (
            record.weightDifferencePercent >= -10
        ) {

            status =
                "⚠ پایین‌تر از هدف Ross";

        }

        else {

            status =
                "⚠ افت محسوس نسبت به Ross";

        }

    }


    box.innerHTML = status;

}


/* =========================================================
   DISTRIBUTION CHART
   ========================================================= */

function drawWeight(data) {

    destroyChart("weightChart");


    const canvas =
        document.getElementById(
            "weightChart"
        );


    if (!canvas) return;


    weightChart =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels:
                        data.map(
                            function (_, index) {
                                return "نمونه " +
                                    (index + 1);
                            }
                        ),

                    datasets: [

                        {

                            label:
                                "وزن نمونه (g)",

                            data:
                                data,

                            borderWidth: 1

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: true
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


/* =========================================================
   WEIGHT TREND
   ========================================================= */

function drawWeightTrend() {

    destroyChart("weightTrendChart");


    const canvas =
        document.getElementById(
            "weightTrendChart"
        );


    if (!canvas) return;


    const actual =
        performanceHistory;


    weightTrendChart =
        new Chart(
            canvas,
            {

                type: "line",

                data: {

                    labels:
                        rossReference.age.map(
                            function (age) {
                                return age +
                                    " روز";
                            }
                        ),

                    datasets: [

                        {

                            label:
                                "وزن واقعی گله",

                            data:
                                rossReference.age.map(
                                    function (age) {

                                        const item =
                                            actual.find(
                                                function (x) {
                                                    return Number(x.age) === age;
                                                }
                                            );

                                        return item
                                            ? item.mean
                                            : null;

                                    }
                                ),

                            borderWidth: 3,

                            tension: 0.25,

                            spanGaps: true

                        },

                        {

                            label:
                                "هدف Ross 308",

                            data:
                                rossReference.weight,

                            borderWidth: 3,

                            borderDash:
                                [8, 5],

                            tension: 0.25

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    interaction: {

                        mode: "index",

                        intersect: false

                    },

                    scales: {

                        y: {

                            beginAtZero: true,

                            title: {

                                display: true,

                                text:
                                    "وزن (g)"

                            }

                        }

                    }

                }

            }

        );

}


/* =========================================================
   CV CHART
   ========================================================= */

function drawCV() {

    destroyChart("cvChart");


    const canvas =
        document.getElementById(
            "cvChart"
        );


    if (!canvas) return;


    cvChart =
        new Chart(
            canvas,
            {

                type: "line",

                data: {

                    labels:
                        rossReference.age.map(
                            function (age) {
                                return age +
                                    " روز";
                            }
                        ),

                    datasets: [

                        {

                            label:
                                "CV واقعی",

                            data:
                                rossReference.age.map(
                                    function (age) {

                                        const item =
                                            performanceHistory.find(
                                                function (x) {
                                                    return Number(x.age) === age;
                                                }
                                            );

                                        return item
                                            ? item.cv
                                            : null;

                                    }
                                ),

                            borderWidth: 3,

                            tension: 0.25,

                            spanGaps: true

                        },

                        {

                            label:
                                "مرجع مدیریتی Ross = 10%",

                            data:
                                rossReference.age.map(
                                    function () {
                                        return rossCVReference;
                                    }
                                ),

                            borderWidth: 2,

                            borderDash:
                                [8, 5],

                            tension: 0

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    scales: {

                        y: {

                            beginAtZero: true,

                            title: {

                                display: true,

                                text:
                                    "CV (%)"

                            }

                        }

                    }

                }

            }

        );

}


/* =========================================================
   UNIFORMITY CHART
   ========================================================= */

function drawUniformity() {

    destroyChart("uniformityChart");


    const canvas =
        document.getElementById(
            "uniformityChart"
        );


    if (!canvas) return;


    uniformityChart =
        new Chart(
            canvas,
            {

                type: "line",

                data: {

                    labels:
                        rossReference.age.map(
                            function (age) {
                                return age +
                                    " روز";
                            }
                        ),

                    datasets: [

                        {

                            label:
                                "یکنواختی واقعی ±10%",

                            data:
                                rossReference.age.map(
                                    function (age) {

                                        const item =
                                            performanceHistory.find(
                                                function (x) {
                                                    return Number(x.age) === age;
                                                }
                                            );

                                        return item
                                            ? item.uniformity10
                                            : null;

                                    }
                                ),

                            borderWidth: 3,

                            tension: 0.25,

                            spanGaps: true

                        },

                        {

                            label:
                                "مرجع مدیریتی Ross = 68%",

                            data:
                                rossReference.age.map(
                                    function () {
                                        return rossUniformityReference;
                                    }
                                ),

                            borderWidth: 2,

                            borderDash:
                                [8, 5],

                            tension: 0

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    scales: {

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


/* =========================================================
   FCR CHART
   ========================================================= */

function drawFCR() {

    destroyChart("fcrChart");


    const canvas =
        document.getElementById(
            "fcrChart"
        );


    if (!canvas) return;


    fcrChart =
        new Chart(
            canvas,
            {

                type: "line",

                data: {

                    labels:
                        rossReference.age.map(
                            function (age) {
                                return age +
                                    " روز";
                            }
                        ),

                    datasets: [

                        {

                            label:
                                "FCR واقعی",

                            data:
                                rossReference.age.map(
                                    function (age) {

                                        const item =
                                            performanceHistory.find(
                                                function (x) {
                                                    return Number(x.age) === age;
                                                }
                                            );

                                        return item
                                            ? item.fcr
                                            : null;

                                    }
                                ),

                            borderWidth: 3,

                            tension: 0.25,

                            spanGaps: true

                        },

                        {

                            label:
                                "هدف Ross 308",

                            data:
                                rossReference.fcr,

                            borderWidth: 3,

                            borderDash:
                                [8, 5],

                            tension: 0.25

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    scales: {

                        y: {

                            beginAtZero: false,

                            title: {

                                display: true,

                                text:
                                    "FCR"

                            }

                        }

                    }

                }

            }

        );

}


/* =========================================================
   DRAW ALL
   ========================================================= */

function drawAllCharts() {

    drawWeightTrend();

    drawCV();

    drawUniformity();

    drawFCR();

}


/* =========================================================
   DESTROY CHART
   ========================================================= */

function destroyChart(id) {

    const map = {

        weightChart:
            function () {
                if (weightChart) {
                    weightChart.destroy();
                    weightChart = null;
                }
            },

        weightTrendChart:
            function () {
                if (weightTrendChart) {
                    weightTrendChart.destroy();
                    weightTrendChart = null;
                }
            },

        cvChart:
            function () {
                if (cvChart) {
                    cvChart.destroy();
                    cvChart = null;
                }
            },

        uniformityChart:
            function () {
                if (uniformityChart) {
                    uniformityChart.destroy();
                    uniformityChart = null;
                }
            },

        fcrChart:
            function () {
                if (fcrChart) {
                    fcrChart.destroy();
                    fcrChart = null;
                }
            },

        weightChart:
            function () {
                if (weightChart) {
                    weightChart.destroy();
                    weightChart = null;
                }
            }

    };


    if (map[id]) {
        map[id]();
    }

}


/* =========================================================
   CLEAR CURRENT
   ========================================================= */

function clearCurrentCalculation() {

    setHTML("sample", "-");
    setHTML("mean", "-");
    setHTML("min", "-");
    setHTML("max", "-");
    setHTML("sd", "-");
    setHTML("cv", "-");
    setHTML("u10", "-");
    setHTML("u15", "-");
    setHTML("fcr", "-");
    setHTML("performanceStatus", "-");


    drawWeight([]);

}


/* =========================================================
   HTML HELPER
   ========================================================= */

function setHTML(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.innerHTML =
            value;

    }

}


/* =========================================================
   AUTO SAVE
   ========================================================= */

document.addEventListener(
    "input",
    function () {

        saveData();

    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        showUser();

        loadData();

        drawAllCharts();

    }
);
