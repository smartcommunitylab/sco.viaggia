angular.module('viaggia.services.data', [])

.factory('DataManager', function ($http, $q, $cordovaSQLite, $cordovaFile, Config) {
    var LOCAL_DATA_URL = 'data/routesdb.zip';
    var dataURL = LOCAL_DATA_URL;
    var completeData = null;
    var errorHandler = function (e) {
        console.log(e);
    };
    // limit the data to the necessary one only
    var db = null;

    var getDBFileShortName = function() {
      return Config.getAppId() + "routesdb";
    };
    var getDBPath = function() {
      if (ionic.Platform.isIOS()) {
        return cordova.file.documentsDirectory;
      } else if (ionic.Platform.isAndroid()) {
        var filesdir = cordova.file.dataDirectory;
        if (filesdir.charAt(filesdir.length-1) == '/') {
          filesdir = filesdir.substr(0, filesdir.length - 1);
        }
        filesdir = filesdir.substr(0, filesdir.lastIndexOf('/'))+'/databases/';
        return filesdir;
      } else {
        return cordova.file.dataDirectory;
      }
    }
    var getDBFileName = function() {
      return getDBPath() + getDBFileShortName();
    };

    var errorDB = function (deferred, error) {
        alert("##openDatabase: " + error);
        deferred.resolve(false);

    }

    var doWithDB = function(successcallback, errorcallback) {
      if (db == null) {
        window.sqlitePlugin.openDatabase({
            name: getDBFileShortName(),
            bgType: 1,
            skipBackup: true
        }, function(dbres){
          db = dbres;
          successcallback();
        },function(){
          console.log('DBOPEN ERROR');
          errorcallback();
        });
//        db = cordovaSQLite.openDatabase(getDBFileName(), false,
//            _do,
//            errorcallback
//        );
      } else {
        successcallback();
      }
    };

    var size = function(obj) {
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    };

    var convertData = function(res) {
      var data = [];
      var rowsize = 0;
      if (res.rows.length > 0) {
        rowsize = size(res.rows.item(0));
        for (var i = 0; i < res.rows.length; i++) {
//          var rowArray = [];
//          var row = res.rows.item(i);
//          for (var key in row) {
//            rowArray.p
//          }
          var row = res.rows.item(i);
          if (rowsize == 1) {
            for (var k in row) data.push(row[k]);
          }
          else data.push(row);
        }
      }
      if (data.length == 1 && rowsize == 1) return data[0];
      return data;
    };

    var openDB = function (successcallback, errorcallback) {
      var _do = function () {
        db.executeSql("select * from version", [], function(res) {
          var data = convertData(res);
          successcallback(data);
        }, errorcallback);
//                cordovaSQLite.execQueryArrayResult("select * from version", [],
//                    successcallback,
//                    errorcallback
//                );
      };
      doWithDB(_do,errorcallback);

    }
    var process = function (url) {
        var deferred = $q.defer();
        JSZipUtils.getBinaryContent(url, function (err, data) {
            if (err) {
              console.log("Error reading ZIP file: "+err);
                deferred.reject(err);
                return;
            }
            console.log("Reading ZIP file");
            var jszipobj = new JSZip(data);
            Object.keys(jszipobj.files).forEach(function (key) {
                $cordovaFile.createFile(getDBPath(), getDBFileShortName(), true)
                    .then(function (success) {
                        var f = jszipobj.file(key);
                        $cordovaFile.writeFile(getDBPath(), getDBFileShortName(), jszipobj.file(key).asArrayBuffer(), true)
                            .then(function (success) {
                                console.log('success copy');
                                deferred.resolve(true);

                            }, function (error) {
                                console.log('error copy');
                                deferred.reject(error);

                            });
                    }, function (error) {
                        console.log('error creation');
                        deferred.reject(error);
                    });
            });
        });
        return deferred.promise;
    };



    var getDataURL = function (remote) {
        if (remote) {
            return Config.getServerURL() + '/routesDB/' + Config.getAppId();

        } else {
            return LOCAL_DATA_URL;
        }
    }

    var installDB = function (remote) {
        return process(getDataURL(remote));

    }

    var localDBisPresent = function () {
        var deferred = $q.defer();
        //return true if a localdb is present
        openDB(function (res) {
            deferred.resolve(res.length > 0);
        }, function () {
            console.log("DB file does not exist!");
            deferred.resolve(false);
        });
        return deferred.promise;
    }

    var mapVersions = function (arrayOfVersions) {
        var returnVersions = {};
         for (var i = 0; i < arrayOfVersions.length; ++i) {
           returnVersions[''+arrayOfVersions[i].agencyID] = arrayOfVersions[i].version;
         }
//        for (var i = 0; i < arrayOfVersions.length; ++i)
//            returnVersions[arrayOfVersions[i][0]] = parseInt(arrayOfVersions[i][1]);
        return returnVersions;
    }

    var getLocalVersion = function () {
        var deferred = $q.defer();
        //return true if a localdb is present
        openDB(function (versions) {
            //turn array into map
            deferred.resolve(mapVersions(versions));
        }, function (error) {
            deferred.reject(error);
        });
        return deferred.promise;
    }


    var compareversions = function (localversions, remoteversions) {
        //compare versions. If localversions<remoteversions for some element return -1, in other case 0
        for (var key in localversions) {
            if (remoteversions.hasOwnProperty(key)) {
                if (localversions[key] < remoteversions[key]) {
                    return -1
                }
            }
        }
        return 0;
    }

    var synchDB = function () {
        var deferred = $q.defer();
        var err = function (e) {
            console.log("DB SYNC ERROR: "+e);
            deferred.reject(e);
        }
        var success = function () {
            deferred.resolve(true);
        }
        getLocalVersion().then(function (localversion) {
            $http.get(Config.getServerURL() + '/versions')
                .success(function (remoteversion) {
                    if (compareversions(localversion, remoteversion) < 0) {
                        installDB(true).then(success, err); //remote
                    } else {
                        success();
                    }
                    syncStops(remoteversion);
                })
                .error(err);
        }, err);
        return deferred.promise;
    }

    var syncStops = function() {
            $http.get(Config.getServerURL() + '/versions')
            .success(function (remoteversion) {
                syncStopsForVersions(remoteversion);
            })
            .error(function (error) {
              console.error('ERROR SYNC STOP DATA: '+error);
            });
    };

    var readLocalStopVersions = function() {
      var localStopVersionsKey = Config.getAppId()+"_localStopVersions";
      var localVersions = localStorage[localStopVersionsKey];
      if (localVersions) localVersions = JSON.parse(localVersions);
      else localVersions = {};
      return localVersions;
    };
    var writeLocalStopVersion = function(agency,version) {
      var localStopVersionsKey = Config.getAppId()+"_localStopVersions";
      var lv = readLocalStopVersions();
      lv[agency] = version;
      localStorage[localStopVersionsKey] = JSON.stringify(lv);
    };

    var syncStopsForVersions = function(remoteversion) {
      var agencies = Config.getAppAgencies();
      var versions = {};
      var localStopVersionsKey = Config.getAppId()+"_localStopVersions";
      var localversion = readLocalStopVersions();

      agencies.forEach(function(a){
        var key = Config.getAppId()+"_stops_"+a
        var localStops = localStorage[key];
        var localVersion = localversion[a] ? localversion[a] : -1;
        var remoteVersion = remoteversion[a] ? remoteversion[a] : -1;

        if (!localStops || localVersion < remoteVersion) {
            $http.get(Config.getServerURL() + '/geostops/'+a+'?lat='+Config.getMapPosition().lat+'&lng='+Config.getMapPosition().long+'&radius=5')
            .success(function (stops) {
              if (Object.prototype.toString.call( stops ) === '[object Array]') {
                localStorage[key] = JSON.stringify(stops);
                writeLocalStopVersion(a, remoteVersion);
              }
            })
            .error(function (error) {
              console.error('ERROR SYNC STOP DATA: '+error);
            });
        }
      });
    }

    return {
        doQuery: function(query, params) {
          var deferred = $q.defer();
          var _do = function () {
            db.executeSql(query, params, function(res) {
              var data = convertData(res);
              deferred.resolve(data);
            }, function(err) {
              deferred.reject(err);
            });
//                  cordovaSQLite.execQuerySingleResult(query, params,
//                      function(result) {
//                        deferred.resolve(result);
//                      },
//                      function(err) {
//                        deferred.reject(err);
//                      }
//                  );
              };
          doWithDB(_do,function(e) {
                  console.error("!DB ERROR: "+e);
                  deferred.reject(e);
                });
          return deferred.promise;
        },
        syncStopData : syncStops,
        dbSetup: function () {
            var deferred = $q.defer();
            var err = function (error) {
                deferred.reject(error);
                console.log("NOT synch: "+error);

            }
            var success = function () {
                    deferred.resolve(true);
                    console.log("synch done");

                }

            //try to open db (check if db is present)
            localDBisPresent().then(function (result) {
                //use local version of db in data/routesdb.zip
                if (!result) {
                    installDB(false).then(function () {
                        synchDB().then(success, err);
                    }, err);
                } else {
                    synchDB().then(success, err);
                }
            }, err);
            return deferred.promise;

        }

    };
});
