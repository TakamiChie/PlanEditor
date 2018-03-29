const electron = require('electron');
const ipc = electron.ipcRenderer;
const remote = electron.remote;

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
  
  ipc.send("ready");
})