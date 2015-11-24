#!/usr/bin/env node

// this plugin replaces arbitrary text in arbitrary files
//
// Look for the string CONFIGURE HERE for areas that need configuration
//

var fs = require('fs');
var path = require('path');

var rootdir = process.argv[2];

//PROCEDURE TO COPY THE PROTO CONFIG FILE TO THE WORKING CONFING FILE
var srcfile = path.join(rootdir, "config", "config-proto.xml");
var destfile = path.join(rootdir, "config.xml");
//var destfile = path.join(rootdir, "test.xml");
var destdir = path.dirname(destfile);
if (fs.existsSync(srcfile) && fs.existsSync(destdir)) {
    fs.createReadStream(srcfile).pipe(fs.createWriteStream(destfile));
}
