// VERSION 4.1 — SURVEY MANAGER + HVAC EDITABLE RTUs

const disciplines = [
"Walk Site","Electrical","HVAC","Cold Water",
"Sanitary","Gas","Storm","Fire Alarm","Controls"
];

let surveys = JSON.parse(localStorage.getItem("surveyManagerV41") || "[]");
let activeSurveyId = localStorage.getItem("activeSurveyIdV41");

function saveAll(){
localStorage.setItem("surveyManagerV41", JSON.stringify(surveys));
localStorage.setItem("activeSurveyIdV41", activeSurveyId);
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

let html = `<div class="container"><div class="card"><b>MEP Survey</b></div>`;

surveys.forEach(s=>{
let dim = s.archived ? "style='opacity:.4'" : "";

html += `
<div class="card" ${dim} onclick="openSurvey('${s.id}')">
<b>${s.meta.client} - ${s.meta.city}</b><br>
${s.meta.date} &nbsp;&nbsp; ${statusIcon(overallStatus(s))}
</div>
`;
});

html += `<button onclick="newSurveyScreen()">+ Start New Survey</button></div>`;
app.innerHTML = html;
}

function overallStatus(s){
let done = Object.values(s.disc).filter(d=>d.status=="Complete").length;
if(done==0) return "Not Started";
if(done < disciplines.length) return "In Progress";
return "Complete";
}

function newSurveyScreen(){

app.innerHTML = `
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
</div>
`;

let d=new Date();
document.getElementById("date").value =
("0"+(d.getMonth()+1)).slice(-2)+"-"+
("0"+d.getDate()).slice(-2)+"-"+
d.getFullYear().toString().slice(-2);
}

function createSurvey(){

let id = Date.now().toString();

let survey = {
id,
meta:{
client: client.value,
store: store.value,
addr: addr.value,
city: city.value,
state: state.value,
date: date.value
},
disc:{},
archived:false
};

disciplines.forEach(d=>{
survey.disc[d]={ status:"Not Started", general:{}, equip:[] };
});

surveys.push(survey);
activeSurveyId = id;
saveAll();
dashboard();
}

function getActive(){
return surveys.find(s=>s.id==activeSurveyId);
}

function openSurvey(id){

let s = surveys.find(x=>x.id==id);

if(overallStatus(s)=="Complete"){
return completedDialog(s);
}

activeSurveyId = id;
saveAll();
dashboard();
}

function completedDialog(s){

app.innerHTML = `
<div class="header">${headerTitle(s)}</div>
<div class="container">
<div class="card">
Survey Completed<br><br>
<button onclick="activeSurveyId='${s.id}';dashboard()">View / Edit</button>
<button onclick="archiveSurvey('${s.id}')">Archive</button>
<button onclick="homeScreen()">Back</button>
</div>
</div>
`;
}

function archiveSurvey(id){
let s = surveys.find(x=>x.id==id);
s.archived = true;
saveAll();
homeScreen();
}

function dashboard(){

let s = getActive();

let html = `<div class="header">${headerTitle(s)}</div><div class="container">`;

html += `<div class="card"><b>Date:</b> ${s.meta.date}</div>`;

disciplines.forEach(d=>{
let st = s.disc[d].status;

html += `
<div class="card">
<b>${d}</b> (${statusIcon(st)})
<button onclick="openDisc('${d}')">Enter</button>
<button onclick="markNA('${d}')">N/A</button>
</div>
`;
});

html += `<button onclick="homeScreen()">Back To Surveys</button></div>`;
app.innerHTML = html;
saveAll();
}

function markNA(d){
getActive().disc[d].status="N/A";
dashboard();
}

function openDisc(d){
if(d=="HVAC") return hvacScreen();

app.innerHTML = `
<div class="header">${headerTitle(getActive())}</div>
<div class="container">
<div class="card">${d} - Feature not built yet
<button onclick="dashboard()">Back</button></div>
</div>
`;
}

