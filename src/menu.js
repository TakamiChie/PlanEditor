// ref:https://github.com/theodi/comma-chameleon/blob/master/main/menu.js
exports.menu = [
  {
    label: "ファイル(&F)",
    submenu: [
      {
        label: "ファイルを開く(&O)",
        accelerator: "CmdOrCtrl+O",
        click: function() {
          BrowserWindow.getFocusedWindow().webContents.send("fileOpen", {
            directory: app.getPath("documents")
          });
        }
      },
      {
        label: "上書き保存(&S)",
        accelerator: "CmdOrCtrl+S",
        click: function() {
          BrowserWindow.getFocusedWindow().webContents.send("fileSave", {
            saveas: false,
            path: app.getPath("documents")
          });
        }
      },
      {
        label: "名前を付けて保存(&S)",
        click: function() {
          BrowserWindow.getFocusedWindow().webContents.send("fileSave", {
            saveas: true,
            path: app.getPath("documents")
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
      },
      {
        type: "separator"
      },
      {
        id: "columnMoveToLeft",
        label: "列を左へ移動(&L)",
        click: function() { BrowserWindow.getFocusedWindow().webContents.send("columnMoveToLeft"); },
        accelerator: "CmdOrCtrl+Alt+Left",
        enabled: false
      },
      {
        id: "columnMoveToRight",
        label: "列を右へ移動(&R)",
        click: function() { BrowserWindow.getFocusedWindow().webContents.send("columnMoveToRight"); },
        accelerator: "CmdOrCtrl+Alt+Right",
        enabled: false
      },
      {
        id: "columnRemove",
        label: "列を削除(&M)",
        click: function() { BrowserWindow.getFocusedWindow().webContents.send("columnRemove"); },
        accelerator: "CmdOrCtrl+Delete",
        enabled: false
      },
      {
        type: "separator"
      },
      {
        id: "rowMoveToUpper",
        label: "行を上へ移動(&U)",
        click: function() { BrowserWindow.getFocusedWindow().webContents.send("rowMoveToUpper"); },
        accelerator: "CmdOrCtrl+Alt+Up",
        enabled: false
      },
      {
        id: "rowMoveToLower",
        label: "行を下へ移動(&W)",
        click: function() { BrowserWindow.getFocusedWindow().webContents.send("rowMoveToLower"); },
        accelerator: "CmdOrCtrl+Alt+Down",
        enabled: false
      },
      {
        id: "rowRemove",
        label: "行を削除(&V)",
        click: function() { BrowserWindow.getFocusedWindow().webContents.send("rowRemove"); },
        accelerator: "CmdOrCtrl+Shift+Delete",
        enabled: false
      },
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