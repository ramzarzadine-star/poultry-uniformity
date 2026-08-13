let weightChart;
let cvChart;



function convertPersianNumbers(str){

return str.replace(/[۰-۹]/g,function(d){

return "۰۱۲۳۴۵۶۷۸۹".indexOf(d);

});

}





function parseWeights(text){


text = convertPersianNumbers(text);


return text

.replace(/،/g,",")

.split(/[\n,\s;]+/)

.map(Number)

.filter(x=>Number.isFinite(x) && x>0);



}





function average(arr){

return arr.reduce((a,b)=>a+b,0)/arr.length;

}





function standardDeviation(arr,mean){


let sum = arr.reduce(

(a,b)=>a+Math.pow(b-mean,2),

0

);


return Math.sqrt(sum/(arr.length-1));


}





function calculateUniformity(arr,mean,percent){


let min = mean*(1-percent);

let max = mean*(1+percent);



let good = arr.filter(

x=>x>=min && x<=max

);



return (good.length/arr.length)*100;


}





function calculate(){


let weights=parseWeights(

document.getElementById("weightsInput").value

);



if(weights.length<2){

alert("حداقل دو وزن وارد کنید");

return;

}



let mean=average(weights);


let sd=standardDeviation(

weights,

mean

);



let cv=(sd/mean)*100;



let u10=calculateUniformity(

weights,

mean,

0.10

);



let u15=calculateUniformity(

weights,

mean,

0.15

);



let min=Math.min(...weights);


let max=Math.max(...weights);




document.getElementById("count").innerHTML=

weights.length;



document.getElementById("mean").innerHTML=

mean.toFixed(1);



document.getElementById("min").innerHTML=

min.toFixed(0);



document.getElementById("max").innerHTML=

max.toFixed(0);



document.getElementById("sd").innerHTML=

sd.toFixed(1);



document.getElementById("cv").innerHTML=

cv.toFixed(2)+" %";



document.getElementById("u10").innerHTML=

u10.toFixed(1)+" %";



document.getElementById("u15").innerHTML=

u15.toFixed(1)+" %";



drawWeightChart(weights);


drawCVChart(cv);



}







function drawWeightChart(weights){


let ctx=document
.getElementById("weightChart")
.getContext("2d");



if(weightChart){

weightChart.destroy();

}



weightChart=new Chart(ctx,{

type:"bar",

data:{

labels:weights.map(

(x,i)=>"مرغ "+(i+1)

),

datasets:[{

label:"وزن (گرم)",

data:weights

}]

},


options:{

responsive:true,

}

});


}







function drawCVChart(cv){


let ctx=document
.getElementById("cvChart")
.getContext("2d");



if(cvChart){

cvChart.destroy();

}



cvChart=new Chart(ctx,{

type:"doughnut",

data:{

labels:[

"CV",

"باقی مانده"

],


datasets:[{

data:[

cv,

100-cv

]

}]

},


options:{

responsive:true

}


});


}
