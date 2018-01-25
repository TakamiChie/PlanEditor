const ROLE = {
  CHAPTER: "CHAPTER",
  AGGREGATE: "AGGREGATE",
  CHARGE: "CHARGE",
  TEXT: "TEXT",
  NUMBER: "NUMBER",
  DATE: "DATE",
  STATIC: "STATIC"
}

let settings = {
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
};

require("electron").ipcRenderer.on("appendColumn", (e) => {
  menuop_append_column();
});

//////////// メニュー用メソッド //////////////

function menuop_append_column() {
  showColumnDialog().then((value) => {
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
    // 最終行の列数追加
    rows[rows.length - 1].colspan = settings.rows.length + 1;
  });
}
//////////// 各種メソッド //////////////

/**
 * セルを追加する
 * @param rowobject 行を示すオブジェクト
 * @param insertindex セルを追加するインデックス。省略時-1
 * @param role セルのロール。省略時ROLE.STATIC
 * @param value セルの値。省略時は空文字列
 * @param header セルはヘッダセルかどうか。省略時false
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
 * @param {*name} name 列の名称（デフォルト値）。初期値は空文字列
 * @param {*role} role 列のロール（デフォルト値）。初期値はROLE.CHAPTER
 * @returns ダイアログの結果を示すPromiseオブジェクト
 */
function showColumnDialog(name = "", role = ROLE.CHAPTER){
  const dlg = document.querySelector("#dlg-columns");

  return new Promise((resolve, reject) => {
    // 初期値設定
    var refresh = () => {
      let e = document.querySelector("#dlg-columns_columnname");
      document.querySelector("#dlg-columns_ok").disabled = e.value == "";
    }
    document.querySelector("#dlg-columns_columnname").value = name;
    refresh();
    document.querySelector("#dlg-columns_columnname").onchange = refresh;
    document.querySelector("#dlg-columns_columnrole").value = role;
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
 * 初期化
 */
function init(){
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