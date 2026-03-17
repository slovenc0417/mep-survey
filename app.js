// VERSION 4.3 — HVAC EQUIPMENT SYSTEM

const disciplines = [
"Walk Site","Electrical","HVAC","Cold Water",
"Sanitary","Gas","Storm","Fire Alarm","Controls"
];

let surveys = JSON.parse(localStorage.getItem("surveyManagerV43") || "[]");
let activeSurveyId = localStorage.getItem("activeSurveyIdV43");

function saveAll(){
localStorage.setItem("surveyManagerV43", JSON.stringify(surveys));
localStorage.setItem("activeSurveyIdV43", activeSurveyId);
}

const stateMap = {
OH:"OH",OHIO:"OH",
VA:"VA",VIRGINIA:"VA",
MD:"MD",MARYLAND:"MD",
DC:"DC","DISTRICT OF COLUMBIA":"DC"
};

function normalizeState(v){
let t=(v||"").toUpperCase().trim();
return stateMap[t]||t;
}

function wordToNumber(str){
str=(str||"").toLowerCase().trim();
const map={
zero:0,one:1,two:2,three:3,four:4,five:5,
six:6,seven:7,eight:8,nine:9,ten:10,
eleven:11,twelve:12,thirteen:13,fourteen:14,
fifteen:15,sixteen:16,seventeen:17,eighteen:18,
nineteen:19,twenty:20,thirty:30,forty:40,
fifty:50,sixty:60,seventy:70,eighty:80,ninety:90
};
if(!isNaN(str)) return str;
let parts=str.split(" ");
let total=0;
parts.forEach(p=>{ if(map[p]!=null) total+=map[p]; });
return total? total.toString():str.toUpperCase();
}

function prefixMark(mark,type){
mark=(mark||"").toUpperCase().replace(/\s+/g,'');
if(mark.startsWith(type+"-")) return mark;
if(mark.startsWith("RTU-")||mark.startsWith("AHU-")) return mark;
return type+"-"+mark;
}

function headerTitle(s){
if(!s) return "MEP Survey";
return `MEP Survey - ${s.meta.client} - ${s.meta.city}`;
}

function statusIcon(s){
if(s=="Complete") return "✔";
if(s=="In Progress") return "●";
if(s=="N/A") return "N/A";
return "○";
}

function homeScreen(){
let html=`<div class="header">MEP Survey</div><div class="container">`;

surveys.forEach(s=>{
let dim=s.archived?"style='opacity:.4'":"";
html+=`
<div class="card" ${dim} onclick="openSurvey('${s.id}')">
<b>${s.meta.client} - ${s.meta.city}</b><br>
${s.meta.date} &nbsp;&nbsp; ${statusIcon(overallStatus(s))}
</div>`;
});

html+=`<button onclick="newSurveyScreen()">+ Start New Survey</button></div>`;
app.innerHTML=html;
}

function overallStatus(s){
let done=Object.values(s.disc).filter(d=>d.status=="Complete").length;
if(done==0) return "Not Started";
if(done<disciplines.length) return "In Progress";
return "Complete";
}

