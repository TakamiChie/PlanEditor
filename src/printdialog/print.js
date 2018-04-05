const electron = require('electron');
const ipc = electron.ipcRenderer;
const remote = electron.remote;
const path = require('path');

var columns;
var tabledata;
ipc.on("init", (e, arg) => {
  columns = arg.column;
  tabledata = arg.data;
  console.log(arg);
  let table = document.createElement("table");
  let thead = table.createTHead();
  let headr = thead.insertRow(0);
  columns.forEach(e => {
    let cell = document.createElement("th");
    cell.textContent = e.name;
    headr.appendChild(cell);
  });
  let tbody = table.createTBody();
  tabledata.forEach(row => {
    let r = tbody.insertRow();
    columns.forEach(e => {
      let cell = r.insertCell();
      cell.textContent = row[e.name];
    });         
  });
  document.querySelector("#container").appendChild(table);
  document.querySelector("#daylabel").textContent = moment().format("YYYY/MM/DD");
  document.querySelector("#fileName").textContent = arg.fileName == undefined ? "無題" : path.basename(arg.fileName);
  
  ipc.send("ready");
});

ipc.on("display_date", () => { refresh_header("#daylabel"); });

ipc.on("display_filename", () => { refresh_header("#fileName"); });

function refresh_header(id) {
  document.querySelector(id).style.visibility = 
    document.querySelector(id).style.visibility == "hidden" ? "" : "hidden"  
  document.querySelector("header").style.display = 
    document.querySelector("#daylabel").style.visibility == "hidden" &&
    document.querySelector("#fileName").style.visibility == "hidden" ? "none" : "block";
}