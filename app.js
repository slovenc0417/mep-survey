const disciplines = [
"Walk Site","Electrical","HVAC","Cold Water",
"Sanitary","Gas","Storm","Fire Alarm","Controls"
];

let db = JSON.parse(localStorage.getItem("surveyV35") || "null");

function save(){ localStorage.setItem("surveyV35", JSON.stringify(db)); }

function upper(v){ return (v||"").toUpperCase(); }

function headerTitle(){
if(!db) return "MEP Survey";
return `MEP Survey — ${db.meta.client} — ${db.meta.city}`;
}

function startScreen(){

if(db && !db.archived){
return dashboard();
}

app.innerHTML = `
<div class="header">${headerTitle()}</div>

<div class="container">
<div class="card">
<h3>Start New Survey</h3>

Client<input id="client">
Former Store<input id="store">
Address<input id="addr">
City<input id="city">
State<input id="state">
Date<input id="date">

<button onclick="createSurvey()">Start Survey</button>
</div>
</div>
`;

let d=new Date();
document.getElementById("date").value =
("0"+(d.getMonth()+1)).slice(-2)+"/"+
("0"+d.getDate()).slice(-2)+"/"+
d.getFullYear().toString().slice(-2);
}

function createSurvey(){

db={
meta:{
client: upper(client.value),
store: upper(store.value),
addr: upper(addr.value),
city: upper(city.value),
state: upper(state.value),
date: date.value
},
disc:{},
archived:false
};

disciplines.forEach(d=>{
db.disc[d]={
status:"Not Started",
general:{},
equip:[]
};
});

save();
dashboard();
}

function statusIcon(s){
if(s=="Complete") return "✔";
if(s=="In Progress") return "●";
if(s=="N/A") return "N/A";
return "○";
}

function dashboard(){

let html=`<div class="header">${headerTitle()}</div><div class="container">`;

html+=`
<div class="card">
DATE: ${db.meta.date}
</div>
`;

disciplines.forEach(d=>{
let s=db.disc[d].status;

html+=`
<div class="card">
<b>${d}</b> (${statusIcon(s)})
<button onclick="openDisc('${d}')">Enter</button>
<button onclick="markNA('${d}')">N/A</button>
</div>
`;
});

html+=`</div>`;
app.innerHTML=html;
save();
}

function markNA(d){
db.disc[d].status="N/A";
dashboard();
}

function openDisc(d){

if(d=="HVAC") return hvacScreen();

app.innerHTML=`
<div class="header">${headerTitle()}</div>
<div class="container">
<div class="card">
<h3>${d}</h3>
Feature not built yet.
<button onclick="dashboard()">Back</button>
</div>
</div>
`;
}

function hvacScreen(){

let g=db.disc["HVAC"].general;
let count=db.disc["HVAC"].equip.length;

app.innerHTML=`
<div class="header">${headerTitle()}</div>
<div class="container">

<div class="card">
<h3>HVAC GENERAL</h3>

RTU Type
<select id="rtutype">
<option></option>
<option>GAS PACKAGED</option>
<option>HEAT PUMP</option>
<option>ELECTRIC HEAT</option>
<option>MIXED</option>
<option>UNKNOWN</option>
</select>

Gas Distribution<textarea id="gas">${g.gas||""}</textarea>
Electrical Distribution<textarea id="elec">${g.elec||""}</textarea>
Condensate<textarea id="cond">${g.cond||""}</textarea>
Air Distribution<textarea id="air">${g.air||""}</textarea>

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

db.disc["HVAC"].status="In Progress";
save();
}

function completeHVAC(){
db.disc["HVAC"].status="Complete";
dashboard();
}

function saveHVACGeneral(){

db.disc["HVAC"].general={
type: upper(rtutype.value),
gas: upper(gas.value),
elec: upper(elec.value),
cond: upper(cond.value),
air: upper(air.value)
};

save();
alert("Saved");
}

let voltValue="";

function addRTU(){

app.innerHTML=`
<div class="header">${headerTitle()}</div>
<div class="container">
<div class="card">
<h3>Add RTU</h3>

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
<option>STANDARD CURB</option>
<option>CURB ADAPTER</option>
</select>

Reuse
<select id="reuse">
<option></option>
<option>YES</option>
<option>NO</option>
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

db.disc["HVAC"].equip.push({
mark: upper(mark.value),
make: upper(make.value),
model: upper(model.value),
serial: upper(serial.value),
volt: voltValue,
gas: gasheat.checked,
elec: elecheat.checked,
mount: upper(mount.value),
reuse: upper(reuse.value),
notes: upper(notes.value)
});

save();

if(confirm("Add another RTU?")){
addRTU();
}else{
hvacScreen();
}
}

startScreen();
