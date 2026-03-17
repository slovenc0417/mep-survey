const disciplines=[
"Walk Site","Electrical","HVAC","Cold Water",
"Sanitary","Gas","Storm","Fire Alarm","Controls"
];

let surveys=JSON.parse(localStorage.getItem("surveyManagerV44")||"[]");
let activeSurveyId=localStorage.getItem("activeSurveyIdV44");

function saveAll(){
localStorage.setItem("surveyManagerV44",JSON.stringify(surveys));
localStorage.setItem("activeSurveyIdV44",activeSurveyId);
}

function titleCase(str){
return (str||"").toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
}

function normalizeState(v){
let t=(v||"").toUpperCase();

t=t.replace(/\s+/g,'').trim();

const map={
OH:"OH",OHIO:"OH",
VA:"VA",VIRGINIA:"VA",
MD:"MD",MARYLAND:"MD",
DC:"DC",
DISTRICTOFCOLUMBIA:"DC",
PENNSYLVANIA:"PA",PA:"PA",
NEWYORK:"NY",NY:"NY"
};

return map[t] || t.substring(0,2);
}

function forceTitleCaseInput(id){
let el=document.getElementById(id);
el.addEventListener("blur",()=>{
el.value=(el.value||"")
.toLowerCase()
.replace(/\b\w/g,c=>c.toUpperCase());
});
}

function wordToNumber(str){
str=(str||"").toLowerCase().trim();
const map={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,
eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,
nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90};
if(!isNaN(str)) return str;
let total=0;
str.split(" ").forEach(p=>{ if(map[p]!=null) total+=map[p]; });
return total?total.toString():str.toUpperCase();
}

function clean(v){ return (v||"").replace(/\s+/g,'').toUpperCase(); }

function normalizeMark(v,type){
let t=(v||"").toUpperCase();
t=t.replace("RTU","").replace("AHU","").replace("-","");
t=wordToNumber(t);
t=t.replace(/\s+/g,'');
if(!t) return "";
return type+"-"+t;
}

function exclusive(id,group){
group.forEach(g=>{
if(g!==id) document.getElementById(g).checked=false;
});
}

function headerTitle(s){
if(!s) return "MEP Survey";
return `MEP Survey - ${s.meta.client} - ${s.meta.city}`;
}

function homeScreen(){
let html=`<div class="header">MEP Survey</div><div class="container">`;
surveys.forEach(s=>{
html+=`<div class="card" onclick="openSurvey('${s.id}')">
<b>${s.meta.client} - ${s.meta.city}</b><br>${s.meta.date}</div>`;
});
html+=`<button onclick="newSurvey()">+ Start New Survey</button></div>`;
app.innerHTML=html;
}

