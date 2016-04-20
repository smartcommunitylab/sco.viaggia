angular.module('viaggia.services.tracking', [])
    .factory('trackService', function (Config, $q, $http, $state, $timeout, $filter, userService, $ionicPlatform, Utils) {
        //var trackingIntervalInMs = 500;
        //var accelerationDetectionIntervalInMs = 500;
        //var accelerationSensorDelay = 0;
        //var minimumAccuracyInMeter = 100;
        var trackService = {};
        var bgGeo = {};
        var refreshCallback = null;
        $ionicPlatform.ready(function () {
            bgGeo = window.BackgroundGeolocation;
            bgGeo.onHttp(function (response) {
                var status = response.status;
                console.log("- HTTP success", status);
                if (status == 200 && response.responseText && 'OK' == JSON.parse(response.responseText).storeResult) {
                    bgGeo.clearDatabase(function () {
                        console.log('- cleared database');
                    });
                }
            }, function (response) {
                var status = response.status;
                console.log("- HTTP failure: ", status);
            });

        });

        document.addEventListener("resume", function () {
            console.log('app resumed');

            if (trackService.trackingIsGoingOn() && trackService.trackingIsFinished()) {
                trackService.stop();
                if (refreshCallback) {
                    refreshCallback();
                    refreshCallback = null;
                }
            }
        }, false);


        /**
         * INITIALIZE THE TRACKER. RESTART IF IS RUNNING, OR SYNCHRONIZE IF IS FINISHED.
         */
        trackService.startup = function () {

            var trackingConfigure = Config.getTrackingConfig();
            bgGeo.configure(trackingConfigure, callbackFn, failureFn);
            init();
        }

        var sendServerStart = function (idTrip, token) {
                var deferred = $q.defer();
                $http({
                    method: 'PUT',
                    url: Config.getServerURL() + '/gamification/journey/' + idTrip,
                    data: ionic.Platform.device(),
                    headers: {
                        //                        'Accept': 'application/json',
                        //                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    }
                }).success(function () {
                    deferred.resolve(true);
                }).error(function (err) {
                    console.log(err)
                    deferred.reject(false);
                });
                return deferred;

            }
            /*check if the trip is currently tracked*/
        trackService.isThisTheJourney = function (tripId) {
            if (localStorage.getItem(Config.getAppId() + '_tripId') == tripId) {
                return true;
            }
            return false;
        }
        trackService.isAvailableForDay = function (tripId) {
            var date = new Date();
            date.setHours(0, 0, 0, 0);
            var doneTrips = JSON.parse(localStorage.getItem(Config.getAppId() + "_doneTrips"));

            if (doneTrips && Number(doneTrips[tripId]) == date.getTime()) {
                return false;
            }
            return true;
        }

        trackService.isInTime = function (startime, recurrency) {
                // return trackService.isInTime($scope.currentItinerary.startime,$scope.recurrency.daysOfWeek);
                var now = new Date();
                //if recurrent check only hours if day is correct;
                var startTime = startime;
                if (recurrency && recurrency.daysOfWeek && recurrency.daysOfWeek.length > 0) {
                    if (Utils.contains(recurrency.daysOfWeek, now.getDay())) {
                        var startTimeDate = new Date(startime);
                        //var today = new Date();
                        startTimeDate.setFullYear(now.getFullYear());
                        startTimeDate.setMonth(now.getMonth());
                        startTimeDate.setDate(now.getDate());
                        startTime = startTimeDate.getTime();
                    } else return -1;
                }
                if (now.getTime() > new Date(startTime + Config.getThresholdStartTime())) {
                    return 1;
                }
                if (now.getTime() < new Date(startTime - Config.getThresholdStartTime())) {
                    return -1;
                }
                return 0;
            }
            /**
             * START THE TRACKER.
             */
        trackService.start = function (idTrip, trip, callback) {
            userService.getValidToken().then(function (token) {
                sendServerStart(idTrip, token);
                var today = new Date();
                refreshCallback = callback;
                var endtimeDate = null;
                if (trip) {
                    endtimeDate = new Date(Number(trip.data.endtime));
                } else {
                    var lastRememberedEnd = localStorage.getItem(Config.getAppId() + '_endTimestamp');
                    endtimeDate = new Date(Number(lastRememberedEnd));
                }


                endtime = endtimeDate.getTime() + Config.getThresholdEndTime();
                var duration = endtime - today.getTime();

                //configuro il plugin con i vari param
                var trackingConfigure = Config.getTrackingConfig();
                var startTimestamp = new Date().getTime();

                var minutesOfRun = duration / 60000;
                trackingConfigure['stopAfterElapsedMinutes'] = Math.floor(minutesOfRun);
                //trackingConfigure['stopAfterElapsedMinutes'] = 1;
                trackingConfigure['notificationTitle'] = $filter('translate')('tracking_notification_title');
                trackingConfigure['notificationText'] = $filter('translate')('tracking_notification_text');
                trackingConfigure['url'] += token;
                trackingConfigure['extras'] = {
                    idTrip: idTrip
                };
                bgGeo.configure(trackingConfigure, callbackFn, failureFn);

                //setto le variabili in localstorage
                if (trip) {
                    localStorage.setItem(Config.getAppId() + '_state', 'TRACKING');
                    localStorage.setItem(Config.getAppId() + '_tripId', idTrip);
                    localStorage.setItem(Config.getAppId() + '_startTimestamp', startTimestamp);
                    localStorage.setItem(Config.getAppId() + '_endTimestamp', endtime);
                    //taggo la prima locazione con parametro extra
                }
                $timeout(function () {
                    trackService.stop();
                    if (callback) callback();
                }, duration);
                //                $timeout(function () {
                //                    trackService.stop();
                //                    if (callback) callback();
                //                }, 60000);

                bgGeo.start(function () {
                    bgGeo.changePace(true);
                    bgGeo.getCurrentPosition(function (location, taskId) {
                        //console.log("-Current position received: ", location);
                        location.extras = {
                            idTrip: idTrip
                        }; // <-- add some arbitrary extras-data
                        //                      // Insert it.
                        bgGeo.insertLocation(location, function () {
                            bgGeo.finish(taskId);
                        });
                    }, function (errorCode) {
                        alert('An location error occurred: ' + errorCode);
                    }, {
                        timeout: 100, // 30 second timeout to fetch location
                        maximumAge: 100000, // Accept the last-known-location if not older than 5000 ms.
                        minimumAccuracy: 10, // Fetch a location with a minimum accuracy of `10` meters.
                        extras: {
                            idTrip: idTrip
                        }
                    });
                });


            });
        };

        var sync = function () {
            var deferred = $q.defer();
            userService.getValidToken().then(function (token) {
                var trackingConfigure = Config.getTrackingConfig();
                trackingConfigure['url'] += token;
                trackingConfigure['foregroundService'] = false;
                bgGeo.configure(trackingConfigure, callbackFn, failureFn);
                bgGeo.start(function () {
                    bgGeo.sync(function (locations, taskId) {
                        console.log('synced locations: ', locations);
                        // Be sure to call finish(taskId) in order to signal the end of the background-thread.
                        bgGeo.finish(taskId);
                        deferred.resolve(true);
                    }, function (errorMessage) {
                        console.warn('Sync FAILURE: ', errorMessage);
                        deferred.resolve(false);
                    });
                });
            }, function () {
                // no token obtained
                deferred.resolve(false);
            });
            return deferred.promise;
        };

        /**
         * STOP THE TRACKER.
         */
        trackService.stop = function () {
            markAsDone();
            clean();
            sync().then(function (done) {
                bgGeo.stop();
            }, function (error) {
                bgGeo.stop();
            });
        };

        //        trackService.getState = function () {};

        var markAsDone = function () {
            var tripId = localStorage.getItem(Config.getAppId() + "_tripId");
            var date = new Date();
            date.setHours(0, 0, 0, 0);
            var doneTrips = JSON.parse(localStorage.getItem(Config.getAppId() + "_doneTrips"));
            if (!doneTrips) {
                doneTrips = {};
            }
            doneTrips[tripId] = date.getTime();
            localStorage.setItem(Config.getAppId() + "_doneTrips", JSON.stringify(doneTrips));
        }


        var init = function () {
            //choose if go on with tracking
            //or manage the stop and sync the data
            if (trackingIsGoing() && !trackService.trackingIsFinished()) {
                trackService.start(localStorage.getItem(Config.getAppId() + '_tripId'));
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

        trackService.trackingIsFinished = function () {
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
        var clean = function () {
            //clean local db
            //clean local storage data from localstorage
            localStorage.removeItem(Config.getAppId() + '_state');
            localStorage.removeItem(Config.getAppId() + '_tripId');
            localStorage.removeItem(Config.getAppId() + '_startTimestamp');
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
        var callbackFn = function () {
            console.log('[js] BackgroundGeoLocation configure callback');
        };

        var failureFn = function (error) {
            console.log('BackgroundGeoLocation error');
        };

        trackService.isTracking = function (id) {
            //return true if this is the tracking is going to track and is going
            if (trackService.isThisTheJourney(id) && trackService.trackingIsGoingOn()) {
                return true;
            }
            return false;
        }

        trackService.updateNotification = function (tripToSave, trips, tripId, action) {
            if (window.plugin && cordova && cordova.plugins && cordova.plugins.notification) {
                console.log('initializing notifications...');
                //create a notification that fire in that day and if it is recursive every n day
                // notifications for 1 month range
                var dFrom = new Date(); //from today
                var dTo = new Date(); //to next month
                dTo.setMonth(dTo.getMonth() + 3);
                var notifArray = [];
                var tripsArray = [];
                if (trips) {
                    for (var key in trips) {
                        tripsArray.push(trips[key]);
                    }
                }
                cordova.plugins.notification.local.clearAll(function () {
                    //for all trips regens notifications
                    action = "create";
                    var idNotification = 0;
                    for (var k = 0; k < tripsArray.length; k++) {

                        tripToSave = tripsArray[k];
                        if (tripToSave.recurrency && tripToSave.recurrency.daysOfWeek && tripToSave.recurrency.daysOfWeek.length != 0) {
                            //add into array one notification for every trip if recursive
                            var arrayOfDate = getnotificationDates(tripToSave);
                            arrayOfDate.forEach(function (calculateddate) {
                                var targetDate = new Date(calculateddate - (1000 * 60 * 10));
                                if (targetDate > dFrom) {
                                    notifArray.push({
                                        id: idNotification,
                                        title: $filter('translate')('notification_tracking_title'),
                                        text: $filter('translate')('notification_tracking_text'),
                                        icon: 'res://icon.png',
                                        //autoCancel: false,
                                        autoClear: false,
                                        at: targetDate,
                                        data: {
                                            tripId: tripToSave.clientId
                                        }
                                    })
                                }
                                idNotification++;
                            });
                        } else {
                            //put just one notification
                            //tripToSave.data.startime - 10 min
                            var targetDate = new Date(tripToSave.data.startime - (1000 * 60 * 10));
                            if (targetDate > dFrom) {
                                notifArray.push({
                                    id: idNotification,
                                    title: $filter('translate')('notification_tracking_title'),
                                    text: $filter('translate')('notification_tracking_text'),
                                    icon: 'res://icon.png',
                                    //autoCancel: false,
                                    autoClear: false,
                                    at: targetDate,
                                    data: {
                                        tripId: tripToSave.clientId
                                    }
                                });
                            }
                            idNotification++;
                        }
                    }
                    if (cordova && cordova.plugins && cordova.plugins.notification && notifArray) {
                        switch (action) {
                        case "create":
                            cordova.plugins.notification.local.schedule(notifArray);
                            //console.log(JSON.stringify(notifArray))
                            //                            cordova.plugins.notification.local.getAll(function (notifications) {
                            //                                console.log(JSON.stringify(notifications))
                            //                            });
                            cordova.plugins.notification.local.on("click", function (notification) {
                                JSON.stringify(notification);
                                $state.go("app.tripdetails", {
                                    tripId: JSON.parse(notification.data).tripId
                                })
                            });
                            break;
                        case "delete":

                            //get id from notifyarray
                            //                                var indexNotify = [];
                            //                                for (var i = 0; i < notifArray.length; i++) {
                            //                                    indexNotify.push(notifArray[i].id);
                            //
                            //                                }
                            //                                //erase all notifications and recreate
                            //
                            //                                cordova.plugins.notification.local.getAll(function (notifications) {
                            //                                    cordova.plugins.notification.local.cancel(indexNotify, function () {
                            //                                        cordova.plugins.notification.local.getAll(function (notifications) {
                            //                                            console.log("done");
                            //                                        });
                            //
                            //                                    });
                            //                                });

                            break;
                        case "modify":
                            //clear with id and add new
                            var indexNotify = [];
                            for (var i = 0; i < notifArray.length; i++) {
                                indexNotify.push(notifArray[i].id);

                            }
                            //                            cordova.plugins.notification.local.getAll(function (notifications) {
                            //                                cordova.plugins.notification.local.cancel(indexNotify, function () {
                            //                                    cordova.plugins.notification.local.getAll(function (notifications) {
                            cordova.plugins.notification.local.schedule(notifArray);
                            cordova.plugins.notification.local.on("click", function (notification) {
                                JSON.stringify(notification);
                                $state.go("app.tripdetails", {
                                    tripId: JSON.parse(notification.data).tripId
                                })
                            });
                            //                                    });
                            //
                            //                                });
                            //                            });

                            break;
                        }
                    }
                }, this);

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

        return trackService;
    })

;