function newSurveyScreen(){
app.innerHTML=`
<div class="header">MEP Survey</div>
<div class="container">
<div class="card">
<h3>New Survey</h3>

Client<input id="client">
Former Store<input id="store">
Address<input id="addr">
City<input id="city">
State<input id="state">
Date<input id="date">

<button onclick="createSurvey()">Create Survey</button>
<button onclick="homeScreen()">Back</button>
</div>
</div>`;

let d=new Date();
date.value=("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2)+"-"+d.getFullYear().toString().slice(-2);
}

function createSurvey(){
let id=Date.now().toString();

let survey={
id,
meta:{
client:client.value,
store:store.value,
addr:addr.value,
city:city.value,
state:normalizeState(state.value),
date:date.value
},
disc:{},
archived:false
};

disciplines.forEach(d=>{
survey.disc[d]={status:"Not Started",general:{},equip:[]};
});

surveys.push(survey);
activeSurveyId=id;
saveAll();
dashboard();
}

function getActive(){
return surveys.find(s=>s.id==activeSurveyId);
}

function openSurvey(id){
let s=surveys.find(x=>x.id==id);
activeSurveyId=id;
saveAll();
dashboard();
}

function dashboard(){
let s=getActive();
let html=`<div class="header">${headerTitle(s)}</div><div class="container">`;
html+=`<div class="card"><b>Date:</b> ${s.meta.date}</div>`;

disciplines.forEach(d=>{
let st=s.disc[d].status;
html+=`
<div class="card">
<b>${d}</b> (${statusIcon(st)})
<button onclick="openDisc('${d}')">Enter</button>
<button onclick="markNA('${d}')">N/A</button>
</div>`;
});

html+=`<button onclick="homeScreen()">Back To Surveys</button></div>`;
app.innerHTML=html;
saveAll();
}

function markNA(d){
getActive().disc[d].status="N/A";
dashboard();
}

function openDisc(d){
if(d=="HVAC") return hvacScreen();
app.innerHTML=`<div class="header">${headerTitle(getActive())}</div>
<div class="container"><div class="card">${d} - Feature not built yet
<button onclick="dashboard()">Back</button></div></div>`;
}

function smartSort(list){
return list.sort((a,b)=>{
let ma=a.mark.split("-")[1]||"";
let mb=b.mark.split("-")[1]||"";

let na=parseInt(ma);
let nb=parseInt(mb);

if(!isNaN(na)&&!isNaN(nb)) return na-nb;
if(!isNaN(na)) return -1;
if(!isNaN(nb)) return 1;

return ma.localeCompare(mb);
});
}

function hvacScreen(){

let s=getActive();
let all=s.disc["HVAC"].equip;

let rtus=smartSort(all.filter(e=>e.type=="RTU"));
let ahus=smartSort(all.filter(e=>e.type=="AHU"));

let html=`<div class="header">${headerTitle(s)}</div><div class="container">`;

html+=`
<div class="card"><b>RTUs</b><br>Quantity: ${rtus.length}<br><br>`;
rtus.forEach((r,i)=>{
let idx=all.indexOf(r);
html+=`${r.mark} <button onclick="editEquip(${idx})">Edit</button>
<button onclick="deleteEquip(${idx})">Delete</button><br>`;
});
html+=`<button onclick="addEquip('RTU')">+ Add RTU</button></div>`;

html+=`
<div class="card"><b>AHUs</b><br>Quantity: ${ahus.length}<br><br>`;
ahus.forEach((r,i)=>{
let idx=all.indexOf(r);
html+=`${r.mark} <button onclick="editEquip(${idx})">Edit</button>
<button onclick="deleteEquip(${idx})">Delete</button><br>`;
});
html+=`<button onclick="addEquip('AHU')">+ Add AHU</button></div>`;

html+=`<button onclick="completeHVAC()">Mark HVAC Complete</button>
<button onclick="dashboard()">Back</button></div>`;

app.innerHTML=html;

s.disc["HVAC"].status="In Progress";
saveAll();
}

let editingIndex=null;
let equipType="RTU";

function addEquip(type){
editingIndex=null;
equipType=type;
renderEquipForm({});
}

function editEquip(i){
editingIndex=i;
let r=getActive().disc["HVAC"].equip[i];
equipType=r.type;
renderEquipForm(r);
}

function renderEquipForm(r){
app.innerHTML=`
<div class="header">${headerTitle(getActive())}</div>
<div class="container">
<div class="card">

<b>Mark</b><input id="mark" value="${r.mark?r.mark.split('-')[1]:""}">
<b>Make</b><input id="make" value="${r.make||""}">
<b>Model</b><input id="model" value="${r.model||""}">
<b>Serial</b><input id="serial" value="${r.serial||""}">

<b>Voltage</b><br>
<label><input type="checkbox" id="v1" ${r.volt=="480V"?"checked":""}>480V</label><br>
<label><input type="checkbox" id="v2" ${r.volt=="208V"?"checked":""}>208V</label><br>
<label><input type="checkbox" id="v3" ${r.volt=="OTHER"?"checked":""}>Other</label>

<br><b>Heat</b><br>
<label><input type="checkbox" id="h1" ${r.heat=="Gas"?"checked":""}>Gas</label><br>
<label><input type="checkbox" id="h2" ${r.heat=="Electric"?"checked":""}>Electric</label><br>
<label><input type="checkbox" id="h3" ${r.heat=="Unknown"?"checked":""}>Unknown</label>

<br><b>Curb Type</b><br>
<label><input type="checkbox" id="c1" ${r.mount=="Standard Curb"?"checked":""}>Standard Curb</label><br>
<label><input type="checkbox" id="c2" ${r.mount=="Curb Adapter"?"checked":""}>Curb Adapter</label>

<br><b>Suitable for Re-use</b><br>
<label><input type="checkbox" id="r1" ${r.reuse=="Yes"?"checked":""}>Yes</label><br>
<label><input type="checkbox" id="r2" ${r.reuse=="No"?"checked":""}>No</label>

<br><b>Additional Notes</b>
<textarea id="notes">${r.notes||""}</textarea>

<button onclick="saveEquip()">Save</button>
<button onclick="hvacScreen()">Cancel</button>

</div></div>`;
}

function saveEquip(){

let s=getActive();

let volt=v1.checked?"480V":v2.checked?"208V":v3.checked?"OTHER":"";
let heat=h1.checked?"Gas":h2.checked?"Electric":h3.checked?"Unknown":"";
let curb=c1.checked?"Standard Curb":c2.checked?"Curb Adapter":"";
let reuse=r1.checked?"Yes":r2.checked?"No":"";

let rawMark=wordToNumber(mark.value);
let finalMark=prefixMark(rawMark,equipType);

let obj={
type:equipType,
mark:finalMark,
make:make.value.replace(/\s+/g,''),
model:model.value.replace(/\s+/g,''),
serial:serial.value.replace(/\s+/g,''),
volt,
heat,
mount:curb,
reuse,
notes:notes.value
};

if(editingIndex===null){
s.disc["HVAC"].equip.push(obj);
}else{
s.disc["HVAC"].equip[editingIndex]=obj;
}

saveAll();

app.innerHTML=`
<div class="header">${headerTitle(s)}</div>
<div class="container">
<div class="card">
Saved<br><br>
<button onclick="addEquip('${equipType}')">Add Another</button>
<button onclick="hvacScreen()">Back To List</button>
</div></div>`;
}

function deleteEquip(i){
if(!confirm("Delete "+getActive().disc["HVAC"].equip[i].mark+" ?")) return;
getActive().disc["HVAC"].equip.splice(i,1);
saveAll();
hvacScreen();
}

function completeHVAC(){
getActive().disc["HVAC"].status="Complete";
dashboard();
}

homeScreen();
