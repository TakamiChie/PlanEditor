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
  grid.getSelectionModel(new Slick.CellSelectionModel());
  grid.onAddNewRow.subscribe((e, args) => {
    var item = args.item;
    redrawGrid(tabledata.length, () => {
      tabledata.push(item);
    });
    renumber();
    aggregates();
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