var ncp = require('ncp').ncp;
var fs = require('fs');

ncp.limit = 16;

var profile = null;
if (process.argv.length < 3) {
    console.error("Profile name arg is missing, read curren_profile.txt...");
    profile = fs.readFileSync("config/current_profile.txt");
    console.log("Found "+profile);
} else {
    profile = process.argv[2];
}

if (profile == null) {
    console.error("Profile name is missing!");
} else {
    ncp("www/chcp.json", "config/instances/"+profile+"/www", function (err) {
     if (err) {
       return console.error(err);
     }
     console.log('done!');
    });
    ncp("www/chcp.manifest", "config/instances/"+profile+"/www", function (err) {
        if (err) {
          return console.error(err);
        }
        console.log('done!');
       });
}


