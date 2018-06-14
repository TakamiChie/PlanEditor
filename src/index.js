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
   * セルは特に意味を持たない真偽値セルであることを示す。
   */
  BOOLEAN: "BOOLEAN",
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
const ipc = electron.ipcRenderer;
const remote = electron.remote;
const BrowserWindow = remote.BrowserWindow;
const dialog = remote.dialog;
const path = require('path');

let settings;
let openedFileName;
var grid;
var tabledata = [];

ipc.on("fileOpen", (e, arg) => {
  menuop_fileOpen(arg);
});

ipc.on("fileSave", (e, args) => {
  if(args.saveas){
    menuop_fileSaveAs(args);
  }else{
    menuop_fileSave(args);
  }
});

ipc.on("fileClose", (e) => {
  menuop_fileClose();
});

ipc.on("print", (e) => {
  menuop_print();
});

ipc.on("appendColumn", (e) => {
  menuop_append_column();
});

ipc.on("columnMoveToLeft", (e) => {
  menuop_move_column(-1);
});

ipc.on("columnMoveToRight", (e) => {
  menuop_move_column(1);
});

ipc.on("columnRemove", (e) => {
  if(confirm(settings.columns[grid.getActiveCell().cell].name + "を削除しますか？")){
    removeColumn(grid.getActiveCell().cell);
  }
});

ipc.on("rowMoveToUpper", (e) => {
  menuop_move_row(-1);
});

ipc.on("rowMoveToLower", (e) => {
  menuop_move_row(1);
});

