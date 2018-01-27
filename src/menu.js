// ref:https://github.com/theodi/comma-chameleon/blob/master/main/menu.js
exports.menu = [
  {
    label: "ファイル(&F)",
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