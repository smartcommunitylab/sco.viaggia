'use strict';

const fs = require('fs');

function save(json, fileName) {
    fs.writeFile(fileName, JSON.stringify(json), (err) => {
        if (err) throw err;
        console.log('Data written to file');
    });
}

function update(json) {
    
    let pois = json.features;
    for (let poi of pois) {
        if (poi.properties.title == undefined)
            poi.properties.title = {"en": poi.properties.name, "it": poi.properties.name};
        if (poi.properties.address == undefined)
            poi.properties.address = poi.properties.geo;
    }
}

let json = {};
var myArgs = process.argv.slice(2);
console.log('myArgs: ', myArgs);
console.log(myArgs[0]);
console.log(myArgs[1]);

fs.readFile(myArgs[0], (err, data) => {
    if (err) throw err;
    json = JSON.parse(data);
    //console.log(data);
    update(json);
    save(json, myArgs[1]);
});





console.log('This is after the write call');