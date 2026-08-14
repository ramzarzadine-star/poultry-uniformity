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



function calculateSD(a,m){

let sum=0;

for(let i=0;i<a.length;i++){

sum += Math.pow(a[i]-m,2);

}

return Math.sqrt(sum/(a.length-1));

}




function uniformity(a,m,p){

let min=m*(1-p);

let max=m*(1+p);


return a.filter(

x=>x>=min&&x<=max

).length/a.length*100;

}





function calculate(){


let input=document.getElementById("weightsInput").value;


let weights=parseWeights(input);



if(weights.length<2){

alert("حداقل دو وزن وارد کنید");

return;

}



let mean=avg(weights);


let deviation=calculateSD(weights,mean);


let cv=(deviation/mean)*100;


let u10=uniformity(weights,mean,0.10);


let u15=uniformity(weights,mean,0.15);



document.getElementById("count").innerHTML=weights.length;

document.getElementById("mean").innerHTML=mean.toFixed(1);

document.getElementById("min").innerHTML=Math.min.apply(null,weights);

document.getElementById("max").innerHTML=Math.max.apply(null,weights);

document.getElementById("sd").innerHTML=deviation.toFixed(1);

document.getElementById("cv").innerHTML=cv.toFixed(2)+"%";

document.getElementById("u10").innerHTML=u10.toFixed(1)+"%";

document.getElementById("u15").innerHTML=u15.toFixed(1)+"%";


drawUniformity(weights,mean);

drawCV(cv);
}


function drawCV(value){


if(cvChart){

cvChart.destroy();

}



cvChart = new Chart(

document.getElementById("cvChart"),

{

type:"line",

data:{

labels:["گله"],

datasets:[{

label:"CV (%)",

data:[value],

borderWidth:3,

fill:false,

tension:0.3

}]

},


options:{

responsive:true,

scales:{

y:{

beginAtZero:true,

title:{

display:true,

text:"درصد CV"

}

}

}

}

}

);


}

function drawUniformity(data,mean){


if(weightChart){

weightChart.destroy();

}



let value=uniformity(data,mean,0.10);



weightChart=new Chart(

document.getElementById("weightChart"),

{

type:"line",

data:{

labels:["گله"],

datasets:[{

label:"یکنواختی ±10%",

data:[value],

borderWidth:3,

fill:false,

tension:0.3

}]

},


options:{

responsive:true,

scales:{

y:{

beginAtZero:true,

max:100,

title:{

display:true,

text:"درصد یکنواختی"

}

}

}

}

}

);


}
