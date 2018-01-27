// ref:https://github.com/theodi/comma-chameleon/blob/master/main/menu.js
const {dialog} = require("electron");
const def_filters = [{
  name: "PlanEditorファイル(*.pln)",
  extensions: ['pln']
}]
exports.menu = [
  {
    label: "ファイル(&F)",
    submenu: [
      {
        label: "ファイルを開く(&O)",
        accelerator: "CmdOrCtrl+O",
        click: function() {
          dialog.showOpenDialog(
            BrowserWindow.getFocusedWindow(),
            {
              title: "ファイルを開く",
              defaultPath: app.getPath("documents"),
              properties: ["openFile"],
              filters: def_filters
            },
            (filepath) => {
              BrowserWindow.getFocusedWindow().webContents.send("fileOpen", filepath); 
            });
        }
      },
      {
        label: "上書き保存(&S)",
        accelerator: "CmdOrCtrl+S",
        click: function() { BrowserWindow.getFocusedWindow().webContents.send("fileSave"); }
      },
      {
        label: "名前を付けて保存(&S)",
        click: function() {
          dialog.showSaveDialog(
            BrowserWindow.getFocusedWindow(),
            {
              title: "ファイルを保存",
              defaultPath: app.getPath("documents"),
              filters: def_filters
            },
            (filepath) => {
              BrowserWindow.getFocusedWindow().webContents.send("fileSave", filepath); 
            });
        }
      },
      {
        label: "ファイルを閉じる(&C)",
        click: function() {
          BrowserWindow.getFocusedWindow().webContents.send("fileClose"); 
        }
      },
      {
        type: "separator"
      },
      {
        label: "終了(&X)",
        role: 'quit'
      }
    ]
  },
  {
    label: "計画(&P)",
    submenu: [
      {
        label: "列の追加(&C)",
        click: function() { BrowserWindow.getFocusedWindow().webContents.send("appendColumn"); }
      }
    ]
  },
  {
    label: "ヘルプ(&H)",
    submenu: [
      {
        label: "開発者ツール(&D)",
        accelerator: "CmdOrCtrl+Shift+I",
        click: function() { BrowserWindow.getFocusedWindow().toggleDevTools(); }
      }
    ]
  }
]