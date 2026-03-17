const disciplines = [
"Walk Site","Electrical","HVAC","Cold Water",
"Sanitary","Gas","Storm","Fire Alarm","Controls"
];

let surveys = JSON.parse(localStorage.getItem("surveyManagerV4") || "[]");
let activeSurveyId = localStorage.getItem("activeSurveyId");

function saveAll(){
localStorage.setItem("surveyManagerV4", JSON.stringify(surveys));
localStorage.setItem("activeSurveyId", activeSurveyId);
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

let html = `<div class="header">MEP Survey</div><div class="container">`;

surveys.forEach(s=>{
let dim = s.archived ? "style='opacity:.4'" : "";

html += `
<div class="card" ${dim} onclick="openSurvey('${s.id}')">
<b>${s.meta.client} - ${s.meta.city}</b><br>
${s.meta.date} &nbsp;&nbsp; ${statusIcon(overallStatus(s))}
</div>
`;
});

html += `
<button onclick="newSurveyScreen()">+ Start New Survey</button>
</div>`;

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
<button onclick="exportExcel()">Export Again</button>
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

html += `<div class="card">Date: ${s.meta.date}</div>`;

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

html += `
<button onclick="homeScreen()">Back To Surveys</button>
</div>`;

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
<div class="card">
${d} - Feature not built yet
<button onclick="dashboard()">Back</button>
</div>
</div>
`;
}

function hvacScreen(){

let s = getActive();
let g = s.disc["HVAC"].general;
let count = s.disc["HVAC"].equip.length;

app.innerHTML = `
<div class="header">${headerTitle(s)}</div>
<div class="container">

<div class="card">
<h3>HVAC General</h3>

<label><input type="checkbox" id="t1"> Gas Heat / Electric Cooling</label><br>
<label><input type="checkbox" id="t2"> Electric Heat / Electric Cooling</label><br>
<label><input type="checkbox" id="t3"> Cooling Only</label><br>
<label><input type="checkbox" id="t4"> Heat Pump</label><br>
<label><input type="checkbox" id="t5"> Air Handling Unit</label><br><br>

Gas Distribution
<textarea id="gas" placeholder="Example: Elevated gas header across roof feeding each RTU individually">${g.gas||""}</textarea>

Electrical Distribution
<textarea id="elec" placeholder="Example: Rigid conduit on sleepers from roof disconnects">${g.elec||""}</textarea>

Condensate
<textarea id="cond" placeholder="Example: Splash blocks on roof near units">${g.cond||""}</textarea>

Air Distribution
<textarea id="air" placeholder="Example: Concentric diffusers on sales floor, ducted BOH">${g.air||""}</textarea>

<button onclick="saveHVACGeneral()">Save General</button>
</div>

<div class="card">
<h3>RTUs Entered: ${count}</h3>
<button onclick="addRTU()">+ Add RTU</button>
<button onclick="completeHVAC()">Mark HVAC Complete</button>
<button onclick="dashboard()">Back</button>
</div>

</div>
`;

s.disc["HVAC"].status="In Progress";
saveAll();
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

let voltValue="";

function addRTU(){

app.innerHTML = `
<div class="header">${headerTitle(getActive())}</div>
<div class="container">
<div class="card">

Mark<input id="mark">
Make<input id="make">
Model<input id="model">
Serial<input id="serial">

Voltage
<button onclick="setVolt('480V')">480V</button>
<button onclick="setVolt('208V')">208V</button>
<button onclick="setVolt('OTHER')">Other</button>
<div id="volt"></div>

Heat
<label><input type="checkbox" id="gasheat">Gas</label>
<label><input type="checkbox" id="elecheat">Electric</label>

Mounting
<select id="mount">
<option></option>
<option>Standard Curb</option>
<option>Curb Adapter</option>
</select>

Reuse
<select id="reuse">
<option></option>
<option>Yes</option>
<option>No</option>
</select>

Notes<textarea id="notes"></textarea>

<button onclick="saveRTU()">Save RTU</button>

</div>
</div>
`;
}

function setVolt(v){
voltValue=v;
document.getElementById("volt").innerHTML="Selected: "+v;
}

function saveRTU(){

let s = getActive();

s.disc["HVAC"].equip.push({
mark: mark.value,
make: make.value,
model: model.value,
serial: serial.value,
volt: voltValue,
gas: gasheat.checked,
elec: elecheat.checked,
mount: mount.value,
reuse: reuse.value,
notes: notes.value
});

saveAll();

if(confirm("Add another RTU?")){
addRTU();
}else{
hvacScreen();
}
}

homeScreen();
