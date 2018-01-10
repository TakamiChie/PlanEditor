document.querySelector("#appendrow").addEventListener("click", () =>{
  let editorui = document.querySelector("#editorui");
  let row = editorui.insertRow(editorui.rows.length - 1);
  let cNum = row.insertCell(-1);
  cNum.innerHTML = "0-0-0-0";

  let cTitle = row.insertCell(-1);
  cTitle.contentEditable = true;
  cTitle.className ="editable";
  cTitle.innerHTML = "test";
  
  let cVolume = row.insertCell(-1);
  cVolume.contentEditable = true;
  cVolume.className ="editable";
  cVolume.innerHTML = "0";
  
  let cDescription = row.insertCell(-1);
  cDescription.contentEditable = true;
  cDescription.className ="editable";
  cDescription.innerHTML = "test";
  
  let cGraph = row.insertCell(-1);
});
