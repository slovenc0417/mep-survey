const disciplines = [
"Walk Site","Electrical","HVAC","Cold Water",
"Sanitary","Gas","Storm","Fire Alarm","Controls"
];

let db = JSON.parse(localStorage.getItem("surveyV3") || "null");

function save(){ localStorage.setItem("surveyV3", JSON.stringify(db)); }

function upper(v){ return (v||"").toUpperCase(); }

function startScreen(){

if(db && !db.archived){
return dashboard();
}

app.innerHTML = `
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
date: date.value,
version:1
},
disc:{},
archived:false
};

disciplines.forEach(d=>{
db.disc[d]={
status:"Not Started",
flags:0,
general:{},
equip:[]
};
});

save();
dashboard();
}

function dashboard(){

let html=`
<div class="card">
<b>${db.meta.client}</b><br>
${db.meta.city} ${db.meta.state}<br>
Date: ${db.meta.date}
</div>
`;

disciplines.forEach(d=>{
let eq=db.disc[d].equip.length;
let s=db.disc[d].status;

let icon = s=="Complete"?"✔":s=="In Progress"?"●":s=="N/A"?"N/A":"○";

html+=`
<div class="card">
${d} (${icon})<br>
RTUs/Equip: ${eq}
<button onclick="openDisc('${d}')">Enter</button>
<button onclick="markNA('${d}')">N/A</button>
</div>
`;
});

html+=`
<div class="card">
<button onclick="exportExcel()">Export Excel</button>
</div>
`;

app.innerHTML=html;
save();
}

function markNA(d){
db.disc[d].status="N/A";
dashboard();
}

function openDisc(d){

if(d=="HVAC") return hvacScreen();

db.disc[d].status="In Progress";

app.innerHTML=`
<div class="card">
<h3>${d}</h3>
Feature not built yet.
<button onclick="dashboard()">Back</button>
</div>
`;
}

function hvacScreen(){

let g=db.disc["HVAC"].general;

app.innerHTML=`
<div class="card">
<h3>HVAC General</h3>

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
<h3>RTUs (${db.disc["HVAC"].equip.length})</h3>
<button onclick="addRTU()">+ Add RTU</button>
<button onclick="dashboard()">Back</button>
</div>
`;

db.disc["HVAC"].status="In Progress";
save();
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

function addRTU(){

app.innerHTML=`
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
`;
}

let voltValue="";

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

function exportExcel(){

let wb=XLSX.utils.book_new();

let g=db.disc["HVAC"].general;

let gen=[
["TYPE",g.type||""],
["GAS",g.gas||""],
["ELECTRICAL",g.elec||""],
["CONDENSATE",g.cond||""],
["AIR",g.air||""]
];

let ws=XLSX.utils.aoa_to_sheet(gen);
XLSX.utils.book_append_sheet(wb,ws,"HVAC GENERAL");

let rows=[["MARK","MAKE","MODEL","SERIAL","VOLT","GAS","ELEC","MOUNT","REUSE","NOTES"]];

db.disc["HVAC"].equip.forEach(r=>{
rows.push([
r.mark,r.make,r.model,r.serial,r.volt,
r.gas?"YES":"",r.elec?"YES":"",r.mount,r.reuse,r.notes
]);
});

let ws2=XLSX.utils.aoa_to_sheet(rows);
XLSX.utils.book_append_sheet(wb,ws2,"RTUs");

let fname=
`${db.meta.client} - ${db.meta.city} ${db.meta.state}_`+
db.meta.date.replaceAll("/","")+
".xlsx";

XLSX.writeFile(wb,fname);
}

startScreen();
