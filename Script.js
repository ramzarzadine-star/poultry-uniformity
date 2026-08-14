/* =========================================================
   مدیریت گله طیور
   مرکز تخصصی سلامت طیور آدینه
   ========================================================= */


/* =========================================================
   متغیرهای نمودار
   ========================================================= */

let weightChart = null;
let cvChart = null;
let weightTrendChart = null;


/* =========================================================
   کاربر فعال
   ========================================================= */

let currentUser =
    localStorage.getItem("activeUser") || "guest";


/* =========================================================
   تاریخچه اطلاعات
   ========================================================= */

let cvHistory = [];
let weightHistory = [];
let ageHistory = [];


/* =========================================================
   استاندارد Ross 308
   ========================================================= */

const rossAge = [
    7,
    14,
    21,
    28,
    35,
    42,
    49,
    56
];


const rossWeight = [
    190,
    490,
    900,
    1400,
    1950,
    2500,
    3050,
    3600
];


const rossCV = [
    13,
    12,
    11,
    10,
    9,
    8,
    7,
    6
];


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
        currentUser;

}


/* =========================================================
   خروج از حساب
   ========================================================= */

function logout() {

    localStorage.removeItem("activeUser");

    window.location.href =
        "login.html";

}


/* =========================================================
   تبدیل اعداد فارسی به انگلیسی
   ========================================================= */

function persianNumber(str) {

    if (!str) {
        return "";
    }


    return String(str).replace(
        /[۰-۹]/g,
        function (x) {

            return "۰۱۲۳۴۵۶۷۸۹"
                .indexOf(x);

        }
    );

}


/* =========================================================
   تبدیل اعداد عربی به انگلیسی
   ========================================================= */

function arabicNumber(str) {

    if (!str) {
        return "";
    }


    return String(str)
        .replace(/٠/g, "0")
        .replace(/١/g, "1")
        .replace(/٢/g, "2")
        .replace(/٣/g, "3")
        .replace(/٤/g, "4")
        .replace(/٥/g, "5")
        .replace(/٦/g, "6")
        .replace(/٧/g, "7")
        .replace(/٨/g, "8")
        .replace(/٩/g, "9");

}


/* =========================================================
   تبدیل متن وزن‌ها به آرایه
   ========================================================= */

function parseWeights(text) {

    text = persianNumber(text);

    text = arabicNumber(text);


    return text

        .replace(/،/g, ",")

        .replace(/;/g, ",")

        .replace(/\n/g, ",")

        .split(/[\s,]+/)

        .map(Number)

        .filter(function (x) {

            return Number.isFinite(x) &&
                   x > 0;

        });

}


/* =========================================================
   میانگین
   ========================================================= */

function average(arr) {

    if (!arr.length) {
        return 0;
    }


    return arr.reduce(
        function (a, b) {
            return a + b;
        },
        0
    ) / arr.length;

}


/* =========================================================
   انحراف معیار نمونه‌ای
   ========================================================= */

function standard(arr, mean) {

    if (arr.length < 2) {
        return 0;
    }


    let sum = 0;


    arr.forEach(function (x) {

        sum += Math.pow(
            x - mean,
            2
        );

    });


    return Math.sqrt(
        sum / (arr.length - 1)
    );

}


/* =========================================================
   یکنواختی
   ========================================================= */

function uniformity(arr, mean, p) {

    if (!arr.length || mean <= 0) {
        return 0;
    }


    const low =
        mean * (1 - p);


    const high =
        mean * (1 + p);


    const count =
        arr.filter(function (x) {

            return x >= low &&
                   x <= high;

        }).length;


    return (
        count /
        arr.length
    ) * 100;

}


/* =========================================================
   ذخیره اطلاعات
   ========================================================= */

