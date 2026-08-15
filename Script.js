let weightChart = null;
let trendChart = null;
let cvChart = null;


const rossAge = [
7,14,21,28,35,42,49,56
];


const rossWeight = [
190,490,900,1400,1950,2500,3050,3600
];


const rossCV = [
13,12,11,10,9,8,7,6
];


function parseWeights(text){

return String(text || "")

.replace(/[۰-۹]/g,function(x){

return "۰۱۲۳۴۵۶۷۸۹".indexOf(x);

})

.replace(/[٠-٩]/g,function(x){

return "٠١٢٣٤٥٦٧٨٩".indexOf(x);

})

.replace(/،/g,",")

.split(/[\s,;]+/)

.map(Number)

.filter(function(x){

return Number.isFinite(x) && x > 0;

});

}


function average(arr){

return arr.reduce(function(sum,x){

return sum+x;

},0)/arr.length;

}


function sampleSD(arr,mean){

if(arr.length<2){

return 0;

}

return Math.sqrt(

arr.reduce(function(sum,x){

return sum+Math.pow(x-mean,2);

},0)/(arr.length-1)

);

}


function uniformity(arr,mean,p){

const low=mean*(1-p);

const high=mean*(1+p);

return arr.filter(function(x){

return x>=low && x<=high;

}).length/arr.length*100;

}


function setText(id,value){

const el=document.getElementById(id);

if(el){

el.textContent=value;

}

}


function calculate(){

const input=document.getElementById("weightsInput");

const weights=parseWeights(

input ? input.value : ""

);


if(weights.length<2){

alert("حداقل دو وزن وارد کنید.");

return;

}


const mean=average(weights);

const sd=sampleSD(weights,mean);

const cv=mean ? (sd/mean)*100 : 0;

const u10=uniformity(weights,mean,0.10);

const u15=uniformity(weights,mean,0.15);


setText(
"sample",
fmt(weights.length,0)
);


setText(
"mean",
fmt(mean,1)
);


setText(
"min",
fmt(Math.min(...weights),1)
);


setText(
"max",
fmt(Math.max(...weights),1)
);


setText(
"sd",
fmt(sd,1)
);


setText(
"cv",
fmt(cv,2)+"%"
);


setText(
"u10",
fmt(u10,1)+"%"
);


setText(
"u15",
fmt(u15,1)+"%"
);


const flock=selectedFlock();


const age=num(

document.getElementById("age")?.value

);


const date=

document.getElementById("date")?.value ||

todayISO();


if(requireUser()){

addRecord(

"weights",

{

flockId:flock?.id || "",

farm:flock?.farm || "",

hall:flock?.hall || "",

date:date,

age:age || null,

weights:weights,

mean:mean,

sd:sd,

cv:cv,

u10:u10,

u15:u15

}

);

}


drawWeight(weights);

drawTrend();

drawCV();

}


function drawWeight(data){

const canvas=document.getElementById("weightChart");


if(!canvas || typeof Chart==="undefined"){

return;

}


if(weightChart){

weightChart.destroy();

}


weightChart=new Chart(

canvas,

{

type:"bar",

data:{

labels:data.map(function(x,i){

return "نمونه "+(i+1);

}),

datasets:[

{

label:"وزن",

data:data,

borderWidth:1

}

]

},

options:{

responsive:true,

maintainAspectRatio:false

}

}

);

}


function nearest(age,arr){

let index=0;

let distance=Infinity;


rossAge.forEach(function(x,i){

const d=Math.abs(x-age);


if(d<distance){

distance=d;

index=i;

}

});


return arr[index];

}


function drawTrend(){

const canvas=

document.getElementById("weightTrendChart");


if(!canvas || typeof Chart==="undefined"){

return;

}


if(trendChart){

trendChart.destroy();

}


const flock=selectedFlock();


const history=

read("weights",[])

.filter(function(x){

return !flock || x.flockId===flock.id;

})

.slice(-12);


trendChart=new Chart(

canvas,

{

type:"line",

data:{

labels:history.map(function(x){

return `${x.age ?? "-"} روز`;

}),

datasets:[

{

label:"میانگین واقعی",

data:history.map(function(x){

return x.mean;

}),

borderWidth:3,

tension:.25

},

{

label:"Ross 308 — مرجع ثبت‌شده",

data:history.map(function(x){

return nearest(

x.age || 7,

rossWeight

);

}),

borderWidth:2,

borderDash:[8,5],

tension:.25

}

]

},

options:{

responsive:true,

maintainAspectRatio:false

}

}

);

}


function drawCV(){

const canvas=document.getElementById("cvChart");


if(!canvas || typeof Chart==="undefined"){

return;

}


if(cvChart){

cvChart.destroy();

}


const flock=selectedFlock();


const history=

read("weights",[])

.filter(function(x){

return !flock || x.flockId===flock.id;

})

.slice(-12);


cvChart=new Chart(

canvas,

{

type:"line",

data:{

labels:history.map(function(x){

return `${x.age ?? "-"} روز`;

}),

datasets:[

{

label:"CV واقعی",

data:history.map(function(x){

return x.cv;

}),

borderWidth:3,

tension:.25

},

{

label:"CV مرجع ثبت‌شده",

data:history.map(function(x){

return nearest(

x.age || 7,

rossCV

);

}),

borderWidth:2,

borderDash:[8,5],

tension:.25

}

]

},

options:{

responsive:true,

maintainAspectRatio:false,

scales:{

y:{

beginAtZero:true

}

}

}

}

);

}


function loadPanel(){

const flock=selectedFlock();


const history=

read("weights",[])

.filter(function(x){

return !flock || x.flockId===flock.id;

});


const latest=

history[history.length-1];


document.querySelectorAll(

"[data-flock-name]"

).forEach(function(el){

el.textContent=

flock

? `${flock.farm} / ${flock.hall}`

: "گله‌ای انتخاب نشده";

});


if(latest){

setText(
"sample",
fmt(latest.weights.length,0)
);

setText(
"mean",
fmt(latest.mean,1)
);

setText(
"min",
fmt(Math.min(...latest.weights),1)
);

setText(
"max",
fmt(Math.max(...latest.weights),1)
);

setText(
"sd",
fmt(latest.sd,1)
);

setText(
"cv",
fmt(latest.cv,2)+"%"
);

setText(
"u10",
fmt(latest.u10,1)+"%"
);

setText(
"u15",
fmt(latest.u15,1)+"%"
);

drawWeight(latest.weights);

}


drawTrend();

drawCV();

}


document.addEventListener(

"DOMContentLoaded",

function(){

const date=document.getElementById("date");

if(date){

date.value=todayISO();

}

loadPanel();

}

);
