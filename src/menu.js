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