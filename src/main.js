// reference:https://qiita.com/TigRig/items/64d55b5fc5483b01c3b5
"use strict";

global.electron = require("electron");
global.app = electron.app;
global.Menu = electron.Menu;
global.BrowserWindow = electron.BrowserWindow;
let mainWindow = null;
var template = require('./menu').menu;

app.on("window-all-closed", () => {
  if(process.platform != "darwin"){
    app.quit();
  }
});

app.on("ready", () => {
  mainWindow = new BrowserWindow({width: 640, height: 390, useContentSize: true, show: false});

  mainWindow.loadURL("file://" + __dirname + "/index.html");

  mainWindow.once("ready-to-show", () => {
    var menu = Menu.buildFromTemplate(template);
    mainWindow.setMenu(menu);
    mainWindow.show();
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
});