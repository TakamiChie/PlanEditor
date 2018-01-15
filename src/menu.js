// ref:https://github.com/theodi/comma-chameleon/blob/master/main/menu.js
exports.menu = [
  {
    label: "ファイル",
  },
  {
    label: "計画",
    submenu: [
      {
        label: "列の追加",
        click: function() { BrowserWindow.getFocusedWindow().webContents.send("appendColumn"); }
      }
    ]
  },
  {
    label: "ヘルプ",
    submenu: [
      {
        label: "開発者ツール",
        accelerator: "CmdOrCtrl+Shift+I",
        click: function() { BrowserWindow.getFocusedWindow().toggleDevTools(); }
      }
    ]
  }
]