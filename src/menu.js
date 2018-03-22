// ref:https://github.com/theodi/comma-chameleon/blob/master/main/menu.js

const defClickAction = (item, window, event) => {
  window.webContents.send(item.id);
}

exports.menu = [
  {
    label: "ファイル(&F)",
    submenu: [
      {
        id: "fileOpen",
        label: "ファイルを開く(&O)",
        accelerator: "CmdOrCtrl+O",
        click: function() {
          BrowserWindow.getFocusedWindow().webContents.send("fileOpen", {
            directory: app.getPath("documents")
          });
        }
      },
      {
        id: "fileSave",
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
        id: "fileSaveAs",
        label: "名前を付けて保存(&S)",
        click: function() {
          BrowserWindow.getFocusedWindow().webContents.send("fileSave", {
            saveas: true,
            path: app.getPath("documents")
          });
        }
      },
      {
        id: "fileClose",
        label: "ファイルを閉じる(&C)",
        click: defClickAction
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
        id: "appendColumn",
        label: "列の追加(&C)",
        click: defClickAction,
      },
      {
        type: "separator"
      },
      {
        id: "columnMoveToLeft",
        label: "列を左へ移動(&L)",
        click: defClickAction,
        accelerator: "CmdOrCtrl+Alt+Left",
        enabled: false
      },
      {
        id: "columnMoveToRight",
        label: "列を右へ移動(&R)",
        click: defClickAction,
        accelerator: "CmdOrCtrl+Alt+Right",
        enabled: false
      },
      {
        id: "columnRemove",
        label: "列を削除(&M)",
        click: defClickAction,
        accelerator: "CmdOrCtrl+Delete",
        enabled: false
      },
      {
        type: "separator"
      },
      {
        id: "rowMoveToUpper",
        label: "行を上へ移動(&U)",
        click: defClickAction,
        accelerator: "CmdOrCtrl+Alt+Up",
        enabled: false
      },
      {
        id: "rowMoveToLower",
        label: "行を下へ移動(&W)",
        click: defClickAction,
        accelerator: "CmdOrCtrl+Alt+Down",
        enabled: false
      },
      {
        id: "rowRemove",
        label: "行を削除(&V)",
        click: defClickAction,
        accelerator: "CmdOrCtrl+Shift+Delete",
        enabled: false
      },
    ]
  },
  {
    label: "ヘルプ(&H)",
    submenu: [
      {
        id: "toggleDevTools",
        label: "開発者ツール(&D)",
        accelerator: "CmdOrCtrl+Shift+I",
        click: function() { BrowserWindow.getFocusedWindow().toggleDevTools(); }
      }
    ]
  }
]