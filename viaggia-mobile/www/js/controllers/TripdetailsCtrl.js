angular.module('viaggia.controllers.tripdetails', [])

    .controller('TripDetailsCtrl', function ($scope, $rootScope, $stateParams, $ionicModal, $window, $filter, $ionicPopup, LoginService, planService, mapService, Config, Toast, trackService, $filter, $ionicHistory, $state, $ionicLoading, $location, bookmarkService, Utils, GameSrv) {
        $scope.title = $filter('translate')('journey_detail');
        //$scope.empty_rec = Config.getDaysRec();
        //    document.addEventListener("resume", function () {
        //        console.log('app resumed');
        //
        //        if (trackService.trackingIsGoingOn() && trackService.trackingIsFinished()) {
        //            trackService.stop();
        //            refreshTripDetail();
        //        }
        //    }, false);

        //    $scope.$on("$ionicView.beforeEnter", function (scopes, states) {
        //        if (trackService.trackingIsGoingOn() && trackService.trackingIsFinished()) {
        //            refreshTripDetail();
        //        }
        //    });
        var initMyTrip = function () {
            $scope.editMode = false;
            planService.getTrip($stateParams.tripId).then(function (trip) {
                $scope.trip = trip;
                $scope.tripId = $stateParams.tripId;
                $scope.tripName = trip.name;

                $scope.bookmarkStyle = bookmarkService.getBookmarkStyle($location.path());
                $scope.requestedFrom = trip.originalFrom.name;
                $scope.trip.data.from.name = $scope.requestedFrom;
                $scope.requestedTo = trip.originalTo.name;
                $scope.trip.data.to.name = $scope.requestedTo;
                $scope.recurrency = trip.recurrency;
                if ($scope.isRecurrent()) {
                    $scope.recurrentDays = $scope.getRecurrentDays($scope.recurrency);
                }
                planService.setPlanConfigure(planService.buildConfigureOptions(trip));

                planService.process(trip.data, $scope.requestedFrom, $scope.requestedTo);
                $scope.currentItinerary = trip.data;
                $scope.pathLine = mapService.getTripPolyline(trip.data);
                $scope.pathMarkers = mapService.getTripPoints(trip.data);
                if ($stateParams.replan) {
                    $scope.editMode = true;
                    $scope.trip = planService.getSelectedJourney();
                    if (trip && trip.recurrency) {
                        $scope.recurrency = trip.recurrency;
                    }
                } else {
                    planService.setEditInstance(null);
                }
                angular.extend($scope, {
                    center: {
                        lat: Config.getMapPosition().lat,
                        lng: Config.getMapPosition().long,
                        zoom: Config.getMapPosition().zoom
                    },
                    markers: $scope.pathMarkers,
                    events: {},
                    pathLine: $scope.pathLine
                });
            });
        }

        var initNewTrip = function () {
            var trip = planService.getSelectedJourney();
            //get recurrency

            $scope.trip = trip;
            $scope.editMode = true;

            $scope.requestedFrom = planService.getName("from");
            if (!$scope.requestedFrom) {
                $scope.requestedFrom = trip.from.name;
            } else {
                trip.from.name = $scope.requestedFrom;
            }
            $scope.requestedTo = planService.getName("to");
            if (!$scope.requestedTo) {
                $scope.requestedTo = trip.to.name;
            } else {
                trip.to.name = $scope.requestedTo;
            }
            var editInstance = planService.getEditInstance();
            $scope.tripId = editInstance ? editInstance.clientId : null;
            //        if (trip.original) {
            //            //not yet processed
            //            delete trip.original;
            //        }
            if (editInstance && editInstance.recurrency) {
                $scope.recurrency = editInstance.recurrency;
            }
            if (editInstance && editInstance.name) {
                $scope.tripName = editInstance.name;
            }
            planService.process(trip, $scope.requestedFrom, $scope.requestedTo);
            $scope.currentItinerary = trip;
            $scope.pathLine = mapService.getTripPolyline(trip);
            $scope.pathMarkers = mapService.getTripPoints(trip);
            //        planService.getTrip($scope.tripId).then(function (trip) {
            //            if (trip) {
            //                $scope.recurrency = trip.recurrency;
            //            }
            //
            //        });
            //        if ($stateParams.lastStep) {
            //            planService.getTrip($stateParams.tripId).then(function (trip) {
            //                $scope.tripName = trip.name;
            //                $scope.recurrency = trip.recurrency;
            //                if ($scope.isRecurrent()) {
            //                    $scope.recurrentDays = $scope.getRecurrentDays($scope.recurrency);
            //                }
            //
            //            });
            //
            //        }
            angular.extend($scope, {
                center: {
                    lat: Config.getMapPosition().lat,
                    lng: Config.getMapPosition().long,
                    zoom: Config.getMapPosition().zoom
                },
                markers: $scope.pathMarkers,
                events: {},
                pathLine: $scope.pathLine
            });

        }



        $scope.toTime = function (millis) {
            return planService.getTimeStr(new Date(millis));
        };
        $ionicModal.fromTemplateUrl('templates/mapModalDetail.html', {
            id: '1',
            scope: $scope,
            backdropClickToClose: false,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalMap = modal;
        });
        $scope.openMapTrip = function () {
            $scope.modalMap.show().then(function () {
                var boundsArray = [];
                for (var i = 0; i < $scope.pathMarkers.length; i++) {
                    var bound = [$scope.pathMarkers[i].lat, $scope.pathMarkers[i].lng];
                    boundsArray.push(bound);
                }
                if (boundsArray.length > 0) {
                    var bounds = L.latLngBounds(boundsArray);
                    mapService.getMap('modalMapDetail').then(function (map) {
                        map.fitBounds(bounds);
                    });
                }
            });

        }

        $scope.closeMap = function () {
            $scope.modalMap.hide();
        }
        $scope.journey = {
            recursiveTrip: false
        }
        $scope.recursiveChange = function () {
            console.log('Push Notification Change', $scope.journey.recursiveTrip);
            if (!$scope.journey.recursiveTrip) {
                $scope.recurrencyPopupDoW = JSON.parse(JSON.stringify(Config.getDaysRec()));
            }
        };

        $scope.allDays = {
            checked: false
        };
        $scope.selectAll = function () {
            if ($scope.allDays.checked) {
                for (var k = 0; k < $scope.recurrencyPopupDoW.length; k++) {
                    $scope.recurrencyPopupDoW[k].checked = true;
                }
            } else {
                for (var k = 0; k < $scope.recurrencyPopupDoW.length; k++) {
                    $scope.recurrencyPopupDoW[k].checked = false;
                }
            }
        }

        $scope.saveTrip = function () {
            var editInstance = planService.getEditInstance();
            // if ($scope.tripId && editInstance) {

            $scope.data = {};
            $scope.showError = false;
            $scope.recurrencyPopupDoW = JSON.parse(JSON.stringify(Config.getDaysRec()));
            if ($scope.isRecurrent()) {
                //set flag to recurrency to true
                $scope.journey.recursiveTrip = true;
                //set array to recurrent
                for (var k = 0; k < $scope.recurrencyPopupDoW.length; k++) {
                    if (Utils.contains($scope.recurrency.daysOfWeek, k + 1)) {
                        $scope.recurrencyPopupDoW[k].checked = true;
                    }
                }
            }
            if (editInstance && editInstance.clientId) {
                $scope.data.nametrip = editInstance.name;
            }
            // Prompt popup code
            $ionicPopup.prompt({
                templateUrl: 'templates/popup-savetrip.html',
                title: $filter('translate')('save_trip_title'),
                cssClass: 'parking-popup',
                scope: $scope,
                buttons: [
                    {
                        text: $filter('translate')('save_trip_close_button'),
                        type: 'button-cancel'
                    },
                    {
                        text: '<b>' + $filter('translate')('save_trip_save_button') + '</b>',
                        onTap: function (e) {
                            if (!$scope.data.nametrip) {
                                $scope.showError = true;

                                e.preventDefault();
                            } else {
                                Config.loading();
                                return $scope.data.nametrip;
                            }
                        }
                    }]
            }).then(function (res) {
                if (res) {
                    if ($scope.isRecurrent()) {
                        planService.saveTrip($scope.tripId, $scope.trip, res, $scope.requestedFrom, $scope.requestedTo, $scope.recurrencyPopupDoW).then(function (res) {
                            planService.setEditInstance(null);
                            $scope.tripId = res.clientId;
                            Toast.show($filter('translate')("tripsaved_message_feedback"), "short", "bottom");
                            navigateAfterSave($scope.tripId);
                            Config.loaded();

                        }, function (error) {
                            Toast.show($filter('translate')("save_trip_error_message"), "short", "bottom");
                            Config.loaded();
                        })

                    } else {
                        planService.saveTrip($scope.tripId, $scope.trip, $scope.data.nametrip, $scope.requestedFrom, $scope.requestedTo, $scope.recurrencyPopupDoW).then(function (res) {
                            planService.setEditInstance(null);
                            $scope.tripId = res.clientId;
                            $ionicHistory.nextViewOptions({
                                historyRoot: true,
                                disableBack: true
                            });
                            Toast.show($filter('translate')("tripsaved_message_feedback"), "short", "bottom");
                            navigateAfterSave($scope.tripId);
                            Config.loaded();

                        },

                            function (error) {
                                Toast.show($filter('translate')("save_trip_error_message"), "short", "bottom");
                                Config.loaded();
                            });
                    }
                }


            },
                function (err) {
                    Toast.show($filter('translate')("save_trip_error_message"), "short", "bottom");
                    Config.loaded();
                }
                );
            return;



        }

        function navigateAfterSave(tripId) {
            $ionicHistory.nextViewOptions({
                historyRoot: true,
                disableBack: true
            });
            //next view
            if (!tripId) {
                $state.go('app.mytrips');
                //            $ionicHistory.goBack();
            } else {
                $state.go('app.tripdetails', {
                    tripId: tripId
                });
            }
            //        $scope.editMode = false;
        }
        $scope.addDay = function (day) {
            console.log(day);
        }

        function removeFromBookmarked() {
            if (bookmarkService.getBookmarkStyle($location.path()) == 'ic_bookmark') {
                bookmarkService.toggleBookmark($location.path(), $scope.tripName, 'TRIP', {
                    tripId: $scope.tripId
                }).then(function (style) {
                    console.log('removed from bookmarked');
                });
            }
        }
        $scope.modifyTrip = function () {
            //get configuration with tripid
            if ($scope.modifiable) {
                planService.getTrip($scope.tripId).then(function (trip) {
                    planService.setName("from", $scope.requestedFrom);
                    planService.setName("to", $scope.requestedTo);
                    planService.setPlanConfigure(planService.buildConfigureOptions(trip));
                    planService.setEditInstance(trip);
                    //            planService.setTripId($scope.tripId);
                    //            planService.setTripName(trip.name);
                    var params = {
                        replan: true,
                        tripId: $scope.tripId
                    }
                    $state.go('app.plan', params);
                    removeFromBookmarked();

                });
            } else {
                Toast.show($filter('translate')('toast_not_modifiable'), "short", "bottom");

            }
            //        planService.setName("from", $scope.requestedFrom);
            //        planService.setName("to", $scope.requestedTo);
            //        planService.setTripId($scope.tripId);
            //        $state.go('app.plan');

        }
        $scope.deleteTrip = function () {
            if ($scope.modifiable) {
                $scope.showConfirm($filter('translate')("popup_delete_trip_message"), $filter('translate')("popup_delete_trip_title"), function () {
                    planService.deleteTrip($scope.tripId).then(function (res) {
                        //delete actual from localStorage and memory
                        //delete bookmark if present
                        removeFromBookmarked();
                        //go back in the stack
                        navigateAfterSave(null);
                        Toast.show($filter('translate')('toast_deleted'), "short", "bottom");

                    });
                });
            } else {
                Toast.show($filter('translate')('toast_not_deletable'), "short", "bottom");

            }
            //delete $scope.placesandcoordinates[favorite.name];
        }
        $scope.initMap = function () {
            mapService.initMap('modalMapDetail', true).then(function () {
                //add polyline
            })
        }

        $scope.bookmark = function () {
            bookmarkService.toggleBookmark($location.path(), $scope.tripName, 'TRIP', {
                tripId: $scope.tripId
            }).then(function (style) {
                $scope.bookmarkStyle = style;
            });
        };

        function refreshTripDetail() {
            //callback will be called at the end of the track
            $scope.modifiable = true;
            $scope.isAvailable = false;

        }
        /*****************************************************
         *  TRACKING PROPERTIES. TODO: SIMPLIFY AND MOVE TO THE SERVICE, PASS CALLBACK TO START
         *****************************************************/
        var startTrack = function () {
            if (!$scope.tripId || ($scope.tripId.indexOf("temporary") != -1)) {
                //it was an existent temporary trip, refresh the id
                $scope.tripId = new Date().getTime() + "_temporary_" + LoginService.getUserProfile().userId;
                trackService.startTemporary($scope.tripId, $scope.trip, refreshTripDetail)
                    .then(function () {
                        $scope.modifiable = false;
                    }, function (errorCode) {
                        trackService.noStartPopup();
                    }).finally(Config.loaded);
            }
            else {
                trackService.start($scope.tripId, localStorage.getItem(Config.getAppId() + '_multimodalId'), $scope.trip, refreshTripDetail)
                    .then(function () {
                        $scope.modifiable = false;
                    }, function (errorCode) {
                        trackService.geolocationPopup();
                    }).finally(Config.loaded);
            }

        }
        $scope.trackStart = function () {
            if (!$scope.notTrackable()) {
                Config.loading();
                //params= trip, idTrip. Enditime is authomatic calculated

                if (!trackService.trackingIsGoingOn() || trackService.trackingIsFinished()) {
                    trackService.checkLocalization().then(function (accuracy) {
                        console.log(accuracy);
                        startTrack();
                    }, function (error) {
                        if (Config.isErrorLowAccuracy(error)) {
                            Config.loaded();
                            //popup "do u wanna go on?"
                            $ionicPopup.confirm({
                                title: $filter('translate')("pop_up_low_accuracy_title"),
                                template: $filter('translate')("pop_up_low_accuracy_template"),
                                buttons: [
                                    {
                                        text: $filter('translate')("btn_close"),
                                        type: 'button-cancel'
                                    },
                                    {
                                        text: $filter('translate')("pop_up_low_accuracy_button_go_on"),
                                        type: 'button-custom',
                                        onTap: function () {
                                            startTrack();
                                        }
                                    }
                                ]
                            });
                        } else if (Config.isErrorGPSNoSignal(error)) {
                            Config.loaded();
                            //popup "impossible to track" and stop
                            $ionicPopup.alert({
                                title: $filter('translate')("pop_up_no_geo_title"),
                                template: $filter('translate')("pop_up_no_geo_template"),
                                okText: $filter('translate')("btn_close"),
                                okType: 'button-cancel'
                            });
                        }
                    });

                }
                //                trackService.start($scope.tripId, $scope.trip, refreshTripDetail)
                //                .then(function(){
                //                  $scope.modifiable = false;
                //                }, function(errorCode) {
                //                  trackService.geolocationPopup();
                //                }).finally(Config.loaded);
            }
        }
        //    $scope.trackState = function () {
        //        trackService.getState();
        //    }

        $scope.isThisJourney = function () {
            //return true if this journey is stored to be tracked
            return trackService.isThisTheJourney($stateParams.tripId);
            //        if (localStorage.getItem(Config.getAppId() + '_tripId') == $scope.tripId) {
            //            return true;
            //        }
            //        return false;
        }

        $scope.isTracking = function () {
            //return true if this is the tracking is going to track and is going
            //        if ($scope.isThisJourney() && trackService.trackingIsGoingOn()) {
            //            return true;
            //        }
            //        return false;
            // return trackService.isTracking($stateParams.tripId);
            return trackService.isTracking($scope.tripId);
        }


        $scope.notTrackable = function () {
            //return true if it is not trackable = not in time or there is another track is going on
            if ((!$scope.isThisJourney() && trackService.trackingIsGoingOn())) {
                return true
            }
            return false;
        }
        $scope.isInTime = function () {
            if ($scope.currentItinerary) {
                return trackService.isInTime($scope.currentItinerary.startime, $scope.recurrency);
            } else {
                return false
            }
            //        var now = new Date();
            //        //if recurrent check only hours if day is correct;
            //        var startTime = $scope.currentItinerary.startime;
            //        if ($scope.recurrency && $scope.recurrency.daysOfWeek && $scope.recurrency.daysOfWeek.length > 0) {
            //            if ($scope.contains($scope.recurrency.daysOfWeek, now.getDay())) {
            //                var startTimeDate = new Date($scope.currentItinerary.startime);
            //                //var today = new Date();
            //                startTimeDate.setFullYear(now.getFullYear());
            //                startTimeDate.setMonth(now.getMonth());
            //                startTimeDate.setDate(now.getDate());
            //                startTime = startTimeDate.getTime();
            //            } else return -1;
            //        }
            //        if (now.getTime() > new Date(startTime + Config.getThresholdStartTime())) {
            //            return 1;
            //        }
            //        if (now.getTime() < new Date(startTime - Config.getThresholdStartTime())) {
            //            return -1;
            //        }
            //        return 0;
        }

        //    function contains(a, obj) {
        //        for (var i = 0; i < a.length; i++) {
        //            if (a[i] === obj) {
        //                return true;
        //            }
        //        }
        //        return false;
        //    }
        var warnOrTrack = function () {
            $scope.localizationAlwaysAllowed().then(function (loc) {
                if (!loc) {
                    $scope.showWarningPopUp();
                } else {
                    $scope.isBatterySaveMode().then(function (saveMode) {
                        if (saveMode) {
                            $scope.showSaveBatteryPopUp($scope.trackStart);
                        }
                        else {
                            $scope.trackStart();
                        }
                    })
                }
            })
        }
        $scope.startOrShowPopupIfNotThisJourney = function () {
            if (!$rootScope.syncRunning) {

                var inTime = $scope.isInTime();

                if ($scope.notTrackable()) {
                    if (!$scope.isThisJourney() && trackService.trackingIsGoingOn()) {
                        Toast.show($filter('translate')('toast_already_monitoring'), "short", "bottom");
                        //            } else if ($scope.isInTime() == -1) {
                        //                Toast.show($filter('translate')('toast_before_time'), "short", "bottom");
                        //            } else if ($scope.isInTime() == 1) {
                        //                Toast.show($filter('translate')('toast_after_time'), "short", "bottom");
                    }
                } else if (inTime != 0) {
                    $scope.showConfirm($filter('translate')("popup_start_trip_message"), $filter('translate')("popup_start_trip_title"), function () {
                        warnOrTrack();
                    });
                } else {
                    warnOrTrack();
                }
            }
        }
        $scope.trackStop = function () {
            $scope.showConfirm($filter('translate')("sure_delete_text"), $filter('translate')("sure_delete_title"), function () {
                //sign the trip as already done for the day
                var travelForDiary = GameSrv.getTravelForDiary()
                trackService.stop().then(function () {
                    //go to diary
                    $ionicHistory.nextViewOptions({
                        disableBack: true
                    });
                    $state.transitionTo('app.home').then(function () {
                        $state.go('app.diary');
                    })

                });
                GameSrv.addTravelDiary(travelForDiary);
                $scope.modifiable = true;
                $scope.isAvailable = false;
                GameSrv.resetLocalStatus();
            });

        }

        $scope.isAvailableForDay = function () {
            if ($stateParams.tripId) {
                return trackService.isAvailableForDay($stateParams.tripId);
            }
            else return true;
        }
        $scope.isRecurrent = function () {
            if ($scope.recurrency && $scope.recurrency.daysOfWeek && $scope.recurrency.daysOfWeek.length > 0) {
                return true;
            }
            return false;

        }



        /*loaded adt beginning*/
        $scope.modifiable = true;
        $scope.isAvailable = true;
        if ($scope.isTracking()) {
            $scope.modifiable = false;
        }
        if (!$scope.isAvailableForDay()) {
            $scope.isAvailable = false;
        }
        if ($stateParams.tripId && $stateParams.lastStep == false) {
            initMyTrip();
        } else {
            initNewTrip();
        }

        //    $rootScope.previousState;
        //    $rootScope.currentState;
        //    $rootScope.$on('$stateChangeSuccess', function (ev, to, toParams, from, fromParams) {
        //        $rootScope.previousState = from.name;
        //        $rootScope.currentState = to.name;
        //        console.log('Previous state:' + $rootScope.previousState);
        //        console.log('Current state:' + $rootScope.currentState);
        //        if (to.name === 'app.tripdetails') {
        //            $window.dispatchEvent(new Event('resize'));
        //        }
        //    });
        $scope.$on('$ionicView.afterEnter', function (e) {
            // Prevent destroying of leaflet
            if ($state.current.name == 'app.tripdetails') {
                $scope.initMap();
            };
        });
    })
