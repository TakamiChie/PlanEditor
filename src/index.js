/**
 * セーブファイルのファイルバージョン
 */
const FILEVERSION = "1.0.0";
/**
 * ウィンドウのタイトル
 */
const WINDOWTITLE = "PlanEditor";
/**
 * セルの役割を示す列挙体
 */
const ROLE = {
  /**
   * セルは章や見出しを示す。
   */
  CHAPTER: "CHAPTER",
  /**
   * セルは集計が必要な数値であることを示す。
   */
  AGGREGATE: "AGGREGATE",
  /**
   * セルは担当者名であることを示す。二列以上作成できない。
   */
  CHARGE: "CHARGE",
  /**
   * セルは特に意味を持たないテキストセルであることを示す。
   */
  TEXT: "TEXT",
  /**
   * セルは特に意味を持たない数字セルであることを示す。
   */
  NUMBER: "NUMBER",
  /**
   * セルは特に意味を持たない日付セルであることを示す。
   */
  DATE: "DATE",
  /**
   * セルは編集できない。
   */
  STATIC: "STATIC"
}
/**
 * ファイルフィルタ
 */
const def_filters = [{
  name: "PlanEditorファイル(*.pln)",
  extensions: ['pln']
}]
const electron = require('electron');
const remote = electron.remote;
const BrowserWindow = remote.BrowserWindow;
const dialog = remote.dialog;
const path = require('path');

let settings;
let openedFileName;
var grid;
var tabledata = [];

require("electron").ipcRenderer.on("fileOpen", (e, arg) => {
  menuop_fileOpen(arg);
});

require("electron").ipcRenderer.on("fileSave", (e, args) => {
  if(args.saveas){
    menuop_fileSaveAs(args);
  }else{
    menuop_fileSave(args);
  }
});

require("electron").ipcRenderer.on("fileClose", (e) => {
  menuop_fileClose();
});

require("electron").ipcRenderer.on("appendColumn", (e) => {
  menuop_append_column();
});

//////////// メニュー用メソッド //////////////

/**
 * ファイルを開く
 * @param {string} arg.directory 初期ディレクトリ名
 * @param {string} arg.fileName ファイル名(こちらが指定されていた場合、上記の設定は無視される)
 */
function menuop_fileOpen(args) {
  const fs = require("fs");
  if(args.fileName && fs.existsSync(args.fileName)){
    fileOpen(args.fileName);
  }else{
    dialog.showOpenDialog(
      BrowserWindow.getFocusedWindow(),
      {
        title: "ファイルを開く",
        defaultPath: args.directory,
        properties: ["openFile"],
        filters: def_filters
      },
      (filepath) => {
        if(filepath) fileOpen(filepath.shift()); 
      });
  }
}

/**
 * ファイルを上書き保存
 * @param {string} args.path 初期ディレクトリ名
 * @param {boolean} args.saveas 項目は「名前をつけて保存」である
 */
function menuop_fileSave(args) {
  const fs = require("fs");
  if(fs.existsSync(openedFileName)){
    fileSave(openedFileName);
  }else{
    menuop_fileSaveAs(args);
  }
}

/**
 * ファイルを名前をつけて保存
 * @param {string} args.path 初期ディレクトリ名
 * @param {boolean} args.saveas 項目は「名前をつけて保存」である
 */
function menuop_fileSaveAs(args) {
  dialog.showSaveDialog(
    BrowserWindow.getFocusedWindow(),
    {
      title: "ファイルを保存",
      defaultPath: args.path,
      filters: def_filters
    },
    (filepath) => {
      if(filepath) fileSave(filepath);
    });
}

/**
 * ファイルを閉じる
 */
function menuop_fileClose() {
  // TODO: modifyフラグの新設
  if(confirm("保存していない変更は失われます。よろしいですか？")){
    fileClose();
    toast("ファイルを閉じました");
  }
}