function saveData() {

    if (currentUser === "guest") {
        return;
    }


    const farm =
        document.getElementById("farm");


    const hall =
        document.getElementById("hall");


    const type =
        document.getElementById("type");


    const age =
        document.getElementById("age");


    const countBird =
        document.getElementById("countBird");


    const date =
        document.getElementById("date");


    const weightsInput =
        document.getElementById("weightsInput");


    if (
        !farm ||
        !hall ||
        !type ||
        !age ||
        !countBird ||
        !date ||
        !weightsInput
    ) {
        return;
    }


    const data = {

        farm: farm.value.trim(),

        hall: hall.value,

        type: type.value,

        age: age.value,

        countBird: countBird.value,

        date: date.value,

        weights: weightsInput.value,

        cvHistory: cvHistory,

        weightHistory: weightHistory,

        ageHistory: ageHistory

    };


    localStorage.setItem(

        "adineh_" +
        currentUser,

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


    const data =
        localStorage.getItem(
            "adineh_" +
            currentUser
        );


    if (!data) {
        return;
    }


    try {

        const obj =
            JSON.parse(data);


        const farm =
            document.getElementById("farm");


        const hall =
            document.getElementById("hall");


        const type =
            document.getElementById("type");


        const age =
            document.getElementById("age");


        const countBird =
            document.getElementById("countBird");


        const date =
            document.getElementById("date");


        const weightsInput =
            document.getElementById(
                "weightsInput"
            );


        if (farm) {
            farm.value =
                obj.farm || "";
        }


        if (hall) {
            hall.value =
                obj.hall || "";
        }


        if (type) {
            type.value =
                obj.type || "";
        }


        if (age) {
            age.value =
                obj.age || "";
        }


        if (countBird) {
            countBird.value =
                obj.countBird || "";
        }


        if (date) {
            date.value =
                obj.date || "";
        }


        if (weightsInput) {
            weightsInput.value =
                obj.weights || "";
        }


        cvHistory =
            Array.isArray(obj.cvHistory)
                ? obj.cvHistory
                : [];


        weightHistory =
            Array.isArray(obj.weightHistory)
                ? obj.weightHistory
                : [];


        ageHistory =
            Array.isArray(obj.ageHistory)
                ? obj.ageHistory
                : [];


        /*
         اگر اطلاعات قبلی وجود داشته باشد
         آخرین محاسبه دوباره نمایش داده می‌شود
        */

        if (
            weightsInput &&
            weightsInput.value.trim()
        ) {

            calculate(false);

        }

    }
    catch (error) {

        console.error(
            "خطا در بارگذاری اطلاعات:",
            error
        );

    }

}


/* =========================================================
   محاسبه
   ========================================================= */

function calculate(saveHistory = true) {

    const input =
        document.getElementById(
            "weightsInput"
        );


    if (!input) {
        return;
    }


    const weights =
        parseWeights(input.value);


    if (weights.length < 2) {

        alert(
            "حداقل دو وزن وارد کنید"
        );

        return;

    }


    /* میانگین */

    const mean =
        average(weights);


    /* SD */

    const sd =
        standard(
            weights,
            mean
        );


    /* CV */

    const cv =
        mean > 0
            ? (sd / mean) * 100
            : 0;


    /* یکنواختی */

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


    /* حداقل و حداکثر */

    const min =
        Math.min(...weights);


    const max =
        Math.max(...weights);


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
        min.toFixed(1)
    );


    setText(
        "max",
        max.toFixed(1)
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
        u10.toFixed(1) + "%"
    );


    setText(
        "u15",
        u15.toFixed(1) + "%"
    );


    /* =====================================================
       ذخیره تاریخچه
       ===================================================== */

    if (saveHistory) {

        let ageInput =
            document.getElementById(
                "age"
            );


        let age =
            ageInput
                ? Number(ageInput.value)
                : 0;


        /*
         اگر سن وارد نشده باشد،
         براساس رکورد قبلی سن ایجاد می‌شود.
        */

        if (
            !Number.isFinite(age) ||
            age <= 0
        ) {

            age =
                ageHistory.length > 0
                    ? ageHistory[
                        ageHistory.length - 1
                    ] + 7
                    : 7;

        }


        cvHistory.push(
            Number(
                cv.toFixed(2)
            )
        );


        weightHistory.push(
            Number(
                mean.toFixed(1)
            )
        );


        ageHistory.push(
            Number(age)
        );


        /*
         حداکثر 8 رکورد آخر
         */

        if (cvHistory.length > 8) {
            cvHistory.shift();
        }


        if (weightHistory.length > 8) {
            weightHistory.shift();
        }


        if (ageHistory.length > 8) {
            ageHistory.shift();
        }


        saveData();

    }


    /* =====================================================
       نمودارها
       ===================================================== */

    drawWeight(weights);

    drawWeightTrend();

    drawCV();

}


/* =========================================================
   تنظیم متن
   ========================================================= */

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   نمودار وزن نمونه‌ها
   ========================================================= */

