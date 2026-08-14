let weightChart;
let cvChart;
let weightTrendChart;


let cvHistory=[];
let weightHistory=[];
let ageHistory=[];



const rossAge=[7,14,21,28,35,42,49,56];

const rossWeight=[190,490,900,1400,1950,2500,3050,3600];

const rossCV=[13,12,11,10,9,8,7,6];





function persianNumber(str){

return str.replace(/[۰-۹]/g,function(x){

return "۰۱۲۳۴۵۶۷۸۹".indexOf(x);

});

}





function parseWeights(text){

text=persianNumber(text);


return text
.replace(/،/g,",")
.split(/[\s,]+/)
.map(Number)
.filter(x=>Number.isFinite(x)&&x>0);

}





function average(arr){

return arr.reduce((a,b)=>a+b,0)/arr.length;

}




function standard(arr,mean){

let sum=0;


arr.forEach(x=>{

sum+=Math.pow(x-mean,2);

});


return Math.sqrt(sum/(arr.length-1));

}





function uniformity(arr,mean,p){

let min=mean*(1-p);

let max=mean*(1+p);


return arr.filter(x=>x>=min&&x<=max).length/arr.length*100;

}







function calculate(){


let weights=parseWeights(

document.getElementById("weightsInput").value

);



if(weights.length<2){

alert("وزن وارد کنید");

return;

}



let mean=average(weights);

let sd=standard(weights,mean);

let cv=(sd/mean)*100;


let u10=uniformity(weights,mean,0.10);

let u15=uniformity(weights,mean,0.15);




document.getElementById("sample").innerHTML=weights.length;

document.getElementById("mean").innerHTML=mean.toFixed(1);

document.getElementById("min").innerHTML=Math.min(...weights);

document.getElementById("max").innerHTML=Math.max(...weights);

document.getElementById("sd").innerHTML=sd.toFixed(1);

document.getElementById("cv").innerHTML=cv.toFixed(2)+"%";

document.getElementById("u10").innerHTML=u10.toFixed(1)+"%";

document.getElementById("u15").innerHTML=u15.toFixed(1)+"%";



drawWeight(weights);



let age=document.getElementById("age").value;


if(age===""){

age=(ageHistory.length+1)*7;

}


cvHistory.push(Number(cv.toFixed(2)));

weightHistory.push(Number(mean.toFixed(1)));

ageHistory.push(Number(age));



drawCV();

drawWeightTrend();


}







function drawWeight(data){


if(weightChart){

weightChart.destroy();

}



weightChart=new Chart(

document.getElementById("weightChart"),

{

type:"line",

data:{

labels:data.map((x,i)=>"نمونه "+(i+1)),

datasets:[{

label:"وزن واقعی",

data:data,

borderWidth:3,

fill:false,

tension:.3

}]

}

}

);


}








function drawWeightTrend(){


if(weightTrendChart){

weightTrendChart.destroy();

}



weightTrendChart=new Chart(

document.getElementById("weightTrendChart"),

{

type:"line",

data:{

labels:rossAge.map(x=>x+" روز"),

datasets:[

{

label:"وزن واقعی گله",

data:weightHistory,

borderWidth:3,

fill:false,

tension:.3

},

{

label:"استاندارد Ross 308",

data:rossWeight,

borderWidth:3,

borderDash:[10,5],

fill:false,

tension:.3

}

]

}

}

);


}







function drawCV(){


if(cvChart){

cvChart.destroy();

}



cvChart=new Chart(

document.getElementById("cvChart"),

{

type:"line",

data:{

labels:rossAge.map(x=>x+" روز"),

datasets:[

{

label:"CV واقعی گله",

data:cvHistory,

borderWidth:3,

fill:false,

tension:.3

},

{

label:"استاندارد Ross 308",

data:rossCV,

borderWidth:3,

borderDash:[10,5],

fill:false,

tension:.3

}

]

}

}

);


}
alert("مرکز تخصصی طیور دکتر آدینه");