function menuop_append_column() {
  showColumnDialog(true).then((value) => {
    // 設定値更新
    settings.rows.push({name: value.name, role: value.role});
    resetHeaderRow(getEditorUI());
    renumber();
    aggregates();
    saveSettings();
  });
}
//////////// 各種メソッド //////////////

/**
 * ファイルを開く(ファイル名確定済み)
 * @param {string} fileName ファイル名
 */
function fileOpen(fileName) {
  const fs = require("fs");
  const yaml = require("js-yaml");
  fs.readFile(fileName, "utf8", (err, data) => {
    if(err){
      console.error(err)
      alert("ファイル読み込みに失敗しました");
    }else{
      fileClose();
      var loadData = yaml.safeLoad(data);
      if(!loadData.filever){
        alert("ファイルが読み込めません。ファイルが破損している可能性があります。");
      }else if(loadData.filever.split(".").shift() == "1")
      {
        settings.rows = loadData.rows;
        let editorui = getEditorUI();
        // ファイル読み込み
        resetHeaderRow(editorui);

        // テーブルデータ読み込み
        let table = loadData.data;
        tabledata = [];
        table.forEach(rowdata => {
          var row = {}
          settings.rows.forEach(r => {
            if(r.name != "項番"){
              row[r.name] = rowdata[r.name];
            }
          });
          tabledata.push(row);
        });
        redrawGrid(undefined, () => { grid.setData(tabledata)})
        setOpenedFileName(fileName);
        toast(`${path.basename(fileName)}を読み込みました。`);
        console.log("Open Finished");
        renumber();
        aggregates();
      }else{
        alert("ファイルが読み込めません。ファイルが破損している可能性があります。");
      }
    }
  });
  
}

/**
 * ファイルを保存する(ファイル名確定済み)
 * @param {string} fileName ファイル名
 */
function fileSave(fileName){
  var serialize = {};
  let editorui = getEditorUI();
  serialize["filever"] = FILEVERSION;
  serialize["rows"] = settings.rows;
  serialize["data"] = [];
  tabledata.forEach((data) => {
    let rowdata = {}
    settings.rows.forEach(c => {
      rowdata[c.name] = (data[c.name] || "");
    });
    serialize["data"].push(rowdata);
  });
  const fs = require("fs");
  const yaml = require("js-yaml");
  fs.writeFile(fileName, yaml.safeDump(serialize), "utf8", (err) => {
    if(err){
      console.log(err);
      alert("ファイル書き込みに失敗しました");
    }else{
      console.log("Save Finished");
      toast(`ファイルを${path.basename(fileName)}に保存しました`);
      setOpenedFileName(fileName);
    }
  });
}

/**
 * ファイルを閉じる
 */
function fileClose(){
  redrawGrid(undefined, () => { 
    tabledata = [];
    grid.setData(tabledata, true);
  });
  setOpenedFileName("");
}

/**
 * 開いているファイル名を変更する
 * @param {string} newFileName 新しいファイル名
 */
function setOpenedFileName(newFileName){
  openedFileName = newFileName;
  if(openedFileName != ""){
    document.title = `${WINDOWTITLE} - ${path.basename(openedFileName)}`;
  }else{
    document.title = `${WINDOWTITLE}`;
  }
}

/**
 * セルのメニューにイベントハンドラを再セットする
 * @description swapColumn実施後、イベントハンドラが消えることがあるため再設定する
 * @param {HTMLTableCellElement} cell セルオブジェクト
 * @param {EventHandler} eventHandler イベントハンドラ
 */
function resetEventHandler(cell, eventHandler) {
  // SlickGrid対応必要
  cell.querySelectorAll(".dropdown-menu > li").forEach((i) => {
    let a = i.querySelector("a");
    a.removeEventListener("click", eventHandler);
    a.addEventListener("click", eventHandler);
  });
}

