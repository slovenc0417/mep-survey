const DISCIPLINES=[
"Walk Site","Electrical","HVAC","Cold Water",
"Sanitary","Gas","Storm","Fire Alarm","Controls"
];

let surveys=JSON.parse(localStorage.getItem("mep_surveys_v1")||"[]");
let activeId=localStorage.getItem("mep_active_v1");

function saveAll(){
localStorage.setItem("mep_surveys_v1",JSON.stringify(surveys));
localStorage.setItem("mep_active_v1",activeId);
}

function titleCase(t){
return (t||"").toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
}

function cleanMS(v){

v=(v||"").toLowerCase();

const words={
zero:"0",one:"1",two:"2",three:"3",four:"4",
five:"5",six:"6",seven:"7",eight:"8",nine:"9",
ten:"10",eleven:"11",twelve:"12",thirteen:"13",
fourteen:"14",fifteen:"15",sixteen:"16",
seventeen:"17",eighteen:"18",nineteen:"19",
twenty:"20",thirty:"30",forty:"40",fifty:"50",
sixty:"60",seventy:"70",eighty:"80",ninety:"90"
};

v=v.replace(/[,-]/g," ");

let parts=v.split(/\s+/);

let out="";

parts.forEach(p=>{
if(words[p]!=null){
out+=words[p];
}else{
out+=p;
}
});

return out.toUpperCase();
}

function wordNum(v){
const m={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,
eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16};
v=(v||"").toLowerCase().trim();
return m[v]||v.toUpperCase();
}

function normMark(v,type){
let t=wordNum(v).toString().replace(/\s+/g,"");
return t?`${type}-${t}`:"";
}

function normalizeState(v){
v=(v||"").toUpperCase().replace(/[^A-Z]/g,"");
const map={
ALABAMA:"AL",ALASKA:"AK",ARIZONA:"AZ",ARKANSAS:"AR",
CALIFORNIA:"CA",COLORADO:"CO",CONNECTICUT:"CT",
DELAWARE:"DE",FLORIDA:"FL",GEORGIA:"GA",
HAWAII:"HI",IDAHO:"ID",ILLINOIS:"IL",INDIANA:"IN",
IOWA:"IA",KANSAS:"KS",KENTUCKY:"KY",LOUISIANA:"LA",
MAINE:"ME",MARYLAND:"MD",MASSACHUSETTS:"MA",
MICHIGAN:"MI",MINNESOTA:"MN",MISSISSIPPI:"MS",
MISSOURI:"MO",MONTANA:"MT",NEBRASKA:"NE",
NEVADA:"NV","NEWHAMPSHIRE":"NH","NEWJERSEY":"NJ",
"NEWMEXICO":"NM","NEWYORK":"NY","NORTHCAROLINA":"NC",
"NORTHDAKOTA":"ND",OHIO:"OH",OKLAHOMA:"OK",
OREGON:"OR",PENNSYLVANIA:"PA","RHODEISLAND":"RI",
"SOUTHCAROLINA":"SC","SOUTHDAKOTA":"SD",
TENNESSEE:"TN",TEXAS:"TX",UTAH:"UT",VERMONT:"VT",
VIRGINIA:"VA",WASHINGTON:"WA","WESTVIRGINIA":"WV",
WISCONSIN:"WI",WYOMING:"WY",
DC:"DC","DISTRICTOFCOLUMBIA":"DC"
};
if(map[v]) return map[v];
if(v.length===2) return v;
return v;
}

function getActive(){
return surveys.find(s=>s.id==activeId);
}

function home(){
let html=`<div class="header">MEP Field Survey</div><div class="container">`;
surveys.forEach(s=>{
html+=`<div class="card" onclick="openSurvey('${s.id}')">
<b>${s.client} – ${s.city}</b><br>
<span class="badge">${s.date||""}</span>
</div>`;
});
html+=`<button onclick="newSurvey()">Start New Survey</button></div>`;
app.innerHTML=html;
}

function newSurvey(){
app.innerHTML=`<div class="header">New Survey</div><div class="container"><div class="card">

Client<input id="c">
er Store<input id="fs">
Address<input id="ad">
City<input id="ci">
State<input id="st">
Date<input id="dt">

<button onclick="createSurvey()">Create Survey</button>
<button onclick="home()">Back</button>

</div></div>`;
let d=new Date();
dt.value=("0"+(d.getMonth()+1)).slice(-2)+"/"+("0"+d.getDate()).slice(-2)+"/"+d.getFullYear().toString().slice(-2);
}

function createSurvey(){
let id=Date.now().toString();
let survey={
id,
client:titleCase(c.value),
store:titleCase(fs.value),
address:ad.value,
city:titleCase(ci.value),
state:normalizeState(st.value),
date:dt.value,
disc:{}
};
DISCIPLINES.forEach(d=>survey.disc[d]={equip:[],general:{}});
surveys.push(survey);
activeId=id;
saveAll();
dashboard();
}

function openSurvey(id){activeId=id;saveAll();dashboard();}

function dashboard(){
let s=getActive();
let html=`<div class="header">MEP Survey – ${s.client} – ${s.city}</div><div class="container">`;

html+=`<div class="card"><b>General Ination</b><br>
${s.address||""}<br>
${s.city||""}, ${s.state||""}<br>
${s.date||""}
</div>`;

DISCIPLINES.forEach(d=>{
html+=`<div class="card"><b>${d}</b>
<button onclick="openDisc('${d}')">Enter</button></div>`;
});

html+=`<button onclick="exportJSON()">Export Survey</button>
<button onclick="home()">Back</button></div>`;
app.innerHTML=html;
}

