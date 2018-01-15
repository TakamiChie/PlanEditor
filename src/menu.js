// ref:https://github.com/theodi/comma-chameleon/blob/master/main/menu.js
exports.menu = [
  {
    label: "ファイル",
  },
  {
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