/**
 * 行を並び替える
 * @param {number} srcIndex 並び替え元の行インデックス
 * @param {number} dstIndex 並び替え先の行インデックス
 */
function swapRow(srcIndex, dstIndex){
  // SlickGrid対応必要
  console.log(`swapRow(${srcIndex}, ${dstIndex})`);
  let editorui = getEditorUI();
  if(1 > srcIndex || srcIndex >= editorui.rows.length - 1){
    throw "Range Error At srcIndex";
  }
  if(1 > dstIndex || dstIndex >= editorui.rows.length - 1){
    throw "Range Error At dstIndex";
  }
  if(srcIndex == dstIndex){
    throw "Index is Same";
  }
  // セルの並び替え
  let rows = editorui.rows;
  var src = rows[srcIndex];
  var dst = rows[dstIndex];
  var srcC = src.cloneNode(true);
  var dstC = dst.cloneNode(true);
  src.parentNode.replaceChild( dstC, src );
  dst.parentNode.replaceChild( srcC, dst );
  resetEventHandler(srcC.cells[0], rowmenu_onclick);
  resetEventHandler(dstC.cells[0], rowmenu_onclick);
}

/**
 * 行を削除する
 * @param {number} index 削除する行の行インデックス
 */
function removeRow(index){
  // SlickGrid対応必要
  let editorui = getEditorUI();
  if(1 > index || index >= editorui.rows.length - 1){
    throw "Range Error At index";
  }
  getEditorUI().deleteRow(index);
  renumber();
  aggregates();
}

/**
 * 列を並び替える
 * @param {number} srcIndex 並び替え元の列インデックス
 * @param {number} dstIndex 並び替え先の列インデックス
 */
function swapColumn(srcIndex, dstIndex){
  // SlickGrid対応必要
  console.log(`swapColumn(${srcIndex}, ${dstIndex})`);
  if(1 > srcIndex || srcIndex >= settings.rows.length){
    throw "Range Error At srcIndex";
  }
  if(1 > dstIndex || dstIndex >= settings.rows.length){
    throw "Range Error At dstIndex";
  }
  if(srcIndex == dstIndex){
    throw "Index is Same";
  }
  // 設定値の並び替え
  var tmp = settings.rows[srcIndex];
  settings.rows[srcIndex] = settings.rows[dstIndex];
  settings.rows[dstIndex] = tmp;
  // セルの並び替え
  let editorui = getEditorUI();
  let rows = editorui.rows;
  for (let i = 0; i < rows.length - 1; i++) {
    var src = rows[i].cells[srcIndex];
    var dst = rows[i].cells[dstIndex];
    var srcC = src.cloneNode(true);
    var dstC = dst.cloneNode(true);
    src.parentNode.replaceChild( dstC, src );
    dst.parentNode.replaceChild( srcC, dst );
    if(i == 0){
      resetEventHandler(srcC, colmenu_onclick);
      resetEventHandler(dstC, colmenu_onclick);
    }
  }
  saveSettings();
}

/**
 * 列を削除する
 * @param {number} index 削除する列のインデックス 
 */
function removeColumn(index){
  // SlickGrid対応必要
  if(1 > index || index >= settings.rows.length){
    throw "Range Error At index";
  }
  settings.rows.splice(index, 1);
  let editorui = getEditorUI();
  let rows = editorui.rows;
  for (let i = 0; i < rows.length - 1; i++) {
    rows[i].deleteCell( index );
  }
  saveSettings();
}

/**
 * カラム名称ダイアログを表示する
 * @param {boolean} append ダイアログはカラムを追加するか、それとも編集するか。初期値はfalse（編集ダイアログ）
 * @param {string} name 列の名称（デフォルト値）。初期値は空文字列
 * @param {ROLE} role 列のロール（デフォルト値）。初期値はROLE.CHAPTER
 * @returns ダイアログの結果を示すPromiseオブジェクト
 */
