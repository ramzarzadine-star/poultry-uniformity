let weightChart;
let cvChart;


function persianToEnglish(str){

return str.replace(/[۰-۹]/g,function(x){

return "۰۱۲۳۴۵۶۷۸۹".indexOf(x);

});

}



function parseWeights(text){

text=persianToEnglish(text);


return text

.replace(/،/g,",")

.split(/[\s,]+/)

.map(Number)

.filter(x=>Number.isFinite(x));


}



function avg(a){

return a.reduce((x,y)=>x+y,0)/a.length;

}



function sd(a,m){

return Math.sqrt(

a.reduce((s,x)=>s+Math.pow(x-m,2),0)/(a.length-1)

);

}




function uniformity(a,m,p){

let min=m*(1-p);

let max=m*(1+p);


return a.filter(

x=>x>=min&&x<=max

).length/a.length*100;

}





function calculate(){


let weights=parseWeights(

document.getElementById("weightsInput").value

);



if(weights.length<2){

alert("وزن وارد کنید");

return;

}



let mean=avg(weights);


let deviation=sd(weights,mean);


let cv=deviation/mean*100;


let u10=uniformity(weights,mean,.10);


let u15=uniformity(weights,mean,.15);




document.getElementById("count").innerHTML=weights.length;

document.getElementById("mean").innerHTML=mean.toFixed(1);

document.getElementById("min").innerHTML=Math.min(...weights);

document.getElementById("max").innerHTML=Math.max(...weights);

document.getElementById("sd").innerHTML=deviation.toFixed(1);

document.getElementById("cv").innerHTML=cv.toFixed(2)+"%";

document.getElementById("u10").innerHTML=u10.toFixed(1)+"%";

document.getElementById("u15").innerHTML=u15.toFixed(1)+"%";



drawWeight(weights);

drawCV(cv);


}





function drawWeight(data){


if(weightChart)
weightChart.destroy();



weightChart=new Chart(

document.getElementById("weightChart"),

{

type:"bar",

data:{

labels:data.map((x,i)=>i+1),

datasets:[{

label:"وزن",

data:data

}]

}

}

);


}







function drawCV(value){


if(cvChart)
cvChart.destroy();



cvChart=new Chart(

document.getElementById("cvChart"),

{

type:"line",

data:{

labels:["CV"],

datasets:[{

label:"درصد CV",

data:[value],

fill:false,

tension:.3

}]

}

}

);


}
