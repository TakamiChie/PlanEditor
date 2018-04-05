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
  // 目次データの作成
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

  let atable = createAggregatesTable(arg.aggregatesdata);

  // HTML出力
  document.querySelector("#container").appendChild(table);
  if(atable != undefined) document.querySelector("#container").appendChild(atable);
  document.querySelector("#daylabel").textContent = moment().format("YYYY/MM/DD");
  document.querySelector("#fileName").textContent = arg.fileName == undefined ? "無題" : path.basename(arg.fileName);

  ipc.send("ready");
});

/**
 * 集計データテーブルを作成する
 * @param {object} aggregatesdata 集計データ
 * @returns 集計データテーブル。あるいはundefined
 */
function createAggregatesTable(aggregatesdata) {
  if(aggregatesdata == undefined || Object.keys(aggregatesdata).length == 0){
    return undefined;
  }
  // 集計データの作成
  let table = document.createElement("table");
  table.id = "aggregates";
  let thead = table.createTHead();
  let tbody = table.createTBody();
  let headr = thead.insertRow(0);
  let firstChild = true;
  let ch = (t) => { let h = document.createElement("th"); h.textContent = t; return h; }
  headr.appendChild(ch("集計"));
  headr.appendChild(ch("合計"));
  Object.keys(aggregatesdata).forEach(aggregate => {
    let r = tbody.insertRow();
    r.insertCell().textContent = aggregate;
    r.insertCell().textContent = aggregatesdata[aggregate].TOTAL;
    Object.keys(aggregatesdata[aggregate]).forEach(key => {
      if(key.charAt(0) == "e" && key.length > 1){
        if(firstChild) headr.appendChild(ch(key.substring(1)));
        r.insertCell().textContent = aggregatesdata[aggregate][key];
      }
    });
    firstChild = false;
  });
  return table;
}

ipc.on("display_date", () => { refresh_header("#daylabel"); });

ipc.on("display_filename", () => { refresh_header("#fileName"); });

ipc.on("execprint", () => window.print());

function refresh_header(id) {
  document.querySelector(id).style.visibility = 
    document.querySelector(id).style.visibility == "hidden" ? "" : "hidden"  
  document.querySelector("header").style.display = 
    document.querySelector("#daylabel").style.visibility == "hidden" &&
    document.querySelector("#fileName").style.visibility == "hidden" ? "none" : "block";
}