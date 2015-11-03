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

    var errorDB = function (deferred, error) {
        alert("##openDatabase: " + error);
        deferred.resolve(false);

    }
    var openDB = function (successcallback, errorcallback) {
      var _do = function () {
                cordovaSQLite.execQueryArrayResult("select * from version", [],
                    successcallback,
                    //                    function (version) {
                    //                        console.log("get version: " + version);
                    //                        deferred.resolve(true);
                    //                    },
                    errorcallback
                    //                    function (error) {
                    //                        alert("##execQueryArrayResult: " + error);
                    //                        deferred.resolve(false);
                    //
                    //                    }
                );
            };

      if (db == null) {
        db = cordovaSQLite.openDatabase(cordova.file.dataDirectory + "/routesdb", false,
            _do,
            errorcallback
        );
      } else {
        _do();
      }

    }
    var process = function (url) {
        var deferred = $q.defer();
        JSZipUtils.getBinaryContent(url, function (err, data) {
            if (err) {
                deferred.reject(err);
                return;
            }
            var jszipobj = new JSZip(data);
            Object.keys(jszipobj.files).forEach(function (key) {
                $cordovaFile.createFile(cordova.file.dataDirectory, "routesdb", true)
                    .then(function (success) {
                        $cordovaFile.writeExistingFile(cordova.file.dataDirectory, "routesdb", jszipobj.file(key).asArrayBuffer())
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
        openDB(function () {
            deferred.resolve(true);
        }, function () {
            deferred.resolve(false);
        });
        return deferred.promise;
    }

    var mapVersions = function (arrayOfVersions) {
        var returnVersions = {};
        for (var i = 0; i < arrayOfVersions.length; ++i)
            returnVersions[arrayOfVersions[i][0]] = parseInt(arrayOfVersions[i][1]);
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
        var err = function (error) {
            deferred.reject(error);
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
                })
                .error(err);
        }, err);
        return deferred.promise;
    }
    return {
        doQuery: function(query, params) {
          var deferred = $q.defer();
          var _do = function () {
                  cordovaSQLite.execQuerySingleResult(query, params,
                      function(result) {
                        deferred.resolve(result);
                      },
                      function(err) {
                        deferred.reject(err);
                      }
                  );
              };
          if (db == null) {
            db = cordovaSQLite.openDatabase(cordova.file.dataDirectory + "/routesdb", false,
                _do,
                function(err) {
                  deferred.reject(err);
                }
            );
          } else {
            _do;
          }
          return deferred.promise;
        },
        dbSetup: function () {
            var deferred = $q.defer();
            var err = function (error) {
                deferred.reject(error);
                console.log("NOT synch");

            }
            var success = function () {
                    deferred.resolve(true);
                    console.log("synch done");

                }
                //check if db is present
                //if no, use local db.zip and create (copy file) db with that
                //
                //after all check local version vs remote version of db using an end point
                //if remote > local download zip and change db file

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
