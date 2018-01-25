const ROLE = {
  CHAPTER: "CHAPTER",
  AGGREGATE: "AGGREGATE",
  CHARGE: "CHARGE",
  TEXT: "TEXT",
  NUMBER: "NUMBER",
  DATE: "DATE",
  STATIC: "STATIC"
}

require("electron").ipcRenderer.on("appendColumn", (e) => {
  const dlg = document.querySelector("#dlg-append-columns");
  return new Promise((resolve, reject) => {
    dlg.showModal();

    function onClose(event){
      dlg.removeEventListener("close", onClose);
      if(dlg.returnValue === "ok"){
        // OK
      } else{
        reject();
      }
    }
    dlg.addEventListener("close", onClose, {once: true});
  });
});

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
}

document.querySelector("#appendrow").addEventListener("click", () =>{
  let editorui = document.querySelector("#editorui");
  let row = editorui.insertRow(editorui.rows.length - 1);
  createCell({rowobject: row, value: "0"});
  createCell({rowobject: row, role: ROLE.CHAPTER, value: "test"});
  createCell({rowobject: row, role: ROLE.AGGREGATE, value: "0"});
  createCell({rowobject: row, role: ROLE.TEXT});
  createCell({rowobject: row});
});
