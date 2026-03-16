const disciplines = [
"Walk Site","Electrical","HVAC","Cold Water",
"Sanitary","Gas","Storm","Fire Alarm","Controls"
];

let db = JSON.parse(localStorage.getItem("surveyV2") || "null");

function save(){ localStorage.setItem("surveyV2", JSON.stringify(db)); }

function upper(v){ return (v||"").toUpperCase(); }

function startScreen(){

if(db && !db.archived){
return dashboard();
}

app.innerHTML = `
<div class="card">
<h3>Start New Survey</h3>

Client
<input id="client">

Former Store
<input id="store">

Address
<input id="addr">

City
<input id="city">

State
<input id="state">

Date
<input id="date">

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
check:{},
fields:{},
equip:[]
};
});

save();
dashboard();
}

function dashStatus(d){
let s=db.disc[d].status;
if(s=="Complete") return `<span class="green badge">✔</span>`;
if(s=="In Progress") return `<span class="yellow badge">●</span>`;
if(s=="N/A") return `<span class="gray badge">N/A</span>`;
return `<span class="gray badge">○</span>`;
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
html+=`
<div class="card">
<div class="row">
<div>${d}</div>
<div>${dashStatus(d)}</div>
</div>
Equipment: ${eq}
<button onclick="openDisc('${d}')">Enter</button>
<button onclick="markNA('${d}')">Mark N/A</button>
</div>
`;
});

html+=`
<div class="card">
<button onclick="review()">Finish / Review</button>
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

let sec=db.disc[d];
sec.status="In Progress";

let html=`
<div class="card">
<h3>${d}</h3>
<button onclick="addEquip('${d}')">+ Add Equipment</button>
<button onclick="flag('${d}')">⚑ Flag Item</button>
<button onclick="complete('${d}')">Mark Complete</button>
<button onclick="dashboard()">Back</button>
</div>

<div class="card"><b>Equipment</b>
`;

sec.equip.forEach((e,i)=>{
html+=`
<div class="eqItem">
${e.mark} | ${e.model}
<button onclick="editEquip('${d}',${i})">Edit</button>
<button onclick="delEquip('${d}',${i})">Delete</button>
</div>
`;
});

html+=`</div>`;

app.innerHTML=html;
save();
}

function addEquip(d){

let mark=upper(prompt("Mark"));
let model=upper(prompt("Model"));
let serial=upper(prompt("Serial"));
let loc=upper(prompt("Location"));
let notes=upper(prompt("Notes"));

db.disc[d].equip.push({mark,model,serial,loc,notes});
openDisc(d);
}

function editEquip(d,i){

let e=db.disc[d].equip[i];

e.mark=upper(prompt("Mark",e.mark));
e.model=upper(prompt("Model",e.model));
e.serial=upper(prompt("Serial",e.serial));
e.loc=upper(prompt("Location",e.loc));
e.notes=upper(prompt("Notes",e.notes));

openDisc(d);
}

function delEquip(d,i){
db.disc[d].equip.splice(i,1);
openDisc(d);
}

function flag(d){
db.disc[d].flags++;
alert("Flag added");
}

function complete(d){
db.disc[d].status="Complete";
dashboard();
}

function review(){

let issues=[];
disciplines.forEach(d=>{
let s=db.disc[d];
if(s.status=="Not Started") issues.push(d+" not started");
if(s.flags>0) issues.push(d+" has "+s.flags+" flags");
});

let html=`<div class="card"><h3>Review</h3>`;

if(issues.length==0){
html+=`Survey looks complete`;
}else{
issues.forEach(i=> html+=`⚠ ${i}<br>`);
}

html+=`
<button onclick="dashboard()">Back</button>
<button onclick="exportExcel()">Export Anyway</button>
</div>`;

app.innerHTML=html;
}

function exportExcel(){

let wb=XLSX.utils.book_new();

let info=[
["Client",db.meta.client],
["City",db.meta.city],
["State",db.meta.state],
["Date",db.meta.date]
];

let ws=XLSX.utils.aoa_to_sheet(info);
XLSX.utils.book_append_sheet(wb,ws,"Survey Info");

disciplines.forEach(d=>{
let rows=[["Mark","Model","Serial","Location","Notes"]];
db.disc[d].equip.forEach(e=>{
rows.push([e.mark,e.model,e.serial,e.loc,e.notes]);
});
let w=XLSX.utils.aoa_to_sheet(rows);
XLSX.utils.book_append_sheet(wb,w,d);
});

let fname=
`${db.meta.client} - ${db.meta.city} ${db.meta.state}_`+
db.meta.date.replaceAll("/","")+
(db.meta.version>1?("_v"+db.meta.version):"")+
".xlsx";

db.meta.version++;

XLSX.writeFile(wb,fname);
save();
}

startScreen();