function showColumnDialog(append = false, name = "", role = ROLE.CHAPTER){
  // SlickGrid対応必要
  const dlg = document.querySelector("#dlg-columns");

  return new Promise((resolve, reject) => {
    // 初期値設定
    var judge = () => {
      let cn = document.querySelector("#dlg-columns_columnname");
      let cr = document.querySelector("#dlg-columns_columnrole");
      let msg = "";
      // 列名が空白または、すでに存在する列名でないかチェック
      // ※ ただし、列を編集するとき、列名を変えてなければエラーを出さない
      if(cn.value == ""){ msg = "列名を指定してください"; }
      else if((settings.rows.find(r => r.name == cn.value) != undefined || 
        !append && name == cn.value)){
        if(append){
          msg = "既存の列と<br>同じ名前の列は作成できません";        
        }else{
          msg = "既存の列と<br>同じ名前には変更できません";
        }
      }
      // すでに担当者列がないかどうかチェック
      if(!append || cr.value == ROLE.CHARGE){
        if(settings.rows.find(r => r.role == ROLE.CHARGE) != undefined){
          msg = "担当者列を二つ以上<br>定義することは出来ません";
        };
      }
      let err = document.querySelector("#dlg-columns_errormsg");
      document.querySelector("#dlg-columns_ok").disabled = msg != "";
      err.style.visibility = msg == "" ? "hidden" : "visible";
      err.innerHTML = msg == "" ? "&nbsp;" : msg;
      return msg == "";
    }
    let cn = document.querySelector("#dlg-columns_columnname");
    let cr = document.querySelector("#dlg-columns_columnrole");
    cn.value = name;
    judge();
    cn.onchange = judge;
    // 編集時はそもそもロールを変更できない（編集後の値チェックが必要になるので。現状は許可しない運用とする）
    cr.disabled = !append; 
    cr.onchange = judge;
    cr.value = role;
    // 表示
    dlg.showModal();

    function onClose(event){
      dlg.removeEventListener("close", onClose);
      if(dlg.returnValue === "ok"){
        // OK
        var cn = document.querySelector("#dlg-columns_columnname").value;
        var cr = document.querySelector("#dlg-columns_columnrole").value;
        resolve({name: cn, role: cr});
      } else{
        reject();
      }
    }
    dlg.addEventListener("close", onClose, {once: true});
  });
}

/**
 *  設定値を直ちに保存する
 */
function saveSettings(){
  const storage = require("electron-json-storage");
  storage.set("config", settings, (error) => {
    if(error){
      alert(error);
      throw error;
    } ;
  })
}

/**
 * 自動採番処理を実行する
 */
function renumber() {
  var start = new Date().getTime(); 
  console.log("renumber started");
  // 章番号配列の作成
  var no = [];
  var indexes = [];
  var cprev;
  var ccur;
  settings.rows.forEach((r) => {
    if(r.role == ROLE.CHAPTER){
      indexes.push(r.name);
      no.push(0);
    }
  })
  cprev = Array.from(no);
  ccur = Array.from(no);
  // 採番処理の開始
  for (let i = 0; i < tabledata.length; i++) {
    // カレント行の章題取得
    indexes.forEach((item, index) => {
      ccur[index] = (tabledata[i][item] + "").trim();
    });
    // 前の行と変わった題名の箇所は？
    for (let l = 0; l < indexes.length; l++) {
      if(cprev[l] != ccur[l]){
        no[l] += 1;
        no.fill(1, l + 1);
        break;
      }
    }
    cprev = Array.from(ccur);
    let num = no.join("-");
    tabledata[i]["項番"] = num;
  }
  redrawGrid();
  
  console.log(`renumber finished ${new Date().getTime() - start} ms`);
}

/**
 * 集計行の再集計処理を行う
 */
