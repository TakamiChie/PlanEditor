/**
 * エディタUIを取得
 * @return エディタUIを示すHTMLTableElement
 */
function getEditorUI(){
  return document.querySelector("#editorui");
}

/**
 * Slickgridを作成する
 * @param {*} columns カラムデータを格納した配列
 */
function createSlickGrid(columns) {
  let options = {
    editable: true,
    enableAddRow: true,
    enableCellNavigation: true,
    asyncEditorLoading: false,
    autoEdit: false,
    enableColumnReorder: false
  }
  grid = new Slick.Grid("#editorui", tabledata, columns, options);
  grid.setSelectionModel(new Slick.RowSelectionModel());
  var moveRowsPlugin = new Slick.RowMoveManager({
    cancelEditOnDrag: true
  });
  moveRowsPlugin.onBeforeMoveRows.subscribe(function (e, data) {
    for (var i = 0; i < data.rows.length; i++) {
      // no point in moving before or after itself
      if (data.rows[i] == data.insertBefore || data.rows[i] == data.insertBefore - 1) {
        e.stopPropagation();
        return false;
      }
    }
    return true;
  });
  moveRowsPlugin.onMoveRows.subscribe(function (e, args) {
    var extractedRows = [], left, right;
    var rows = args.rows;
    var insertBefore = args.insertBefore;
    left = tabledata.slice(0, insertBefore);
    right = tabledata.slice(insertBefore, tabledata.length);
    rows.sort(function(a,b) { return a-b; });
    for (var i = 0; i < rows.length; i++) {
      extractedRows.push(tabledata[rows[i]]);
    }
    rows.reverse();
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (row < insertBefore) {
        left.splice(row, 1);
      } else {
        right.splice(row - insertBefore, 1);
      }
    }
    tabledata = left.concat(extractedRows.concat(right));
    var selectedRows = [];
    for (var i = 0; i < rows.length; i++)
      selectedRows.push(left.length + i);
    grid.resetActiveCell();
    grid.setData(tabledata);
    grid.setSelectedRows(selectedRows);
    grid.render();
    renumber();
  });
  grid.registerPlugin(moveRowsPlugin);

  grid.onDblClick.subscribe((e, args) => {
    if(args.cell == 0 && tabledata[args.row] && tabledata[args.row]["項番"] && 
      confirm(tabledata[args.row]["項番"] + "を削除しますか？")){
      redrawGrid(undefined, () => {
        tabledata.splice(args.row, 1);
      })
      renumber();
      aggregates();
    }
  });

  grid.onAddNewRow.subscribe((e, args) => {
    var item = args.item;
    redrawGrid(tabledata.length, () => {
      tabledata.push(item);
    });
    renumber();
    aggregates();
    cellMenuUpdate(false, true);
  });
  
  grid.onCellChange.subscribe((e, args) => {
    switch (settings.rows[args.cell].role) {
      case ROLE.AGGREGATE:
      case ROLE.CHARGE:
        aggregates();  
        break;
      case ROLE.CHAPTER:
        renumber();
        break;
      default:
        break;
    }
  })
  grid.onActiveCellChanged.subscribe((e, args) => {
    if(grid.getCellNode(args.row, args.cell) != null){
      setStatus(grid.getCellNode(args.row, args.cell).textContent);
    }else{
      setStatus("");
    }
    cellMenuUpdate();
  });
  return grid;
}

/**
 * グリッドの再描画を行う
 * @param {number|array} rowIndex 再描画する行インデックス。配列か数値を指定可能。どちらも指定しなかった場合、すべての行を再描画する。
 * @param {function} inProcess invalidateRowメソッド呼び出しの直後に実行される処理。テーブルデータの処理などを行う。
 */
function redrawGrid(rowIndex, inProcess) {
  if(typeof rowIndex == "number"){ grid.invalidateRow(rowIndex); }
  else if(typeof rowIndex == "object"){ grid.invalidateRows(rowIndex); }
  else{ grid.invalidateAllRows(); }
  if(typeof inProcess == "function"){ inProcess(); }
  grid.updateRowCount();
  grid.render();
}