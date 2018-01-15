const ROLE = {
  CHAPTER: "CHAPTER",
  AGGREGATE: "AGGREGATE",
  CHARGE: "CHARGE",
  TEXT: "TEXT",
  NUMBER: "NUMBER",
  DATE: "DATE",
  STATIC: "STATIC"
}

function createCell({
  rowobject, 
  insertIndex = -1,
  role = ROLE.STATIC,
  value = "",
} = {}){
  if(rowobject == undefined){
    throw new Error("Argument `rowobject` is not defined");
  }
  let cell = rowobject.insertCell(insertIndex);
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