function aggregates() {
  var start = new Date().getTime(); 
  console.log("aggregate started");
  // 集計配列の作成
  var aggregate = {};
  var charge = undefined;
  settings.rows.forEach((r) => {
    if(r.role == ROLE.AGGREGATE){
      aggregate[r.name] = {TOTAL:0};
    }
    if(r.role == ROLE.CHARGE){
      charge = r.name;
    }
  })
  // 集計処理の開始
  for (let i = 0; i < tabledata.length; i++) {
    Object.keys(aggregate).forEach((a) => {
      let c = parseFloat(tabledata[i][a]);
      cn = isNaN(c) ? 0 : c;
      aggregate[a].TOTAL += cn;
      if(charge != undefined){
        let name = "e" + tabledata[i][charge];
        aggregate[a][name] = (aggregate[a][name] || 0) + cn;
      }
    })
  }

  console.log(aggregate);
  var aggregates_fields = document.querySelector("#aggregates_fields");
  aggregates_fields.innerHTML = "";
  Object.keys(aggregate).forEach((a, i) => {
    let section = document.createElement("section");
    let title = document.createElement("h2");
    let dl = document.createElement("dl");
    let dt = document.createElement("dt");
    let dd = document.createElement("dd");
    section.appendChild(title);
    section.appendChild(dl);
    title.textContent = a;
    dt.textContent = "合計";
    dd.textContent = aggregate[a].TOTAL;
    dd.className = "label label-primary";
    dl.appendChild(dt);
    dl.appendChild(dd);
    // 担当者別集計を列挙
    Object.keys(aggregate[a]).forEach((key) => {
      if(key.charAt(0) == "e"){
        let dt = document.createElement("dt");
        let dd = document.createElement("dd");
        dt.textContent = key.substring(1);
        dd.textContent = aggregate[a][key];
        dl.appendChild(dt);
        dl.appendChild(dd);
        dd.className = "label label-info";
      }
    });
    aggregates_fields.appendChild(section);
  });

  console.log(`aggregate finished ${new Date().getTime() - start} ms`);
}

/**
 * ヘッダ行を再設定する
 * @param {HTMLElement} editorui テーブルオブジェクト
 */
function resetHeaderRow(editorui) {
  var columns = [];
  settings.rows.forEach((r, i) => {
    var column = {}; 
    column.id = r.name;
    column.name = r.name;
    column.field = r.name;
    column.cssClass = "role_" + r.role.toLowerCase();
    switch (r.role) {
      case ROLE.STATIC:
        column.focusable = false;
        column.sortable = true;
        column.behavior = "selectAndMove";
        column.toolTip = "行のダブルクリックで行を削除します";
        break;
      case ROLE.CHAPTER:
        column.sortable = true;
        column.editor = Slick.Editors.Text;
        break;
      case ROLE.AGGREGATE:
        column.sortable = true;
        column.editor = Slick.Editors.Text;
        break;
      case ROLE.CHARGE:
        column.sortable = true;
        column.editor = Slick.Editors.Text;
        break;
      case ROLE.TEXT:
        column.editor = Slick.Editors.LongText;
        break;
      case ROLE.NUMBER:
        column.sortable = true;
        column.editor = Slick.Editors.Integer;
        break;
      case ROLE.DATE:
        column.sortable = true;
        column.editor = Slick.Editors.Date;
        break;
      default:
        throw `Invalid Role At ${r.name}`;
        break;
    }
    columns.push(column);
  });
  if(grid != undefined){
    grid.setColumns(columns);
  }else{
    grid = createSlickGrid(columns); 
  }
}

/**
 * 数秒間だけ表示されるトーストを表示する
 * @param {string} message メッセージ
 * @param {string} type メッセージのタイプ。success, info, warning, dangerが指定可能
 */
