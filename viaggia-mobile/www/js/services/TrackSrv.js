angular.module('viaggia.services.tracking', [])
    .factory('trackService', function (backgroundGeoLocationFake, Config, $q, $http, $state, $filter, userService, $ionicPlatform) {
        //var trackingIntervalInMs = 500;
        //var accelerationDetectionIntervalInMs = 500;
        //var accelerationSensorDelay = 0;
        //var minimumAccuracyInMeter = 100;
        var trackService = {};
        var bgGeo = {};

        $ionicPlatform.ready(function () {
            bgGeo = window.BackgroundGeolocation;
        });
        trackService.sendServerStart = function (idTrip) {
            var deferred = $q.defer();
            userService.getValidToken().then(function (token) {

                $http({
                    method: 'PUT',
                    url: Config.getServerURL() + '/gamification/journey/' + idTrip,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    }
                }).success(function () {
                    deferred.resolve(true);
                }).error(function (err) {
                    console.log(err)
                    deferred.reject(false);
                });
            });
            return deferred;

        }
        trackService.start = function (trip, idTrip) {
            //            window.plugins.tracking.start(successCallback, errorCallback, trackingIntervalInMs, accelerationDetectionIntervalInMs, accelerationSensorDelay);
            //window.plugins.tracking.start(function successCallback(param) {
            //    console.log(param);
            //}, function errorCallback(param) {
            //    console.log(param);
            //}, "idTrip+" + new Date().getTime(), new Date().getTime() + 1000, "46.074494", "11.142317", trackingIntervalInMs, minimumAccuracyInMeter);
            ////params=successCallback, errorCallback, idTrip, endTime, latEnd, longEnd, trackingIntervalInMs, minimumAccuracyInMeter
            // Turn ON the background-geolocation system.  The user will be tracked whenever they suspend the app.
            userService.getValidToken().then(function (token) {

                var endtimeDate = new Date(trip.endtime);
                var today = new Date();
                endtimeDate.setFullYear(today.getFullYear());
                endtimeDate.setMonth(today.getMonth());
                endtimeDate.setDate(today.getDate());
                var endTime = endtimeDate.getTime() + Config.getThresholdEndTime();
                //configuro il plugin con i vari param
                var trackingConfigure = Config.getTrackingConfig();
                var startTimestamp = new Date().getTime();
                var minutesOfRun = (endTime - startTimestamp) / 60000;
                //trackingConfigure['stopAfterElapsedMinutes'] = minutesOfRun;
                trackingConfigure['stopAfterElapsedMinutes'] = 1;
                trackingConfigure['headers'] = {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token

                    },

                    bgGeo.configure(callbackFn, failureFn, trackingConfigure);
                //setto le variabili in localstorage
                localStorage.setItem(Config.getAppId() + '_state', 'TRACKING');
                localStorage.setItem(Config.getAppId() + '_tripId', idTrip);
                localStorage.setItem(Config.getAppId() + '_startTimestamp', startTimestamp);
                localStorage.setItem(Config.getAppId() + '_endTimestamp', endTime);
                //taggo la prima locazione con parametro extra
                bgGeo.getCurrentPosition(function (location, taskId) {
                    // This location is already persisted to plugin’s SQLite db.
                    // If you’ve configured #autoSync: true, the HTTP POST has already started.

                    console.log("-Current position received: ", location);
                    bgGeo.finish(taskId);
                    bgGeo.start();
                }, function (errorCode) {
                    alert('An location error occurred: ' + errorCode);
                }, {
                    timeout: 30, // 30 second timeout to fetch location
                    maximumAge: 5000, // Accept the last-known-location if not older than 5000 ms.
                    minimumAccuracy: 10, // Fetch a location with a minimum accuracy of `10` meters.
                    extras: { // [Optional] Attach your own custom `metaData` to this location.  This metaData will be persisted to SQLite and POSTed to your server
                        idTrip: idTrip
                    }
                });


            });
        };
        trackService.updateNotification = function (tripToSave, tripId, action) {
            if (window.plugin && cordova && cordova.plugins && cordova.plugins.notification) {
                console.log('initializing notifications...');
                //create a notification that fire in that day and if it is recursive every n day
                // notifications for 1 month range
                var dFrom = new Date(); //from today
                var dTo = new Date(); //to next month
                dTo.setMonth(dTo.getMonth() + 1);
                var notifArray = [];
                if (tripToSave.recurrency && tripToSave.recurrency.daysOfWeek && tripToSave.recurrency.daysOfWeek.length != 0) {
                    //add into array one notification for every trip if recursive
                    var arrayOfDate = getnotificationDates(tripToSave);
                    arrayOfDate.forEach(function (calculateddate) {
                        var targetDate = new Date(calculateddate - (1000 * 60 * 10));
                        notifArray.push({
                            id: Math.floor(targetDate.getTime() / 1000),
                            title: $filter('translate')('notification_tracking_title'),
                            text: $filter('translate')('notification_tracking_text'),
                            icon: 'res://icon.png',
                            //autoCancel: false,
                            autoClear: false,
                            at: targetDate,
                            data: {
                                tripId: tripId
                            }
                        })
                    });
                } else {
                    //put just one notification
                    //tripToSave.data.startime - 10 min
                    var targetDate = new Date(tripToSave.startime - (1000 * 60 * 10));
                    notifArray.push({
                        id: Math.floor(targetDate.getTime() / 1000),
                        title: $filter('translate')('notification_tracking_title'),
                        text: $filter('translate')('notification_tracking_text'),
                        icon: 'res://icon.png',
                        //autoCancel: false,
                        autoClear: false,
                        at: targetDate,
                        data: {
                            tripId: tripId
                        }
                    });
                }
                if (cordova && cordova.plugins && cordova.plugins.notification && notifArray) {
                    switch (action) {
                    case "create":
                        cordova.plugins.notification.local.schedule(notifArray);
                        cordova.plugins.notification.local.on("click", function (notification) {
                            JSON.stringify(notification);
                            $state.go("app.tripdetails", {
                                tripId: JSON.parse(notification.data).tripId
                            })
                        });
                        break;
                    case "delete":

                        //get id from notifyarray
                        var indexNotify = [];
                        for (var i = 0; i < notifArray.length; i++) {
                            indexNotify.push(notifArray[i].id);

                        }
                        cordova.plugins.notification.local.getAll(function (notifications) {
                            cordova.plugins.notification.local.cancel(indexNotify, function () {
                                cordova.plugins.notification.local.getAll(function (notifications) {
                                    console.log("done");
                                });

                            });
                        });

                        break;
                    case "modify":
                        //clear and add new
                        var indexNotify = [];
                        for (var i = 0; i < notifArray; i++) {
                            indexNotify.push(notifArray[i].id);

                        }

                        cordova.plugins.notification.local.schedule(notifArray);
                        cordova.plugins.notification.local.on("click", function (notification) {
                            JSON.stringify(notification);
                            $state.go("app.tripdetails", {
                                tripId: JSON.parse(notification.data).tripId
                            })
                        });
                        break;
                    }
                }

            }
        };


        function getnotificationDates(trip) {
            var arrayOfDate = [];
            var tripHour = new Date(trip.data.startime);
            var now = new Date();
            var dFrom = new Date(); //from today
            dFrom.setFullYear(tripHour.getFullYear());
            dFrom.setMonth(tripHour.getMonth());
            dFrom.setDate(tripHour.getDate());
            dFrom.setHours(tripHour.getHours());
            dFrom.setMinutes(tripHour.getMinutes());
            dFrom.setSeconds(tripHour.getSeconds());
            dFrom.setMilliseconds(tripHour.getMilliseconds());
            var dTo = new Date(); //to next month
            dTo.setFullYear(tripHour.getFullYear());
            dTo.setMonth(tripHour.getMonth() + 3);
            dTo.setDate(tripHour.getDate());
            dTo.setHours(tripHour.getHours());
            dTo.setMinutes(tripHour.getMinutes());
            dTo.setSeconds(tripHour.getSeconds());
            dTo.setMilliseconds(tripHour.getMilliseconds());
            //dTo.setMonth(dTo.getMonth() + 3);
            var next_date = dFrom.setDate(dFrom.getDate());

            //from today to next month do:
            while (dFrom < dTo) {

                var next_days_date = new Date(next_date);
                if (next_days_date > now) {
                    day_index = next_days_date.getDay();
                    if (day_index == 0) {
                        day_index = 7;
                    }
                    if (trip.recurrency.daysOfWeek.indexOf(day_index) != -1) {
                        arrayOfDate.push(next_days_date);
                    }
                }
                // increment the date
                var next_date = dFrom.setDate(dFrom.getDate() + 1);

                dFrom = new Date(next_date);
            }
            return arrayOfDate;
        };
        //    planService.planJourney = function (newPlanConfigure) {
        //        var deferred = $q.defer();
        //        $http({
        //
        //        }).
        //        success(function (data, status, headers, config) {
        //            deferred.resolve(data);
        //            planJourneyResults = data;
        //        }).
        //        error(function (data, status, headers, config) {
        //            console.log(data + status + headers + config);
        //            deferred.reject(data);
        //        });
        //
        //        return deferred.promise;
        //    }
        trackService.sync = function () {
            var deferred = $q.defer();
            //synch local db with remote server in batch mode
            bgGeo.sync(function (locations, taskId) {
                try {
                    // Here are all the locations from the database.  The database is now EMPTY.
                    console.log('synced locations: ', locations);
                } catch (e) {
                    console.error('An error occurred in my application code', e);
                }

                // Be sure to call finish(taskId) in order to signal the end of the background-thread.
                deferred.resolve(true);
                bgGeo.finish(taskId);
            }, function (errorMessage) {
                console.warn('Sync FAILURE: ', errorMessage);
                deferred.resolve(false);
            });

            return deferred.promise;
        };

        trackService.stop = function () {
            //var deferred = $q.defer();
            bgGeo.stop(function () {
                trackService.sync().then(function (done) {
                    if (done) {
                        //is done
                        trackService.clean(true);
                    } else {
                        trackService.clean(false);
                    }
                }, function (error) {
                    //manage error
                    trackService.clean(false);

                });
                //trackService.clean(false);
            });

        };

        trackService.getState = function () {

        };

        trackService.init = function () {
            //choose if go on with tracking
            //or manage the stop and sync the data
            if (trackingIsGoing()) {
                if (trackingIsFinished()) {
                    trackService.stop();
                    trackService.sync().then(function (done) {
                        if (done) {
                            trackService.clean(true);
                        }
                    }, function (error) {
                        //manage error
                        trackService.clean(false);

                    });
                } else if (trackingHasFailed()) {
                    //do something like clean or remove everything
                    trackService.stop();
                } else {
                    //go on with tracking
                    //                    trackService.start(Config.getAppId() + '_tripId', Config.getAppId() + '_endTimestamp')
                    trackService.start(localStorage.getItem(Config.getAppId() + '_tripId'), localStorage.getItem(Config.getAppId() + '_endTimestamp'));
                }
            } else {
                //preserve strange state when user delete memory and tracking service start again
                trackService.stop();
            }

            //check localstorage
        };


        function trackingIsGoing() {
            //if localstorage has values of tracking return yes
            //else false
            if (localStorage.getItem(Config.getAppId() + '_state') != null) {
                return true;
            }
            return false;
        }

        function trackingIsFinished() {
            //if is present timestamp of finish
            if (localStorage.getItem(Config.getAppId() + '_endTimestamp') != null) {
                //and it is earlier than now
                var endtimestamp = localStorage.getItem(Config.getAppId() + '_endTimestamp');
                if (Number(endtimestamp) > new Date().getTime()) {
                    return false;
                }
            }
            return true;

        }

        function trackingHasFailed() {
            //if last stored value is very old, do something
        }
        trackService.clean = function (dbclean) {
            //clean local db
            if (dbclean) {
                bgGeo.clearDatabase(function () {
                    console.log('- cleared database');

                });
            }
            //clean local storage data from localstorage
            localStorage.removeItem(Config.getAppId() + '_state');
            localStorage.removeItem(Config.getAppId() + '_tripId');
            localStorage.removeItem(Config.getAppId() + '_endTimestamp');
            localStorage.removeItem(Config.getAppId() + '_endTimestamp');
        };
        trackService.trackingIsGoingOn = function () {
                //check local storage is tracking
                if (localStorage.getItem(Config.getAppId() + '_state') != null) {
                    return true;
                }
                return false;
            }
            /**
             * This callback will be executed every time a geolocation is recorded in the background.
             */
        var callbackFn = function (location) {
            //console.log('[js] BackgroundGeoLocation callback:  ' + location.latitude + ',' + location.longitude);
            console.log('[js] BackgroundGeoLocation callback:  ' + JSON.stringify(location));

            // Do your HTTP request here to POST location to your server.
            // jQuery.post(url, JSON.stringify(location));

            /*
            IMPORTANT:  You must execute the finish method here to inform the native plugin that you're finished,
            and the background-task may be completed.  You must do this regardless if your HTTP request is successful or not.
            IF YOU DON'T, ios will CRASH YOUR APP for spending too much time in the background.
            */
            //backgroundGeoLocation.finish();
        };

        var failureFn = function (error) {
            console.log('BackgroundGeoLocation error');
        };


        //        var trackingConfigure = {
        //                // Geolocation config
        //                desiredAccuracy: 10,
        //                stationaryRadius: 30,
        //                distanceFilter: 30, //min distance generate event. Changing speed the value change dinamically
        //                disableElasticity: false, // <-- [iOS] Default is 'false'.  Set true to disable speed-based distanceFilter elasticity
        //                locationUpdateInterval: 5000,
        //                stopAfterElapsedMinutes: minutesOfRun,
        //                minimumActivityRecognitionConfidence: 50, // 0-100%.  Minimum activity-confidence for a state-change
        //                fastestLocationUpdateInterval: 5000,
        //                activityRecognitionInterval: 10000,
        //                stopDetectionDelay: 1, // Wait x minutes to engage stop-detection system
        //                stopTimeout: 2, // Wait x miutes to turn off location system after stop-detection
        //                activityType: 'Other',
        //
        //                // Application config
        //                debug: true, // <-- enable this hear sounds for background-geolocation life-cycle.
        //                forceReloadOnLocationChange: false, // <-- [Android] If the user closes the app **while location-tracking is started** , reboot app when a new location is recorded (WARNING: possibly distruptive to user)
        //                forceReloadOnMotionChange: false, // <-- [Android] If the user closes the app **while location-tracking is started** , reboot app when device changes stationary-state (stationary->moving or vice-versa) --WARNING: possibly distruptive to user)
        //                forceReloadOnGeofence: false, // <-- [Android] If the user closes the app **while location-tracking is started** , reboot app when a geofence crossing occurs --WARNING: possibly distruptive to user)
        //                stopOnTerminate: false, // <-- [Android] Allow the background-service to run headless when user closes the app.
        //                startOnBoot: false, // <-- [Android] Auto start background-service in headless mode when device is powered-up.
        //                foregroundService: true, //<-- [Android Make] the Android service run in the foreground, supplying the ongoing notification to be shown to the user while in this state.
        //                // HTTP / SQLite config
        //                url: myServerLocationURL,
        //                method: 'POST',
        //                batchSync: true, // <-- [Default: false] Set true to sync locations to server in a single HTTP request.
        //                autoSync: false, // <-- [Default: true] Set true to sync each location to server as it arrives.
        //                maxDaysToPersist: 14 // <-- Maximum days to persist a location in plugin's SQLite database when HTTP fails
        //
        //            }
        //
        //        // BackgroundGeoLocation is highly configurable. See platform specific configuration options
        //        backgroundGeoLocation.configure(callbackFn, failureFn, {
        //            desiredAccuracy: 10,
        //            stationaryRadius: 20,
        //            distanceFilter: 30,
        //            locationService: backgroundGeoLocation.service.ANDROID_FUSED_LOCATION,
        //            interval: 1000,
        //            debug: true, // <-- enable this hear sounds for background-geolocation life-cycle.
        //            stopOnTerminate: false, // <-- enable this to clear background location settings when the app terminates
        //        });
        //
        //
        //
        //        // If you wish to turn OFF background-tracking, call the #stop method.
        //        backgroundGeoLocation.stop();

        return trackService;
    })
    .factory('backgroundGeoLocationFake', function () {
        var backgroundGeoLocationFake = {};
        var configureParams = {};
        var locations = [
            {
                "battery": {
                    "is_charging": true,
                    "level": 0.9399999976158142
                },
                "uuid": "750e4dd9-1e7e-4052-bea4-a5d8cb6bcf76",
                "coords": {
                    "latitude": 46.0676213,
                    "longitude": 11.1515172,
                    "accuracy": 30,
                    "speed": 0,
                    "heading": 0,
                    "altitude": 0
                },
                "timestamp": "2016-03-07T10:25:51.029Z"
    },
            {
                "activity": {
                    "type": "on_foot",
                    "confidence": 46
                },
                "battery": {
                    "is_charging": false,
                    "level": 0.9200000166893005
                },
                "is_moving": true,
                "uuid": "8e88dd60-079e-4bdc-9d58-853154271a76",
                "coords": {
                    "latitude": 46.0686184,
                    "longitude": 11.1514069,
                    "accuracy": 61.5,
                    "speed": 0,
                    "heading": 0,
                    "altitude": 0
                },
                "timestamp": "2016-03-07T10:30:16.430Z"
    },
            {
                "activity": {
                    "type": "on_foot",
                    "confidence": 46
                },
                "battery": {
                    "is_charging": false,
                    "level": 0.9200000166893005
                },
                "is_moving": true,
                "uuid": "8e6219ff-013f-4a8a-9a83-bed9d8cf4636",
                "coords": {
                    "latitude": 46.0687824,
                    "longitude": 11.1510442,
                    "accuracy": 43.72999954223633,
                    "speed": 0,
                    "heading": 0,
                    "altitude": 0
                },
                "timestamp": "2016-03-07T10:30:50.179Z"
    },
            {
                "activity": {
                    "type": "on_foot",
                    "confidence": 46
                },
                "battery": {
                    "is_charging": false,
                    "level": 0.9200000166893005
                },
                "is_moving": true,
                "uuid": "f83c0337-10c3-4da8-a12b-6eb52e13e462",
                "coords": {
                    "latitude": 46.0685858,
                    "longitude": 11.1510428,
                    "accuracy": 38.07600021362305,
                    "speed": 0,
                    "heading": 0,
                    "altitude": 0
                },
                "timestamp": "2016-03-07T10:30:59.815Z"
    },
            {
                "activity": {
                    "type": "on_foot",
                    "confidence": 43
                },
                "battery": {
                    "is_charging": false,
                    "level": 0.9100000262260437
                },
                "is_moving": true,
                "uuid": "09d27566-ab5b-443c-8241-540badcf560e",
                "coords": {
                    "latitude": 46.0680672,
                    "longitude": 11.1505185,
                    "accuracy": 45,
                    "speed": 0,
                    "heading": 0,
                    "altitude": 0
                },
                "timestamp": "2016-03-07T10:31:26.165Z"
    },
            {
                "activity": {
                    "type": "on_foot",
                    "confidence": 43
                },
                "battery": {
                    "is_charging": false,
                    "level": 0.9100000262260437
                },
                "is_moving": true,
                "uuid": "12131aac-2f28-4c47-bf7c-14505a94fa84",
                "coords": {
                    "latitude": 46.0673775,
                    "longitude": 11.1505372,
                    "accuracy": 37.5,
                    "speed": 0,
                    "heading": 0,
                    "altitude": 0
                },
                "timestamp": "2016-03-07T10:31:37.703Z"
    },
            {
                "activity": {
                    "type": "in_vehicle",
                    "confidence": 37
                },
                "battery": {
                    "is_charging": false,
                    "level": 0.8999999761581421
                },
                "is_moving": true,
                "uuid": "501d4b02-5399-4977-847a-2f40e44337ed",
                "coords": {
                    "latitude": 46.0680387,
                    "longitude": 11.1506325,
                    "accuracy": 108,
                    "speed": 0,
                    "heading": 0,
                    "altitude": 0
                },
                "timestamp": "2016-03-07T10:33:23.712Z"
    },
            {
                "activity": {
                    "type": "on_foot",
                    "confidence": 92
                },
                "battery": {
                    "is_charging": false,
                    "level": 0.8999999761581421
                },
                "is_moving": true,
                "uuid": "33636f1b-2ef9-4dca-b1e8-c01b506e2e7c",
                "coords": {
                    "latitude": 46.0678791,
                    "longitude": 11.1510782,
                    "accuracy": 20,
                    "speed": 0,
                    "heading": 0,
                    "altitude": 0
                },
                "timestamp": "2016-03-07T10:34:21.000Z"
    },
            {
                "activity": {
                    "type": "on_foot",
                    "confidence": 92
                },
                "battery": {
                    "is_charging": false,
                    "level": 0.8999999761581421
                },
                "is_moving": true,
                "uuid": "9e0acb47-27c7-47a0-bcdc-8f311083f423",
                "coords": {
                    "latitude": 46.0677578,
                    "longitude": 11.1515384,
                    "accuracy": 30,
                    "speed": 0,
                    "heading": 0,
                    "altitude": 0
                },
                "timestamp": "2016-03-07T10:34:46.386Z"
    },
            {
                "activity": {
                    "type": "on_foot",
                    "confidence": 92
                },
                "battery": {
                    "is_charging": false,
                    "level": 0.8899999856948853
                },
                "is_moving": true,
                "uuid": "6c8bc792-7e96-417b-920f-b0f950602c72",
                "coords": {
                    "latitude": 46.0676011,
                    "longitude": 11.1517638,
                    "accuracy": 30,
                    "speed": 0,
                    "heading": 0,
                    "altitude": 0
                },
                "timestamp": "2016-03-07T10:35:34.910Z"
    }
  ]

        backgroundGeoLocationFake.start = function () {
            //start tracking
        };
        backgroundGeoLocationFake.stop = function () {
            //stop the tracking
        };
        backgroundGeoLocationFake.configure = function (callbackFn, failureFn, trackingConfigure) {
            //configure the plugin
            configureParams = trackingConfigure;
        };
        backgroundGeoLocationFake.clearDatabase = function (callbackFn) {
            //delete db
            callbackFn();
        };
        backgroundGeoLocationFake.sync = function (callbackFn) {
            //sync e return  con function (locations, taskId)
            //get location, getTaskid
            callbackFn(locations, 1);

        };
        backgroundGeoLocationFake.getCurrentPosition = function (callbackFn) {
            // function (location, taskId)
            callbackFn(locations[1], 1);

        };
        backgroundGeoLocationFake.finish = function (taskID) {

        };
        return backgroundGeoLocationFake;
    });