ipc.on("rowRemove", (e) => {
  if(confirm(tabledata[grid.getActiveCell().row]["項番"] + "を削除しますか？")){
    removeRow(grid.getActiveCell().row);
  }  
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

/**
 * 印刷
 */
function menuop_print(){
  ipc.send("request_openwindow_print", {
    fileName: openedFileName,
    column:  settings.columns,
    data: tabledata,
    aggregatesdata: aggregates(false)
  });
}
function menuop_append_column() {
  showColumnDialog(true).then((value) => {
    // 設定値更新
    settings.columns.push({name: value.name, role: value.role});
    resetHeaderRow(getEditorUI());
    renumber();
    aggregates();
    saveSettings();
  });
}

/**
 * 列を移動する
 * @param {number} direction 移動方向。1または-1
 */
function menuop_move_column(direction) {
  let i = grid.getActiveCell();
  let a = swapColumn(i.cell, i.cell + direction);
  grid.setActiveCell(i.row, a[1]);
  renumber();
}

/**
 * 行を移動する
 * @param {number} direction 移動方向。1または-1
 */
function menuop_move_row(direction){
  let i = grid.getActiveCell();
  let a = swapRow(i.row, i.row + direction);
  grid.setActiveCell(a[1], i.cell);
  renumber();
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
        settings.columns = loadData.columns;
        let editorui = getEditorUI();
        // ファイル読み込み
        resetHeaderRow(editorui);

        // テーブルデータ読み込み
        let table = loadData.data;
        tabledata = [];
        table.forEach(rowdata => {
          var row = {}
          settings.columns.forEach(r => {
            if(r.name != "項番"){
              let rd = rowdata["data"];
              row[r.name] = rd[r.name];
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
        cellMenuUpdate();
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
  serialize["columns"] = settings.columns;
  serialize["data"] = [];
  tabledata.forEach((data) => {
    let rowprop = {}
    let rowdata = {}
    settings.columns.forEach(c => {
      rowdata[c.name] = (data[c.name] || "");
    });
    rowprop["data"] = rowdata;
    serialize["data"].push(rowprop);
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
  cellMenuUpdate();
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
 * カラム/行操作系メニューのEnabledを切り替える
 * @param {boolean} column 列操作系メニューのEnabledを切り替える
 * @param {boolean} row 行操作系メニューのEnabledを切り替える
 */
function cellMenuUpdate(column = true, row = true) {
  if(column){ ipc.send("column_menu_state", settings.columns.length > 2); }
  if(row){ ipc.send("row_menu_state", tabledata.length > 1); }
}
/**
 * 行を並び替える
 * @param {number} srcIndex 並び替え元の行インデックス
 * @param {number} dstIndex 並び替え先の行インデックス
 */
function swapRow(srcIndex, dstIndex){
  if(srcIndex == dstIndex){
    throw "Index is Same";
  }
  let sd = [srcIndex, dstIndex];
  for (let i = 0; i < sd.length; i++) {
    if(sd[i] > tabledata.length - 1){
      sd[i] = 0;
    }
    if(sd[i] < 0){
      sd[i] = tabledata.length - 1;
    }
  };
  srcIndex = sd[0];
  dstIndex = sd[1];
  console.log(`swapRow(${srcIndex}, ${dstIndex})`);
  redrawGrid([srcIndex,dstIndex], () => {
    var src = tabledata[srcIndex];
    var dst = tabledata[dstIndex];
    tabledata[dstIndex] = src;
    tabledata[srcIndex] = dst;
    grid.setData(tabledata, false);
  });
  renumber();
  return [srcIndex, dstIndex];
}

/**
 * 行を削除する
 * @param {number} index 削除する行のインデックス 
 */
function removeRow(index){
  if(1 > index || index >= settings.columns.length){
    throw "Range Error At index";
  }
  redrawGrid(undefined, () => {
    tabledata.splice(index, 1);
  })
  renumber();
  aggregates();
}

/**
 * 列を並び替える
 * @param {number} srcIndex 並び替え元の列インデックス
 * @param {number} dstIndex 並び替え先の列インデックス
 * @returns {array} 実際に並び替えた列のインデックス
 */
function swapColumn(srcIndex, dstIndex){
  if(srcIndex == dstIndex){
    throw "Index is Same";
  }
  let sd = [srcIndex, dstIndex];
  for (let i = 0; i < sd.length; i++) {
    if(sd[i] > settings.columns.length - 1){
      sd[i] = 1;
    }
    if(sd[i] < 1){
      sd[i] = settings.columns.length - 1;
    }
  };
  srcIndex = sd[0];
  dstIndex = sd[1];
  console.log(`swapColumn(${srcIndex}, ${dstIndex})`);
  // 設定値の並び替え
  var tmp = settings.columns[srcIndex];
  settings.columns[srcIndex] = settings.columns[dstIndex];
  settings.columns[dstIndex] = tmp;
  resetHeaderRow(getEditorUI());
  saveSettings();
  return [srcIndex, dstIndex];
}

/**
 * 列を削除する
 * @param {number} index 削除する列のインデックス 
 */
function removeColumn(index){
  if(1 > index || index >= settings.columns.length){
    throw "Range Error At index";
  }
  settings.columns.splice(index, 1);
  resetHeaderRow(getEditorUI());
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
      else if((settings.columns.find(r => r.name == cn.value) != undefined || 
        !append && name == cn.value)){
        if(append){
          msg = "既存の列と<br>同じ名前の列は作成できません";        
        }else{
          msg = "既存の列と<br>同じ名前には変更できません";
        }
      }
      // すでに担当者列がないかどうかチェック
      if(!append || cr.value == ROLE.CHARGE){
        if(settings.columns.find(r => r.role == ROLE.CHARGE) != undefined){
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
  settings.columns.forEach((r) => {
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
      ccur[index] = (tabledata[i][item] || "").trim();
    });
    // 前の行と変わった題名の箇所は？(空白は上と同じとみなす)
    for (let l = 0; l < indexes.length; l++) {
      if(ccur[l] && cprev[l] != ccur[l]){
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
 * @param {boolean} display_update 表示の更新を行う。falseを指定すると、更新を行わず戻り値のみ返却する
 * @returns {object} 集計結果を示すデータ
 */
function aggregates(display_update = true) {
  var start = new Date().getTime(); 
  console.log("aggregate started");
  // 集計配列の作成
  var aggregate = {};
  var charge = undefined;
  settings.columns.forEach((r) => {
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
  if(display_update){
    let status = "";
    let hint = "";
    Object.keys(aggregate).forEach((a, i) => {
      status += `${a}: ${aggregate[a].TOTAL}`;
      hint += `${a}: ${aggregate[a].TOTAL}\n`; 
      Object.keys(aggregate[a]).forEach((key) => {
        if(key.charAt(0) == "e" && key.length > 1){
          hint += `  ${key.substring(1)}: ${aggregate[a][key]}\n`;
        }
      });
    });
    var aggregates_fields = document.querySelector("#sb_aggregates");
    aggregates_fields.textContent = status;
    aggregates_fields.title = hint;
  }

  return aggregate;
  console.log(`aggregate finished ${new Date().getTime() - start} ms`);
}

/**
 * ヘッダ行を再設定する
 * @param {HTMLElement} editorui テーブルオブジェクト
 */
function resetHeaderRow(editorui) {
  var columns = [];
  settings.columns.forEach((r, i) => {
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
      case ROLE.BOOLEAN:
        column.editor = Slick.Editors.Checkbox;
        column.formatter = Slick.Formatters.YesNo;
        break;
      case ROLE.NUMBER:
        column.sortable = true;
        column.editor = Slick.Editors.Integer;
        break;
      case ROLE.DATE:
        column.sortable = true;
        column.editor = Slick.Editors.Date;
        column.formatter = Slick.Formatters.LocaleSupportedDate;
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
 * ステータスバーに文字列を設定する
 * @param {*} text ステータスバーに表示する値
 */
function setStatus(text) {
  document.querySelector("#sb_status").textContent = text.toString();
}

/**
 * 初期化
 */
function init(){
  // 初期値設定
  settings = {
    // TODO: デフォルト値を外部化
    columns : [
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
    if(settings.rows){
      settings.columns = settings.rows;
      delete settings.rows;
    }
    // ウィンドウ設定の復元
    let window = BrowserWindow.getFocusedWindow()
    if(settings.bounds){
      window.setPosition(settings.bounds.x, settings.bounds.y, false);
      window.setSize(settings.bounds.width, settings.bounds.height, false);
    }
    if(settings.maximized) window.maximize();
    if(settings.fullScreen) window.fullscreen();

    console.log(settings);
    // テーブル初期化
    let editorui = getEditorUI();
    resetHeaderRow(editorui);
  });
}

/**
 * アンロード前の処理を行う
 */
function beforeUnload(){
  // ウィンドウ設定の保存
  let window = BrowserWindow.getFocusedWindow();
  if(!window.isMaximized() && !window.isFullScreen()){
    settings.bounds = window.getBounds();
  }
  settings.maximized = window.isMaximized();
  settings.fullscreen = window.isFullScreen();
  saveSettings();
  event.preventDefault();
}

window.addEventListener("beforeunload", beforeUnload);
init();