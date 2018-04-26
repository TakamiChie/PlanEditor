const packager = require("electron-packager");
// 毎回オプションを書き直すのは面倒くさいのでpackage.jsonから引っ張ってくる
const package = require("./package.json");

packager({
    dir: ".",
    name: package["name"],
    appCopyright: `Copyright (C) 2018 ${package["author"]}.`,
    appVersion: package["version"],
    arch: "x64",
    aser: true,
    executableName: "pedit",
    icon: "./icon/appicon.ico",
    out: "./dist",
    overwrite: true,
    platform: "win32",
    versionString: {
        CompanyName: "横浜IT勉強会",
        FileDescription: package["name"],
        OriginalFilename: "pedit.exe",
        ProductName: package["name"],
        InternalName: "WDChamomile"
    }
    
}, function (err, appPaths) {// 完了時のコールバック
    if (err) console.log(err);
    console.log("Done: " + appPaths);
});