// ref:https://github.com/theodi/comma-chameleon/blob/master/main/menu.js
exports.menu = [
  {
    label: "ファイル(&F)",
    submenu: [
      {
        label: "ファイルを開く(&O)",
        click: function() { BrowserWindow.getFocusedWindow().webContents.send("fileOpen"); }
      },
      {
        label: "上書き保存(&S)",
        click: function() { BrowserWindow.getFocusedWindow().webContents.send("fileSave"); }
      },
      {
        label: "名前を付けて保存(&S)",
        click: function() { BrowserWindow.getFocusedWindow().webContents.send("fileSaveAs"); }
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