angular.module('viaggia.services.diaryDb', [])

    .factory('DiaryDbSrv', function ($q, $http, Config, userService, GameSrv) {
        var diaryDbService = {};
        var DIARY_SYNC_TIME = "_diary_synch_time";
        var db = null;
        var errorHandler = function (e) {
            console.log(e);
        };


        //return db name
        var getDBFileShortName = function () {
            return Config.getAppId() + "diaryDb";
        };

        //return the path of db
        var getDBPath = function () {
            if (ionic.Platform.isIOS()) {
                return cordova.file.documentsDirectory;
            } else if (ionic.Platform.isAndroid()) {
                var filesdir = cordova.file.dataDirectory;
                if (filesdir.charAt(filesdir.length - 1) == '/') {
                    filesdir = filesdir.substr(0, filesdir.length - 1);
                }
                filesdir = filesdir.substr(0, filesdir.lastIndexOf('/')) + '/databases/';
                return filesdir;
            } else {
                return cordova.file.dataDirectory;
            }
        }
        var getDBFileName = function () {
            return getDBPath() + getDBFileShortName();
        };
        var errorDB = function (deferred, error) {
            alert("##openDatabase: " + error);
            deferred.resolve(false);

        }
        var createDB = function (data) {
            var deferred = $q.defer()

            db.transaction(function (tx) {
                tx.executeSql('DROP TABLE IF EXISTS Events')
                tx.executeSql('CREATE TABLE IF NOT EXISTS Events (type, timestamp, event)');
                // tx.executeSql('CREATE TABLE IF NOT EXISTS Events (type, timestamp, values)');
            }, function (error) {
                console.log('creation DB: ' + error.message);
                deferred.reject();
            }, function () {
                console.log('creation DB database OK');
                deferred.resolve();
            });
            return deferred.promise;

        }
        var insertData = function (data) {
            //insert array data into the table
            var deferred = $q.defer();
            var dbArray = [];
            for (let i = 0; i < data.length; i++) {
                dbArray.push(['INSERT INTO Events VALUES (?,?,?)',
                    [
                        data[i].type,
                        data[i].timestamp,
                        JSON.stringify(data[i])
                    ]
                ]
                );
            }
            db.sqlBatch(dbArray, function () {
                console.log('Populated database OK');
                deferred.resolve();
            }, function (error) {
                console.log('SQL batch ERROR: ' + error.message);
                deferred.reject();
            });
            return deferred.promise;
        }
        var doWithDB = function (successcallback, errorcallback) {
            if (db == null) {
                window.sqlitePlugin.openDatabase({
                    name: getDBFileShortName(),
                    bgType: 1,
                    skipBackup: true,
                    iosDatabaseLocation: 'Documents'
                }, function (dbres) {
                    db = dbres;
                    successcallback();
                }, function () {
                    console.log('DBOPEN ERROR');
                    errorcallback();
                });
            } else {
                successcallback();
            }
        };

        var size = function (obj) {
            var size = 0,
                key;
            for (key in obj) {
                if (obj.hasOwnProperty(key)) size++;
            }
            return size;
        };

        var convertData = function (res) {
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
                    } else data.push(row);
                }
            }
            if (data.length == 1 && rowsize == 1) return data[0];
            return data;
        };
        var openDB = function (successcallback, errorcallback) {
            var _do = function () {
                // db.executeSql("select * from Events", [], function (res) {
                db.executeSql("SELECT * FROM  Events LIMIT 1", [], function (res) {
                    var data = convertData(res);
                    successcallback(data);
                }, errorcallback);
            };
            doWithDB(_do, errorcallback);
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


        var getAllDiary = function () {
            var deferred = $q.defer();
            $http.get(getDataURL())
                .success(function (diary) {
                    return deferred.resolve(diary);
                })
                .error(function (error) {
                    console.error('ERROR SYNC STOP DATA: ' + error);
                    deferred.reject();
                });
            return deferred.promise;


        }
        var getRemoteData = function (timestamp) {
            var deferred = $q.defer();
            $http.get(getDataURL())
                .success(function (diary) {
                    deferred.resolve(diary);
                })
                .error(function (error) {
                    console.error('ERROR SYNC STOP DATA: ' + error);
                    deferred.reject();
                });
            return deferred.promise;


        }
        //get the entire story of the user if it is not present
        var installDB = function () {
            var deferred = $q.defer();
            getAllDiary().then(function (diary) {
                //create db
                createDB().then(function () {
                    //insert into db the notification and update timestamp
                    insertData(diary).then(function () {
                        deferred.resolve(diary);
                    }, function (err) {
                        deferred.reject();
                    });
                }, function (err) {
                    deferred.reject();
                });


            }, function (err) {
                deferred.reject();
            });
            return deferred.promise;
        }
        var getDataURL = function () {
            return 'data/messages.json'
            // return Config.getServerURL() + '/diary/' + Config.getAppId();
        }
        // var installDB = function () {
        //     return process(getDataURL());

        // }

        //overwrite 
        var updateSynchTimestamp = function () {
            localStorage.setItem(Config.getAppId() + DIARY_SYNC_TIME, new Date().getTime());
        }
        var getLastTimeSynch = function () {
            return localStorage.getItem(Config.getAppId() + DIARY_SYNC_TIME);
        }
        var synchDB = function () {
            var deferred = $q.defer();
            var err = function (e) {
                console.log("DB SYNC ERROR: " + e);
                deferred.reject(e);
            }
            var success = function (diary) {
                insertData(diary).then(function () {
                    updateSynchTimestamp();
                    deferred.resolve(true);
                }, function (err) {
                    deferred.reject();
                });
                //deferred.resolve(true);
            }
            //check last time of synch e get the last elements from that period
            getRemoteData(getLastTimeSynch()).then(success, err);

            return deferred.promise;
        }

        var syncStops = function () {
            $http.get(Config.getServerURL() + '/versions')
                .success(function (remoteversion) {
                    syncStopsForVersions(remoteversion);
                })
                .error(function (error) {
                    console.error('ERROR SYNC STOP DATA: ' + error);
                });
        };

        diaryDbService.dbSetup = function () {
            var deferred = $q.defer();
            var err = function (error) {
                deferred.reject(error);
                console.log("NOT synch: " + error);

            }
            var success = function () {
                updateSynchTimestamp();
                deferred.resolve(true);
                console.log("synch done");

            }

            //try to open db (check if db is present)
            localDBisPresent().then(function (result) {
                //use local version of db in data/routesdb.zip
                if (!result) {
                    installDB().then(success, err);
                } else {
                    synchDB().then(success, err);
                }
            }, err);
            return deferred.promise;

        }
        // add event to the diary
        diaryDbService.addEvent = function (event, type) {
            //insert the single event into diary using array form
            insertData([event]);
        }
        // read events of specific type "from" to "to"
        diaryDbService.readEvents = function (type, from, to) {
            var deferred = $q.defer();
            //convert type to multiple types for the query
            db.transaction(function (tx) {
                tx.executeSql('SELECT *  FROM Events WHERE type = ? AND timestamp >= ? AND timestamp <= ?', [type, from, to], function (tx, rs) {
                    // console.log('count ' + rs.rows.length);
                    var returnData = [];
                    for (let i = 0; i < rs.rows.length; i++) {
                        returnData.push(rs.rows.item(i));
                    }
                    deferred.resolve(returnData);
                }, function (tx, error) {
                    console.log('SELECT error: ' + error.message);
                    deferred.reject();
                })
            });
            return deferred.promise;
        }

        return diaryDbService;
    })
