#!/usr/bin/env node

//
// This hook copies various resource files
// from our version control system directories
// into the appropriate platform specific location


// configure all the files to copy.
// Key of object is the source file,
// value is the destination location.
// It's fine to put all platforms' icons
// and splash screen files here, even if
// we don't build for all platforms
// on each developer's box.

var filestocopy = [
    {
        "resources/notification.png": "platforms/android/app/src/main/res/drawable-hdpi/notification.png"
	},
    {
        "resources/notification.png": "platforms/android/app/src/main/res/drawable-ldpi/notification.png"
	},
    {
        "resources/notification.png": "platforms/android/app/src/main/res/drawable-mdpi/notification.png"
	},
    {
        "resources/notification.png": "platforms/android/app/src/main/res/drawable-xhdpi/notification.png"
	},
    {
        "resources/notification.png": "platforms/android/app/src/main/res/drawable-xxhdpi/notification.png"
	},
    {
        "resources/notification.png": "platforms/android/app/src/main/res/drawable-xxxhdpi/notification.png"
	},
    {
        "resources/notification.png": "platforms/android/app/src/main/res/drawable/notification.png"
	}
];

var fs = require('fs');
var path = require('path');

// no need to configure below
var rootdir = process.argv[2];

filestocopy.forEach(function (obj) {
    Object.keys(obj).forEach(function (key) {
        var val = obj[key];
        var srcfile = path.join(rootdir, key);
        var destfile = path.join(rootdir, val);
        //console.log("copying "+srcfile+" to "+destfile);
        var destdir = path.dirname(destfile);
        if (!fs.existsSync(destdir)) {
            fs.mkdirSync(destdir);
        }
        if (fs.existsSync(srcfile) && fs.existsSync(destdir)) {
            fs.createReadStream(srcfile).pipe(
                fs.createWriteStream(destfile));
        }
    });
});