function hvacScreen(){

let s = getActive();
let g = s.disc["HVAC"].general;
let list = s.disc["HVAC"].equip;

let html = `<div class="header">${headerTitle(s)}</div><div class="container">`;

html += `
<div class="card">
<b>HVAC Type (select all that apply)</b><br>
<label><input type="checkbox" id="t1"> Gas Heat / Electric Cooling</label><br>
<label><input type="checkbox" id="t2"> Electric Heat / Electric Cooling</label><br>
<label><input type="checkbox" id="t3"> Cooling Only</label><br>
<label><input type="checkbox" id="t4"> Heat Pump</label><br>
<label><input type="checkbox" id="t5"> Air Handling Unit</label><br><br>

<b>Gas Distribution</b>
<textarea id="gas" placeholder="Example: Elevated gas header across roof feeding each RTU individually">${g.gas||""}</textarea>

<b>Electrical Distribution</b>
<textarea id="elec" placeholder="Example: Rigid conduit on sleepers from roof disconnects">${g.elec||""}</textarea>

<b>Condensate</b>
<textarea id="cond" placeholder="Example: Splash blocks on roof near units">${g.cond||""}</textarea>

<b>Air Distribution</b>
<textarea id="air" placeholder="Example: Concentric diffusers on sales floor, ducted BOH">${g.air||""}</textarea>

<button onclick="saveHVACGeneral()">Save General</button>
</div>
`;

html += `<div class="card"><b>RTUs</b><br>`;

list.forEach((r,i)=>{
html += `<div>${r.mark || "RTU"} <button onclick="editRTU(${i})">Edit</button></div>`;
});

html += `
<button onclick="addRTU()">+ Add RTU</button>
<button onclick="completeHVAC()">Mark HVAC Complete</button>
<button onclick="dashboard()">Back</button>
</div>
</div>`;

app.innerHTML = html;

s.disc["HVAC"].status="In Progress";
saveAll();
}

function clean(v){
return (v || "").replace(/\s+/g,'');
}

function addRTU(){
renderRTUForm();
}

function editRTU(i){
renderRTUForm(i);
}

function renderRTUForm(i){

let s = getActive();
let r = s.disc["HVAC"].equip[i] || {};

app.innerHTML = `
<div class="header">${headerTitle(s)}</div>
<div class="container">
<div class="card">

<b>Mark</b><input id="mark" value="${r.mark||""}">
<b>Make</b><input id="make" value="${r.make||""}">
<b>Model</b><input id="model" value="${r.model||""}">
<b>Serial</b><input id="serial" value="${r.serial||""}">

<b>Voltage</b><br>
<label><input type="checkbox" id="v1" ${r.volt=="480V"?"checked":""}>480V</label>
<label><input type="checkbox" id="v2" ${r.volt=="208V"?"checked":""}>208V</label>
<label><input type="checkbox" id="v3" ${r.volt=="OTHER"?"checked":""}>Other</label>

<br><br><b>Curb Type</b><br>
<label><input type="checkbox" id="c1" ${r.mount=="Standard Curb"?"checked":""}>Standard Curb</label>
<label><input type="checkbox" id="c2" ${r.mount=="Curb Adapter"?"checked":""}>Curb Adapter</label>

<br><br><b>Suitable for Re-use</b><br>
<label><input type="checkbox" id="r1" ${r.reuse=="Yes"?"checked":""}>Yes</label>
<label><input type="checkbox" id="r2" ${r.reuse=="No"?"checked":""}>No</label>

<br><br><b>Additional Notes</b>
<textarea id="notes" placeholder="Example: RTU was vandalized and abandoned in place.">${r.notes||""}</textarea>

<button onclick="saveRTU(${i})">Save RTU</button>
<button onclick="hvacScreen()">Cancel</button>

</div></div>`;
}

function saveRTU(i){

let s = getActive();

let volt = v1.checked ? "480V" : v2.checked ? "208V" : v3.checked ? "OTHER" : "";
let curb = c1.checked ? "Standard Curb" : c2.checked ? "Curb Adapter" : "";
let reuse = r1.checked ? "Yes" : r2.checked ? "No" : "";

let obj = {
mark: clean(mark.value),
make: clean(make.value),
model: clean(model.value),
serial: clean(serial.value),
volt,
mount: curb,
reuse,
notes: notes.value
};

if(i===undefined){
s.disc["HVAC"].equip.push(obj);
}else{
s.disc["HVAC"].equip[i] = obj;
}

saveAll();
hvacScreen();
}

function saveHVACGeneral(){

let s = getActive();

let types=[];
if(t1.checked) types.push("Gas Heat/Electric Cooling");
if(t2.checked) types.push("Electric Heat/Electric Cooling");
if(t3.checked) types.push("Cooling Only");
if(t4.checked) types.push("Heat Pump");
if(t5.checked) types.push("Air Handling Unit");

s.disc["HVAC"].general={
type: types.join(", "),
gas: gas.value,
elec: elec.value,
cond: cond.value,
air: air.value
};

saveAll();
alert("Saved");
}

function completeHVAC(){
getActive().disc["HVAC"].status="Complete";
dashboard();
}

homeScreen();
