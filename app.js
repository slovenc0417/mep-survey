let surveys = JSON.parse(localStorage.getItem("surveys")||"[]");
let activeSurveyId = localStorage.getItem("activeSurveyId");

function saveAll(){
localStorage.setItem("surveys",JSON.stringify(surveys));
localStorage.setItem("activeSurveyId",activeSurveyId);
}

function getActive(){
return surveys.find(s=>s.id==activeSurveyId);
}

function titleCase(t){
return (t||"").toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
}

function cleanMS(v){
return (v||"").toUpperCase().replace(/\s+/g,"");
}

function wordNum(v){
let m={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,
eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15};
v=(v||"").toLowerCase().trim();
return m[v]?m[v]:v.toUpperCase();
}

function normMark(v,type){
let t=wordNum(v).toString().replace(/\s+/g,"");
if(!t) return "";
return type+"-"+t;
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

function home(){
let html=`<div class="header">MEP Survey</div><div class="container">`;
surveys.forEach(s=>{
html+=`<div class="card" onclick="openSurvey('${s.id}')"><b>${s.client}</b><br>${s.city}</div>`;
});
html+=`<button onclick="newSurvey()">Start New Survey</button></div>`;
app.innerHTML=html;
}

function newSurvey(){
app.innerHTML=`<div class="header">New Survey</div><div class="container">
<div class="card">
Client<input id="c">
City<input id="ci">
<button onclick="create()">Create</button>
<button onclick="home()">Back</button>
</div></div>`;
}

function create(){
let id=Date.now().toString();
surveys.push({id,client:titleCase(c.value),city:titleCase(ci.value),equip:[]});
activeSurveyId=id;
saveAll();
dashboard();
}

function openSurvey(id){activeSurveyId=id; saveAll(); dashboard();}

function dashboard(){
let s=getActive();
let html=`<div class="header">MEP Survey – ${s.client} – ${s.city}</div>
<div class="container">
<div class="card"><button onclick="hvac()">HVAC</button></div>
<button onclick="home()">Back</button>
</div>`;
app.innerHTML=html;
}

function hvac(){
let s=getActive();
let list=sortEquip(s.equip);
let html=`<div class="header">HVAC</div><div class="container">
<div class="card">`;

list.forEach((r,i)=>{
html+=`<div class="eqItem">${r.mark}
<button onclick="edit(${i})">Edit</button>
</div>`;
});

html+=`<button onclick="add()">Add RTU</button>
<button onclick="dashboard()">Back</button>
</div></div>`;
app.innerHTML=html;
}

let editIndex=null;

function add(){editIndex=null; form({});}

function edit(i){editIndex=i; form(getActive().equip[i]);}

function form(r){
app.innerHTML=`<div class="header">RTU</div><div class="container">
<div class="card">

<b>Mark</b>
<input id="mark" value="${r.mark?r.mark.split("-")[1]:""}">

<b>Make</b>
<input id="make" value="${r.make||""}">

<b>Model</b>
<input id="model" value="${r.model||""}">

<b>Serial</b>
<input id="serial" value="${r.serial||""}">

<b>Voltage</b>
<label class="checkrow"><input type="checkbox" id="v1">480V</label>
<label class="checkrow"><input type="checkbox" id="v2">208V</label>
<label class="checkrow"><input type="checkbox" id="v3">Other</label>

<b>Heat</b>
<label class="checkrow"><input type="checkbox" id="h1">Gas</label>
<label class="checkrow"><input type="checkbox" id="h2">Electric</label>
<label class="checkrow"><input type="checkbox" id="h3">Unknown</label>

<b>Curb Type</b>
<label class="checkrow"><input type="checkbox" id="c1">Standard</label>
<label class="checkrow"><input type="checkbox" id="c2">Adapter</label>

<b>Suitable for Re-use</b>
<label class="checkrow"><input type="checkbox" id="r1">Yes</label>
<label class="checkrow"><input type="checkbox" id="r2">No</label>

<b>Notes</b>
<textarea id="n">${r.notes||""}</textarea>

<button onclick="save()">Save</button>
<button onclick="hvac()">Cancel</button>

</div></div>`;
}

function save(){
let s=getActive();

let obj={
mark:normMark(mark.value,"RTU"),
make:make.value,
model:cleanMS(model.value),
serial:cleanMS(serial.value),
volt:v1.checked?"480V":v2.checked?"208V":v3.checked?"Other":"",
heat:h1.checked?"Gas":h2.checked?"Electric":h3.checked?"Unknown":"",
mount:c1.checked?"Standard":c2.checked?"Adapter":"",
reuse:r1.checked?"Yes":r2.checked?"No":"",
notes:n.value
};

if(editIndex==null) s.equip.push(obj);
else s.equip[editIndex]=obj;

saveAll();
hvac();
}

home();