function openDisc(d){
if(d!=="HVAC"){alert("Section not built yet.");return;}
hvacScreen();
}

function sortEquip(list){
return list.sort((a,b)=>{
let ma=a.mark.split("-")[1]||"";
let mb=b.mark.split("-")[1]||"";
let na=parseInt(ma),nb=parseInt(mb);
if(!isNaN(na)&&!isNaN(nb)) return na-nb;
if(!isNaN(na)) return -1;
if(!isNaN(nb)) return 1;
return ma.localeCompare(mb);
});
}

let editIndex=null,eqType="RTU";

function hvacScreen(){
let s=getActive();
let all=s.disc.HVAC.equip;
let rtus=sortEquip(all.filter(e=>e.type==="RTU"));
let ahus=sortEquip(all.filter(e=>e.type==="AHU"));

let html=`<div class="header">HVAC</div><div class="container">`;

html+=`<div class="card"><b>RTUs</b><br>Quantity: ${rtus.length}<br>`;
rtus.forEach(r=>{
let i=all.indexOf(r);
html+=`<div class="eqItem">${r.mark}
<button onclick="editEquip(${i})">Edit</button>
<button onclick="deleteEquip(${i})">Delete</button>
</div>`;
});
html+=`<button onclick="addEquip('RTU')">+ Add RTU</button></div>`;

html+=`<div class="card"><b>AHUs</b><br>Quantity: ${ahus.length}<br>`;
ahus.forEach(r=>{
let i=all.indexOf(r);
html+=`<div class="eqItem">${r.mark}
<button onclick="editEquip(${i})">Edit</button>
<button onclick="deleteEquip(${i})">Delete</button>
</div>`;
});
html+=`<button onclick="addEquip('AHU')">+ Add AHU</button></div>`;

html+=`<button onclick="dashboard()">Back</button></div>`;
app.innerHTML=html;
}

function addEquip(t){editIndex=null;eqType=t;equipForm({});}

function editEquip(i){
editIndex=i;
let r=getActive().disc.HVAC.equip[i];
eqType=r.type;
equipForm(r);
}

function equipForm(r){
app.innerHTML=`<div class="header">${eqType}</div><div class="container"><div class="card" style="display:flex;flex-direction:column;">

<b>Mark</b>
<input id="mark" value="${r.mark?r.mark.split("-")[1]:""}">

<b>Make</b>
<input id="make" value="${r.make||""}">

<b>Model</b>
<input id="model" value="${r.model||""}">

<b>Serial</b>
<input id="serial" value="${r.serial||""}">

<b>Voltage</b>
<label class="checkrow">
<input type="checkbox" id="v1" ${r.volt=="480V"?"checked":""}>480V
</label>

<label class="checkrow">
<input type="checkbox" id="v2" ${r.volt=="208V"?"checked":""}>208V
</label>

<label class="checkrow">
<input type="checkbox" id="v3" ${r.volt=="Other"?"checked":""}>Other
</label>

<b>Heat</b>
<label class="checkrow">
<input type="checkbox" id="h1" ${r.heat=="Gas"?"checked":""}>Gas
</label>

<label class="checkrow">
<input type="checkbox" id="h2" ${r.heat=="Electric"?"checked":""}>Electric
</label>

<label class="checkrow">
<input type="checkbox" id="h3" ${r.heat=="Unknown"?"checked":""}>Unknown
</label>

<b>Curb Type</b>
<label class="checkrow">
<input type="checkbox" id="c1" ${r.mount=="Standard"?"checked":""}>Standard
</label>

<label class="checkrow">
<input type="checkbox" id="c2" ${r.mount=="CurbAdapter"?"checked":""}>Curb Adapter
</label>

<b>Suitable for Re-use</b>
<label class="checkrow">
<input type="checkbox" id="r1" ${r.reuse=="Yes"?"checked":""}>Yes
</label>

<label class="checkrow">
<input type="checkbox" id="r2" ${r.reuse=="No"?"checked":""}>No
</label>

<b>Notes</b>
<textarea id="notes">${r.notes||""}</textarea>

<button onclick="saveEquip()">Save</button>
<button onclick="hvacScreen()">Cancel</button>

</div></div>`;
}

function saveEquip(){
let s=getActive();
let obj={
type:eqType,
mark:normMark(mark.value,eqType),
make:make.value,
model:cleanMS(model.value),
serial:cleanMS(serial.value),
volt:v1.checked?"480V":v2.checked?"208V":v3.checked?"Other":"",
heat:h1.checked?"Gas":h2.checked?"Electric":h3.checked?"Unknown":"",
mount:c1.checked?"Standard":c2.checked?"CurbAdapter":"",
reuse:r1.checked?"Yes":r2.checked?"No":"",
notes:notes.value
};
if(editIndex===null)s.disc.HVAC.equip.push(obj);
else s.disc.HVAC.equip[editIndex]=obj;
saveAll();
hvacScreen();
}

function deleteEquip(i){
if(!confirm("Delete equipment?"))return;
getActive().disc.HVAC.equip.splice(i,1);
saveAll();
hvacScreen();
}

function exportJSON(){
let data=JSON.stringify(getActive(),null,2);
let blob=new Blob([data],{type:"application/json"});
let a=document.createElement("a");
a.href=URL.createObjectURL(blob);
a.download="survey_export.json";
a.click();
}

home();
