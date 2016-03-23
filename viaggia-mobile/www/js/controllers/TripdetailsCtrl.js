angular.module('viaggia.controllers.tripdetails', [])

.controller('TripDetailsCtrl', function ($scope, $stateParams, $ionicModal, $filter, $ionicPopup, planService, mapService, Config, Toast, trackService, $filter, $ionicHistory, $state, $location, bookmarkService) {
    $scope.title = $filter('translate')('journey_detail');
    //$scope.empty_rec = Config.getDaysRec();

    var initMyTrip = function () {
        planService.setEditInstance(null);
        $scope.editMode = false;
        planService.getTrip($stateParams.tripId).then(function (trip) {
            $scope.tripId = $stateParams.tripId;
            $scope.tripName = trip.name;
            $scope.bookmarkStyle = bookmarkService.getBookmarkStyle($location.path());
            $scope.requestedFrom = trip.originalFrom.name;
            $scope.requestedTo = trip.originalTo.name;
            $scope.recurrency = trip.recurrency;
            if ($scope.isRecurrent()) {
                $scope.recurrentDays = $scope.getRecurrentDays($scope.recurrency);
            }
            planService.setPlanConfigure(trip.originalRequest);

            planService.process(trip.data, $scope.requestedFrom, $scope.requestedTo);
            $scope.currentItinerary = trip.data;
            $scope.pathLine = mapService.getTripPolyline(trip.data);
            $scope.pathMarkers = mapService.getTripPoints(trip.data);

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
        }
        $scope.requestedTo = planService.getName("to");
        if (!$scope.requestedTo) {
            $scope.requestedTo = trip.to.name;
        }
        var editInstance = planService.getEditInstance();
        $scope.tripId = editInstance ? editInstance.tripId : null;
        //        if (trip.original) {
        //            //not yet processed
        //            delete trip.original;
        //        }
        if (trip && trip.recurrency) {
            $scope.recurrency = trip.recurrency;
        }
        planService.process(trip, $scope.requestedFrom, $scope.requestedTo);
        $scope.currentItinerary = trip;
        $scope.pathLine = mapService.getTripPolyline(trip);
        $scope.pathMarkers = mapService.getTripPoints(trip);
        planService.getTrip($scope.tripId).then(function (trip) {
            if (trip) {
                $scope.recurrency = trip.recurrency;
            }

        });
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

    if ($stateParams.tripId) {
        initMyTrip();
    } else {
        initNewTrip();
    }

    $scope.toTime = function (millis) {
        return planService.getTimeStr(new Date(millis));
    };
    $ionicModal.fromTemplateUrl('templates/planMapModal.html', {
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
                mapService.getMap('planMapModal').then(function (map) {
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
                if ($scope.contains($scope.recurrency.daysOfWeek, k + 1)) {
                    $scope.recurrencyPopupDoW[k].checked = true;
                }
            }
        }
        if ($scope.tripId && editInstance) {
            $scope.data.nametrip = editInstance.data.name;
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
                            return $scope.data.nametrip;
                        }
                    }
                                }]
        }).then(function (res) {
                if (res) {
                    if ($scope.isRecurrent()) {
                        planService.saveTrip($scope.tripId, $scope.trip, res, $scope.requestedFrom, $scope.requestedTo, $scope.recurrencyPopupDoW).then(function (res) {
                            planService.setEditInstance(null);
                            $scope.tripId = res.tripId;
                            Toast.show($filter('translate')("tripsaved_message_feedback"), "short", "bottom");
                            navigateAfterSave($scope.tripId);

                        });

                    } else {
                        planService.saveTrip($scope.tripId, $scope.trip, $scope.data.nametrip, $scope.requestedFrom, $scope.requestedTo, $scope.recurrencyPopupDoW).then(function (res) {
                            planService.setEditInstance(null);
                            $scope.tripId = res.tripId;
                            $ionicHistory.nextViewOptions({
                                historyRoot: true,
                                disableBack: true
                            });
                            Toast.show($filter('translate')("tripsaved_message_feedback"), "short", "bottom");
                            navigateAfterSave($scope.tripId);

                        })
                    }
                }


            },
            function (err) {
                Toast.show($filter('translate')("save_trip_error_message"), "short", "bottom");
            }
        );
        return;



    }

    function navigateAfterSave(tripId) {
        //next view
        if (!tripId) {
            $ionicHistory.goBack();
        } else {
            $ionicHistory.nextViewOptions({
                historyRoot: true,
                disableBack: true
            });
            $state.go('app.mytrips');
        }
        $scope.editMode = false;
    }
    $scope.addDay = function (day) {
        console.log(day);
    }
    $scope.modifyTrip = function () {
        //get configuration with tripid
        planService.getTrip($scope.tripId).then(function (trip) {
            planService.setName("from", $scope.requestedFrom);
            planService.setName("to", $scope.requestedTo);
            planService.setPlanConfigure(trip.originalRequest);
            planService.setEditInstance(trip);
            //            planService.setTripId($scope.tripId);
            //            planService.setTripName(trip.name);
            $state.go('app.plan', {
                replan: true
            });
        });
        //        planService.setName("from", $scope.requestedFrom);
        //        planService.setName("to", $scope.requestedTo);
        //        planService.setTripId($scope.tripId);
        //        $state.go('app.plan');

    }
    $scope.deleteTrip = function () {
        $scope.showConfirm($filter('translate')("popup_delete_trip_message"), $filter('translate')("popup_delete_trip_title"), function () {
            planService.deleteTrip($scope.tripId).then(function (res) {
                //delete actual from localStorage and memory
                //go back in the stack

                $ionicHistory.goBack();
            });
        });

        //delete $scope.placesandcoordinates[favorite.name];
    }
    $scope.initMap = function () {
        mapService.initMap('planMapModal').then(function () {
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

    $scope.trackStart = function () {
        if (!$scope.notTrackable()) {
            trackService.sendServerStart($scope.tripId);
            trackService.start($scope.currentItinerary.endtime, $scope.tripId); //params= trip, idTrip. Enditime is authomatic calculated
        }
    }
    $scope.trackState = function () {
            trackService.getState();
        }
        //return true if this is the journey is going to track
    $scope.isThisJourney = function () {
        if (localStorage.getItem(Config.getAppId() + '_tripId') == $scope.tripId) {
            return true;
        }
        return false;
    }

    $scope.isTracking = function () {
        //return true if this is the tracking is going to track and is going
        if ($scope.isThisJourney() && trackService.trackingIsGoingOn()) {
            return true;
        }
        return false;
    }


    $scope.notTrackable = function () {
        if ((!$scope.isThisJourney() && trackService.trackingIsGoingOn()) || $scope.isInTime() != 0) {
            return true
        }
        return false;
    }
    $scope.isInTime = function () {
        var now = new Date();
        //if recurrent check only hours if day is correct;
        var startTime = $scope.currentItinerary.startime;
        if ($scope.recurrency && $scope.recurrency.daysOfWeek && $scope.recurrency.daysOfWeek.length > 0) {
            if ($scope.contains($scope.recurrency.daysOfWeek, now.getDay())) {
                var startTimeDate = new Date($scope.currentItinerary.startime);
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

    //    function contains(a, obj) {
    //        for (var i = 0; i < a.length; i++) {
    //            if (a[i] === obj) {
    //                return true;
    //            }
    //        }
    //        return false;
    //    }
    $scope.showPopupIfNotThisJourney = function () {
        if ($scope.notTrackable()) {
            if (!$scope.isThisJourney() && trackService.trackingIsGoingOn()) {
                Toast.show($filter('translate')('toast_already_monitoring'), "short", "bottom");
            } else if ($scope.isInTime() == -1) {
                Toast.show($filter('translate')('toast_before_time'), "short", "bottom");
            } else if ($scope.isInTime() == 1) {
                Toast.show($filter('translate')('toast_after_time'), "short", "bottom");
            }
        }

    }
    $scope.trackStop = function () {
        //build popup
        $ionicPopup.show({
            templateUrl: 'templates/deleteTrackConfirm.html',
            cssClass: 'parking-popup',
            scope: $scope,
            buttons: [
                {
                    text: $filter('translate')('btn_close'),
                    type: 'button-close'
                                },
                {
                    text: $filter('translate')('btn_conferma'),
                    onTap: function (e) {
                        //sign the trip as already done for the day
                        markAsDone($scope.tripId);
                        trackService.stop();
                    }
                    }

                        ]
        });

    }

    function markAsDone(tripId) {
        var date = new Date();
        date.setHours(0, 0, 0, 0);
        var doneTrips = JSON.parse(localStorage.getItem(Config.getAppId() + "_doneTrips"));
        if (!doneTrips) {
            doneTrips = {};
        }
        doneTrips[tripId] = date.getTime();
        localStorage.setItem(Config.getAppId() + "_doneTrips", JSON.stringify(doneTrips));


    }
    $scope.isAvailableForDay = function () {
        var date = new Date();
        date.setHours(0, 0, 0, 0);
        var doneTrips = JSON.parse(localStorage.getItem(Config.getAppId() + "_doneTrips"));

        if (doneTrips && Number(doneTrips[$scope.tripId]) == date.getTime()) {
            return false;
        }
        return true;
    }
    $scope.isRecurrent = function () {
        if ($scope.recurrency && $scope.recurrency.daysOfWeek && $scope.recurrency.daysOfWeek.length > 0) {
            return true;
        }
        return false;

    }

    //    function getRecurrentDays(recurrency) {
    //        var returnDays = [];
    //        for (var k = 0; k < $scope.empty_rec.length; k++) {
    //            if (contains(recurrency.daysOfWeek, k + 1)) {
    //                returnDays.push($scope.empty_rec[k]);
    //            }
    //        }
    //        return returnDays;
    //    }
})