function newSurvey(){
app.innerHTML=`<div class="header">MEP Survey</div><div class="container"><div class="card">
Client<input id="client">
Former Store<input id="store" onfocus="forceTitleCaseInput('store')">
Address<input id="addr">
City<input id="city">
State<input id="state" onblur="this.value=normalizeState(this.value)">
Date<input id="date">
<button onclick="createSurvey()">Create</button>
<button onclick="homeScreen()">Back</button>
</div></div>`;
let d=new Date();
date.value=("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2)+"-"+d.getFullYear().toString().slice(-2);
}

function createSurvey(){
let id=Date.now().toString();
let survey={
id,
meta:{
client:titleCase(client.value),
store:titleCase(store.value),
addr:addr.value,
city:city.value,
state:normalizeState(state.value),
date:date.value
},
disc:{HVAC:{status:"Not Started",equip:[]}}
};
surveys.push(survey);
activeSurveyId=id;
saveAll();
dashboard();
}

function getActive(){ return surveys.find(s=>s.id==activeSurveyId); }

function openSurvey(id){ activeSurveyId=id; saveAll(); dashboard(); }

function dashboard(){
let s=getActive();
let html=`<div class="header">${headerTitle(s)}</div><div class="container">
<div class="card"><b>Date:</b> ${s.meta.date}</div>
<div class="card"><b>HVAC</b><button onclick="hvac()">Enter</button></div>
<button onclick="homeScreen()">Back</button></div>`;
app.innerHTML=html;
}

function sortEquip(list){
return list.sort((a,b)=>{
let ma=a.mark.split("-")[1]||"";
let mb=b.mark.split("-")[1]||"";
let na=parseInt(ma), nb=parseInt(mb);
if(!isNaN(na)&&!isNaN(nb)) return na-nb;
if(!isNaN(na)) return -1;
if(!isNaN(nb)) return 1;
return ma.localeCompare(mb);
});
}

function hvac(){
let s=getActive();
let all=s.disc.HVAC.equip;
let rtus=sortEquip(all.filter(e=>e.type=="RTU"));
let ahus=sortEquip(all.filter(e=>e.type=="AHU"));

let html=`<div class="header">${headerTitle(s)}</div><div class="container">`;

html+=`<div class="card"><b>RTUs</b><br>Quantity: ${rtus.length}<br>`;
rtus.forEach(r=>{
let i=all.indexOf(r);
html+=`${r.mark} <button onclick="edit(${i})">Edit</button>
<button onclick="del(${i})">Delete</button><br>`;
});
html+=`<button onclick="add('RTU')">+ Add RTU</button></div>`;

html+=`<div class="card"><b>AHUs</b><br>Quantity: ${ahus.length}<br>`;
ahus.forEach(r=>{
let i=all.indexOf(r);
html+=`${r.mark} <button onclick="edit(${i})">Edit</button>
<button onclick="del(${i})">Delete</button><br>`;
});
html+=`<button onclick="add('AHU')">+ Add AHU</button></div>`;

html+=`<button onclick="dashboard()">Back</button></div>`;
app.innerHTML=html;
}

let editIndex=null, eqType="RTU";

function add(t){ editIndex=null; eqType=t; form({}); }

function edit(i){ editIndex=i; let r=getActive().disc.HVAC.equip[i]; eqType=r.type; form(r); }

function form(r){
app.innerHTML=`<div class="header">${headerTitle(getActive())}</div>
<div class="container"><div class="card">

<b>Mark</b><input id="mark" value="${r.mark?r.mark.split('-')[1]:""}">
<b>Make</b><input id="make" value="${r.make||""}">
<b>Model</b><input id="model" value="${r.model||""}">
<b>Serial</b><input id="serial" value="${r.serial||""}">

<b>Voltage</b>
<label style="display:flex;gap:8px"><input type="checkbox" id="v1" onclick="exclusive('v1',['v1','v2','v3'])" ${r.volt=="480V"?"checked":""}><span>480V</span></label>
<label style="display:flex;gap:8px"><input type="checkbox" id="v2" onclick="exclusive('v2',['v1','v2','v3'])" ${r.volt=="208V"?"checked":""}><span>208V</span></label>
<label style="display:flex;gap:8px"><input type="checkbox" id="v3" onclick="exclusive('v3',['v1','v2','v3'])" ${r.volt=="OTHER"?"checked":""}><span>Other</span></label>

<b>Heat</b>
<label style="display:flex;gap:8px"><input type="checkbox" id="h1" onclick="exclusive('h1',['h1','h2','h3'])" ${r.heat=="Gas"?"checked":""}><span>Gas</span></label>
<label style="display:flex;gap:8px"><input type="checkbox" id="h2" onclick="exclusive('h2',['h1','h2','h3'])" ${r.heat=="Electric"?"checked":""}><span>Electric</span></label>
<label style="display:flex;gap:8px"><input type="checkbox" id="h3" onclick="exclusive('h3',['h1','h2','h3'])" ${r.heat=="Unknown"?"checked":""}><span>Unknown</span></label>

<button onclick="save()">Save</button>
<button onclick="hvac()">Cancel</button>

</div></div>`;
}

function save(){
let s=getActive();
let volt=v1.checked?"480V":v2.checked?"208V":v3.checked?"OTHER":"";
let heat=h1.checked?"Gas":h2.checked?"Electric":h3.checked?"Unknown":"";

let obj={
type:eqType,
mark:normalizeMark(mark.value,eqType),
make:clean(make.value),
model:clean(model.value),
serial:clean(serial.value),
volt,
heat
};

if(editIndex==null) s.disc.HVAC.equip.push(obj);
else s.disc.HVAC.equip[editIndex]=obj;

saveAll();

app.innerHTML=`<div class="header">${headerTitle(s)}</div>
<div class="container"><div class="card">
Saved<br><br>
<button onclick="add('${eqType}')">Add Another</button>
<button onclick="hvac()">Back To List</button>
</div></div>`;
}

function del(i){
if(!confirm("Delete "+getActive().disc.HVAC.equip[i].mark+" ?")) return;
getActive().disc.HVAC.equip.splice(i,1);
saveAll();
hvac();
}

homeScreen();
