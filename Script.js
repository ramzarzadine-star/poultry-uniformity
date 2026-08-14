let weightChart;
let cvChart;



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

let low=mean*(1-p);

let high=mean*(1+p);


return arr.filter(x=>x>=low&&x<=high).length/arr.length*100;

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


let u10=uniformity(weights,mean,.1);


let u15=uniformity(weights,mean,.15);




document.getElementById("sample").innerHTML=weights.length;


document.getElementById("mean").innerHTML=mean.toFixed(1);


document.getElementById("min").innerHTML=Math.min(...weights);


document.getElementById("max").innerHTML=Math.max(...weights);


document.getElementById("sd").innerHTML=sd.toFixed(1);


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

type:"line",

data:{

labels:data.map((x,i)=>"جوجه "+(i+1)),

datasets:[{

label:"وزن",

data:data,

borderWidth:3,

fill:false,

tension:.3

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

label:"CV درصد",

data:[value],

borderWidth:3,

fill:false,

tension:.3

}]

},


options:{

scales:{

y:{

beginAtZero:true

}

}

}

}

);


}
function drawCV(value){


if(cvChart){

cvChart.destroy();

}



let ctx=document.getElementById("cvChart");


if(!ctx){

return;

}



cvChart=new Chart(ctx,{

type:"line",

data:{

labels:["نتیجه فعلی"],


datasets:[{

label:"CV (%)",

data:[Number(value.toFixed(2))],

borderColor:"#006b3c",

backgroundColor:"#006b3c",

borderWidth:3,

pointRadius:6,

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


});


}
