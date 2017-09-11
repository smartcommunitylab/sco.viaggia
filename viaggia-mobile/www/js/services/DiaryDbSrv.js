angular.module('viaggia.services.diaryDb', [])

    .factory('DiaryDbSrv', function ($q, $http, Config, LoginService) {
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
                tx.executeSql('CREATE TABLE IF NOT EXISTS Events (id PRIMARY KEY, type, timestamp,travelValidity, event)');
            }, function (error) {
                console.log('creation DB: ' + error.message);
                deferred.reject();
            }, function () {
                console.log('creation DB database OK');
                deferred.resolve();
            });
            return deferred.promise;

        }
        var insertData = function (synch, data) {
            //insert array data into the table
            var deferred = $q.defer();
            var dbArray = [];
            for (var i = 0; i < data.length; i++) {
                entityId = data[i].clientId ? data[i].clientId : data[i].entityId;
                dbArray.push(['INSERT OR REPLACE INTO Events VALUES (?,?,?,?,?)', [
                    entityId,
                    data[i].type,
                    data[i].timestamp,
                    data[i].travelValidity,
                    JSON.stringify(data[i])
                ]]);
                // dbArray.push(['UPDATE Events SET type=?, timestamp=?, travelValidity=?, event=? WHERE id LIKE ?', [
                //     data[i].type,
                //     data[i].timestamp,
                //     data[i].travelValidity,
                //     JSON.stringify(data[i],
                //         data[i].entityId,
                //     )
                // ]]);
                // dbArray.push(['INSERT OR REPLACE INTO Events (id, type, timestamp,travelValidity, event)  VALUES (?,?,?,?,?)',
                //     [
                //         data[i].entityId,
                //         data[i].type,
                //         data[i].timestamp,
                //         data[i].travelValidity,
                //         JSON.stringify(data[i])
                //     ]
                // ]
                // );
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





        //get diary from server from timestamp to now. If timestamp is null get 
        //all diary
        var getRemoteData = function (timestamp) {
            var deferred = $q.defer();
            var url = Config.getServerURL() + '/diary'
            if (timestamp) {
                url = url + '?from=' + timestamp + '&to=' + new Date().getTime();
            }
            LoginService.getValidAACtoken().then(
                function (token) {
                    $http({
                        method: 'GET',
                        url: url,
                        headers: {
                            'Authorization': 'Bearer ' + token,
                            'appId': Config.getAppId(),
                        },
                        timeout: Config.getHTTPConfig().timeout
                    })
                        .success(function (diary) {
                            //localStatus = status;
                            deferred.resolve(diary);
                        })

                        .error(function (response) {
                            deferred.reject(response);
                        });
                },
                function () {
                    deferred.reject();
                }
            );
            return deferred.promise;

        }

        //get the entire diary of the user if it is not present
        var installDB = function () {
            var deferred = $q.defer();
            getRemoteData().then(function (diary) {
                //create db
                createDB().then(function () {
                    //insert into db the notification and update timestamp
                    insertData(false, diary).then(function () {
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
        //return url of diary
        var getDataURL = function () {
            return Config.getServerURL() + '/diary/' + Config.getAppId();
        }


        //overwrite last time of sync
        var updateSynchTimestamp = function () {
            localStorage.setItem(Config.getAppId() + DIARY_SYNC_TIME, new Date().getTime());
        }
        var getLastTimeSynch = function () {
            var deferred = $q.defer();
            //check if last pending get the time of that event
            var now = new Date();
            now.setDate(now.getDate() - 7);
            deferred.resolve(now.getTime());
            //right now I synch last week
            // getFirstPending().then(function (value) {
            //     if (value)
            //     { deferred.resolve(value.timestamp); }
            //     else {
            //         deferred.resolve(localStorage.getItem(Config.getAppId() + DIARY_SYNC_TIME));
            //     }
            // }, function (err) {
            //     deferred.reject();
            // })
            return deferred.promise;
        }

        //synch db from last time synch or from oldest pending travel
        var synchDB = function () {
            var deferred = $q.defer();
            var err = function (e) {
                console.log("DB SYNC ERROR: " + e);
                deferred.reject(e);
            }
            var success = function (diary) {
                insertData(true, diary).then(function () {
                    updateSynchTimestamp();
                    deferred.resolve(true);
                }, function (err) {
                    deferred.reject();
                });
            }
            //check last time of synch with time or pending event get the last elements from that period
            getLastTimeSynch().then(function (value) {
                getRemoteData(value).then(success, err);
            });
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

        //Return the oldest timestamp of pending travel
        var getFirstPending = function () {
            var deferred = $q.defer();
            //convert type to multiple types for the query
            db.transaction(function (tx) {
                var query = 'SELECT *  FROM Events WHERE travelValidity=\'PENDING\' ORDER BY timestamp';
                var params = [];

                tx.executeSql(query, params, function (tx, rs) {
                    if (rs.rows.item(0))
                    { deferred.resolve(rs.rows.item(0)) }
                    else {
                        deferred.resolve(null);
                    }
                }, function (tx, error) {
                    console.log('SELECT error: ' + error.message);
                    deferred.reject();
                })
            });
            return deferred.promise;
        }



        //initialization of db. If first run it installs the db from scratch
        //otherwise synch with server for update
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
        diaryDbService.addEvent = function (event) {
            //insert the single event into diary using array form
            insertData(false, [event]);
        }

        // read events of specific type "from" to "to"
        diaryDbService.readEvents = function (type, from, to) {
            var deferred = $q.defer();
            //convert type to multiple types for the query
            db.transaction(function (tx) {
                var query = 'SELECT *  FROM Events WHERE ';
                var params = [];
                if (type) {
                    query = query + 'type LIKE \'%'+type+'%\' AND';
                    //params.push(type);
                }
                query = query + ' timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC';
                params.push(from);
                params.push(to);
                tx.executeSql(query, params, function (tx, rs) {
                    var returnData = [];
                    for (var i = 0; i < rs.rows.length; i++) {
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
