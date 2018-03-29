const clickAction = (item, window, event) => {
  window.webContents.send(item.id);
}

exports.menu = [
  {
    id: "execprint",
    label: "印刷実行(&E)",
    click: clickAction,
    accelerator: "F5",
  },
  {
    id: "display",
    label: "表示(&V)",
    submenu: [
      {
        id: "date",
        label: "日付(&D)",
        type: "checkbox",
        click: clickAction
      },
      {
        id: "filename",
        label: "ファイル名(&F)",
        type: "checkbox",
        click: clickAction
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
        click: (item, window, event) => { window.toggleDevTools(); }
      }
    ]
  },
  {
    id: "cancel",
    label: "キャンセル(&C)",
    click: (item, window, event) => { window.close(); },
    accelerator: "Esc",
  },
]
