// reference:https://qiita.com/TigRig/items/64d55b5fc5483b01c3b5
"use strict";

global.electron = require("electron");
global.app = electron.app;
global.Menu = electron.Menu;
global.BrowserWindow = electron.BrowserWindow;
let mainWindow = null;
var template = require('./menu').menu;
const ipc = electron.ipcMain;
const menu = Menu.buildFromTemplate(template);

app.on("window-all-closed", () => {
  if(process.platform != "darwin"){
    app.quit();
  }
});

app.on("ready", () => {
  mainWindow = new BrowserWindow({width: 640, height: 390, useContentSize: true, show: false});

  mainWindow.loadURL("file://" + __dirname + "/index.html");

  mainWindow.once("ready-to-show", () => {
    mainWindow.setMenu(menu);
    mainWindow.show();
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
});

/// IPC Events

/**
 * カラム系メニューのEnabledをきりかえる
 */
ipc.on("column_menu_state", (event, arg) => {
  menu.getMenuItemById("columnMoveToLeft").enabled = arg;
  menu.getMenuItemById("columnMoveToRight").enabled = arg;
  menu.getMenuItemById("columnRemove").enabled = arg;
})

/**
 * 行系メニューのEnabledをきりかえる
 */
ipc.on("row_menu_state", (event, arg) => {
  menu.getMenuItemById("rowMoveToUpper").enabled = arg;
  menu.getMenuItemById("rowMoveToLower").enabled = arg;
  menu.getMenuItemById("rowRemove").enabled = arg;
})

/**
 * プリントダイアログを開く
 * @param {string} arg.fileName ファイル名
 * @param {array} arg.column 列データ
 * @param {array} arg.data テーブルデータ
 * @param {object} arg.aggregatesdata 集計データ
 */
ipc.on("request_openwindow_print", (event, arg) => {
  let window = new BrowserWindow({
    parent: BrowserWindow.getFocusedWindow(),
    modal: true,
    width: 480,
    height: 640,
    show: false,
    skipTaskbar: true,
  });
  window.loadURL(`file://${__dirname}/printdialog/print.html`);
  const printMenu = require('./printdialog/menu').menu;
  window.setMenu(Menu.buildFromTemplate(printMenu));
  ipc.once("ready", () => { window.show(); });
  window.once("ready-to-show", () => {
    window.webContents.send("init", arg);
  });
});