const packager = require("electron-packager");
const exec = require('child_process').exec;
const path = require('path');

// 毎回オプションを書き直すのは面倒くさいのでpackage.jsonから引っ張ってくる
const package = require("./package.json");
let exeName = "pedit"
packager({
    dir: ".",
    name: "PlanEditor",
    appCopyright: `Copyright (C) 2018 ${package["author"]}.`,
    appVersion: package["version"],
    arch: "x64",
    aser: true,
    executableName: exeName,
    icon: "./icon/appicon.ico",
    out: "./dist",
    overwrite: true,
    platform: "win32",
    versionString: {
        CompanyName: "横浜IT勉強会",
        FileDescription: package["description"],
        OriginalFilename: `${exeName}.exe`,
        ProductName: "PlanEditor",
        InternalName: "WDChamomile"
    }
    
}, function (err, appPaths) {// 完了時のコールバック
    if (err) console.log(err);
    console.log("Done: " + appPaths);
    exec(path.join("" + appPaths, exeName + ".exe"));
});