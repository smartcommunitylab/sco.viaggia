#!/usr/bin/env node

// this plugin replaces arbitrary text in arbitrary files
//
// Look for the string CONFIGURE HERE for areas that need configuration
//

var fs = require('fs');
var path = require('path');

var rootdir = process.argv[2];

function replace_string_in_file(filename, to_replace, replace_with) {
    var data = fs.readFileSync(filename, 'utf8');

    var result = data.replace(new RegExp(to_replace, "g"), replace_with);
    fs.writeFileSync(filename, result, 'utf8');
}


//current profile indicates the profile you want to get
var currentProfileFile = path.join(rootdir, "config", "current_profile.txt");
var target = fs.readFileSync(currentProfileFile,'utf8')
console.log("il target è "+target);

if (process.env.TARGET) {
    target = process.env.TARGET;
}

if (rootdir) {
    //./config/profiles.json is the file that have all the placeholder value for each profile
    var profilesFile = path.join(rootdir, "config", "profiles.json");
    var configobj = JSON.parse(fs.readFileSync(profilesFile, 'utf8'));

    // filestoreplace is the file where you want to make the placeholder replacement
    var filestoreplace = [
        "config.xml",
        //"test.xml",
    ];
    filestoreplace.forEach(function(val, index, array) {
        var fullfilename = path.join(rootdir, val);
        if (fs.existsSync(fullfilename)) {
            for (var key in configobj[target]){
                var val = configobj[target][key];
                console.log("replace key: "+key+" with val: "+val);
                replace_string_in_file(fullfilename, "\\*"+key+"\\*", val);
            }
        } else {
            console.log("missing: "+fullfilename);
        }
    });
}