function drawWeight(data) {

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

                    labels:
                        data.map(
                            function (x, i) {
                                return "نمونه " +
                                    (i + 1);
                            }
                        ),

                    datasets: [

                        {

                            label:
                                "وزن نمونه",

                            data:
                                data,

                            borderWidth:
                                3,

                            pointRadius:
                                4,

                            fill:
                                false,

                            tension:
                                0.3

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        true,

                    plugins: {

                        legend: {

                            display:
                                true

                        }

                    },

                    scales: {

                        y: {

                            beginAtZero:
                                false,

                            title: {

                                display:
                                    true,

                                text:
                                    "وزن"

                            }

                        }

                    }

                }

            }
        );

}


/* =========================================================
   نمودار روند وزن
   ========================================================= */

function drawWeightTrend() {

    const canvas =
        document.getElementById(
            "weightTrendChart"
        );


    if (!canvas) {
        return;
    }


    if (weightTrendChart) {

        weightTrendChart.destroy();

    }


    /*
     فقط سن‌هایی که واقعاً داده دارند
     */

    const labels =
        ageHistory.map(
            function (age) {
                return age + " روز";
            }
        );


    /*
     استاندارد Ross نزدیک‌ترین نقاط
     */

    const standardWeights =
        ageHistory.map(
            function (age) {

                let closestIndex = 0;

                let minDifference =
                    Infinity;


                rossAge.forEach(
                    function (
                        ross,
                        index
                    ) {

                        const difference =
                            Math.abs(
                                ross - age
                            );


                        if (
                            difference <
                            minDifference
                        ) {

                            minDifference =
                                difference;

                            closestIndex =
                                index;

                        }

                    }
                );


                return rossWeight[
                    closestIndex
                ];

            }
        );


    weightTrendChart =
        new Chart(
            canvas,
            {

                type:
                    "line",

                data: {

                    labels:
                        labels,

                    datasets: [

                        {

                            label:
                                "وزن واقعی گله",

                            data:
                                weightHistory,

                            borderWidth:
                                3,

                            pointRadius:
                                5,

                            fill:
                                false,

                            tension:
                                0.3

                        },


                        {

                            label:
                                "استاندارد Ross 308",

                            data:
                                standardWeights,

                            borderWidth:
                                2,

                            borderDash:
                                [8, 5],

                            fill:
                                false,

                            tension:
                                0.3

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        true,

                    plugins: {

                        legend: {

                            display:
                                true

                        }

                    },

                    scales: {

                        y: {

                            beginAtZero:
                                false,

                            title: {

                                display:
                                    true,

                                text:
                                    "وزن"

                            }

                        }

                    }

                }

            }
        );

}


/* =========================================================
   نمودار CV
   ========================================================= */

function drawCV() {

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


    const labels =
        ageHistory.map(
            function (age) {
                return age + " روز";
            }
        );


    const standardCV =
        ageHistory.map(
            function (age) {

                let closestIndex = 0;

                let minDifference =
                    Infinity;


                rossAge.forEach(
                    function (
                        ross,
                        index
                    ) {

                        const difference =
                            Math.abs(
                                ross - age
                            );


                        if (
                            difference <
                            minDifference
                        ) {

                            minDifference =
                                difference;

                            closestIndex =
                                index;

                        }

                    }
                );


                return rossCV[
                    closestIndex
                ];

            }
        );


    cvChart =
        new Chart(
            canvas,
            {

                type:
                    "line",

                data: {

                    labels:
                        labels,

                    datasets: [

                        {

                            label:
                                "CV واقعی گله",

                            data:
                                cvHistory,

                            borderWidth:
                                3,

                            pointRadius:
                                5,

                            fill:
                                false,

                            tension:
                                0.3

                        },


                        {

                            label:
                                "استاندارد Ross 308",

                            data:
                                standardCV,

                            borderWidth:
                                2,

                            borderDash:
                                [8, 5],

                            fill:
                                false,

                            tension:
                                0.3

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        true,

                    plugins: {

                        legend: {

                            display:
                                true

                        }

                    },

                    scales: {

                        y: {

                            beginAtZero:
                                true,

                            title: {

                                display:
                                    true,

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
   اجرای اولیه
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        showUser();

        loadData();

    }
);


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
   ذخیره هنگام تغییر Select
   ========================================================= */

document.addEventListener(
    "change",
    function () {

        saveData();

    }
);