function toast(message, type ="info") {
  let t = document.querySelector("#toast");
  if(t.dataset.timerid != undefined)
  {
    clearTimeout(t.dataset.timerid);
    t.dataset.timerid = undefined;
  }
  t.textContent = message;
  t.className = `alert alert-${type}`;
  t.style.display = "block";
  t.dataset.timerid = setTimeout(() => {
    $("#toast").fadeOut();
  }, 5000);
}

/**
 * 初期化
 */
function init(){
  // 初期値設定
  settings = {
    // TODO: デフォルト値を外部化
    rows : [
      {
        name: "項番",
        role: ROLE.STATIC
      },{
        name: "章",
        role: ROLE.CHAPTER
      },{
        name: "作業工数",
        role: ROLE.AGGREGATE
      },{
        name: "備考",
        role: ROLE.TEXT
      }
    ]
  }
  document.title = WINDOWTITLE;
  // 設定値読み込み
  const storage = require("electron-json-storage");

  new Promise((resolve, reject) => {
    storage.get("config", (error, data) => {
      if(error){
        alert(error);
        throw error;
      } ;
  
      if(Object.keys(data).length != 0){
        settings = data;
      }
      resolve();
    });
  }).then(() => {
    console.log(settings);
    // テーブル初期化
    let editorui = getEditorUI();
    resetHeaderRow(editorui);
  });
}

/**
 * 行ヘッダメニューのイベントハンドラ
 * @param {EventArgs} event
 */
function rowmenu_onclick(event){
  // SlickGrid対応必要
  let editorui = getEditorUI();
  let a = event.target.nodeName == "A" ? event.target : event.target.parentNode;
  var rowid = a.parentNode.parentNode.parentNode.parentNode.parentNode.rowIndex;
  var toid;
  let action = a.dataset.role;
  switch (action) {
    case "+":
      toid = rowid + 1;
      if(toid >= editorui.rows.length - 1){
        toid = 1;
      }
      swapRow(rowid, toid);
      break;
    case "-":
      toid = rowid - 1;
      if(toid <= 0){
        toid = editorui.rows.length - 2;
      }
      swapRow(rowid, toid);
      break;
    case "x":
      if(confirm("行を削除してもよろしいですか？")){
        removeRow(rowid);
      }
      break;
    default:
      throw "unknown method";
      break;
  }
}

/**
 * 列ヘッダメニューのイベントハンドラ
 * @param {EventArgs} event イベント発生時のオブジェクトを示す
 */
function colmenu_onclick(event){
  // SlickGrid対応必要
  let editorui = getEditorUI();
  let rowobject = editorui.rows[0];
  let a = event.target.nodeName == "A" ? event.target : event.target.parentNode;
  var colid = a.parentNode.parentNode.parentNode.parentNode.cellIndex;
  var toid;
  let action = a.dataset.role;
  switch (action) {
    case "+":
      toid = colid + 1;
      if(toid >= rowobject.cells.length){
        toid = 1;
      }
      swapColumn(colid, toid);
      break;
    case "-":
      toid = colid - 1;
      if(toid <= 0){
        toid = rowobject.cells.length;
      }
      swapColumn(colid, toid);
      break;
    case "x":
      if(confirm("列を削除してもよろしいですか？")){
        removeColumn(colid);
      }
      break;
    default:
      throw "unknown method";
      break;
  }
}

/**
 * セルの変更が行われた際に呼び出されるイベントハンドラ
 * @param {EventTarget} e イベント発生源を示すEventTarget
 */
function cells_onblur(e){
  if(e.target.dataset.role == ROLE.CHAPTER){
    renumber();
  }
  if(e.target.dataset.role == ROLE.AGGREGATE){
    aggregates();
  }

}

/**
 * 画面リサイズ時に、Containerをリサイズする
 */
function resizeObject() {
  let hsize = $(window).height();
  let fsize = $("footer").height() * 2;
  $("#container").css("height", (hsize - fsize) + "px");
}
$(document).ready(() => {
  resizeObject();
});
$(window).resize(() => {
  resizeObject();
});

init();