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

let settings;

require("electron").ipcRenderer.on("appendColumn", (e) => {
  menuop_append_column();
});

//////////// メニュー用メソッド //////////////

function menuop_append_column() {
  showColumnDialog(true).then((value) => {
    // 設定値更新
    settings.rows.push({name: value.name, role: value.role});
    let editorui = document.querySelector("#editorui");
    let rows = editorui.rows;
    // セルの追加
    for (let i = 0; i < rows.length - 1; i++) {
      if(i == 0){
        // ヘッダ行
        createCell({
          rowobject: rows.item(i),
          value: value.name,
          insertIndex: -1,
          header: true
        });
      }else{
        // データ行
        createCell({
          rowobject: rows.item(i),
          role: value.role,
          insertIndex: -1,
        });        
      }
    }
    lastRowUpdate();
    saveSettings();
  });
}
//////////// 各種メソッド //////////////

/**
 * セルを追加する
 * @param {HTMLRowObject} rowobject 行を示すオブジェクト
 * @param {number} insertindex セルを追加するインデックス。省略時-1
 * @param {ROLE} role セルのロール。省略時ROLE.STATIC
 * @param {string} value セルの値。省略時は空文字列
 * @param {boolean} header セルはヘッダセルかどうか。省略時false
 */
function createCell({
  rowobject, 
  insertIndex = -1,
  role = ROLE.STATIC,
  value = "",
  header = false
} = {}){
  if(rowobject == undefined){
    throw new Error("Argument `rowobject` is not defined");
  }
  let cell;
  if(header){
    cell = document.createElement("th");
    if(insertIndex == -1){
      rowobject.appendChild( cell );
    }else{
      rowobject.insertBefore( cell, rowobject.rows[insertIndex] );
    }
  }else{
    cell = rowobject.insertCell(insertIndex);
  }
  if(role == ROLE.STATIC){
    // セルはラベル
    cell.contentEditable = false;
  }else{
    // セルは編集可能
    cell.contentEditable = true;
    cell.className = "editable";
  }
  cell.dataset.role = role;
  cell.textContent = value;
  return cell;
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
    var refresh = () => {
      let e = document.querySelector("#dlg-columns_columnname");
      document.querySelector("#dlg-columns_ok").disabled = e.value == "";
    }
    let cn = document.querySelector("#dlg-columns_columnname");
    let cr = document.querySelector("#dlg-columns_columnrole");
    cn.value = name;
    refresh();
    cn.onchange = refresh;
    // 編集時はそもそもロールを変更できない（編集後の値チェックが必要になるので。現状は許可しない運用とする）
    cr.disabled = !append; 
    cr.onchange = (e) => {
      let ok = true;
      let msg = "&nbsp;";
      if(e.target.value == ROLE.CHARGE){
        // すでに担当者列がないかどうかチェック
        settings.rows.forEach(r => {
          if(r.role == ROLE.CHARGE){
            ok = false;
            msg = "担当者列を二つ以上定義することは出来ません";
          } ;
        });
      }
      document.querySelector("#dlg-columns_ok").disabled = !ok;
      let err = document.querySelector("#dlg-columns_errormsg");
      err.style.visibility = ok ? "hidden" : "visible";
      err.textContent = msg;
  }
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
 * 最後の行（行の追加ボタン）のサイズを更新する
 */
function lastRowUpdate(){
  console.log("lastRowUpdate");
  console.log(settings.rows.length);
  let editorui = document.querySelector("#editorui");
  // 最終行の列数追加
  editorui.rows[editorui.rows.length - 1].cells[0].colSpan = settings.rows.length;
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
 * 初期化
 */
function init(){
  // 初期値設定
  settings = {
    // TODO: デフォルト値を外部化
    rows : [
      {
        name: "No",
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
    let editorui = document.querySelector("#editorui");
    var row = editorui.insertRow(editorui.rows.length - 1);
    settings.rows.forEach(r => {
      createCell({
        rowobject: row,
        insertIndex: -1,
        role: ROLE.STATIC,
        value: r.name,
        header: true
      })
    });
    lastRowUpdate();
  });
}

document.querySelector("#appendrow").addEventListener("click", () =>{
  let editorui = document.querySelector("#editorui");
  let row = editorui.insertRow(editorui.rows.length - 1);
  settings.rows.forEach(r => {
    createCell({
      rowobject: row,
      insertIndex: -1,
      role: r.role,
      value: "",
    });
  });
  // TODO: renumber();
});

init();