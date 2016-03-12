angular.module('viaggia.controllers.tripdetails', [])

.controller('TripDetailsCtrl', function ($scope, $stateParams, $ionicModal, $filter, $ionicPopup, planService, mapService, Config, Toast, trackService, $filter, $ionicHistory, $state, $location, bookmarkService) {
    $scope.title = $filter('translate')('journey_detail');

    var initMyTrip = function () {
        planService.setEditInstance(null);
        $scope.editMode = false;
        planService.getTrip($stateParams.tripId).then(function (trip) {
            $scope.tripId = $stateParams.tripId;
            $scope.tripName = trip.data.name;
            $scope.bookmarkStyle = bookmarkService.getBookmarkStyle($location.path());
            $scope.requestedFrom = trip.data.originalFrom.name;
            $scope.requestedTo = trip.data.originalTo.name;

            planService.setPlanConfigure(trip.data.originalRequest);
            planService.process(trip.data.data, $scope.requestedFrom, $scope.requestedTo);
            $scope.currentItinerary = trip.data.data;
            $scope.pathLine = mapService.getTripPolyline(trip.data.data);
            $scope.pathMarkers = mapService.getTripPoints(trip.data.data);

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
        planService.process(trip, $scope.requestedFrom, $scope.requestedTo);
        $scope.currentItinerary = trip;
        $scope.pathLine = mapService.getTripPolyline(trip);
        $scope.pathMarkers = mapService.getTripPoints(trip);
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
        recursiveTrip: true
    }
    $scope.recursiveChange = function () {
        console.log('Push Notification Change', $scope.journey.recursiveTrip);
    };
    $scope.saveTrip = function () {
        var editInstance = planService.getEditInstance();
        if ($scope.tripId && editInstance) {
            planService.saveTrip($scope.tripId, $scope.trip, editInstance.data.name, $scope.requestedFrom, $scope.requestedTo).then(function (res) {
                planService.setEditInstance(null);
                $scope.editMode = false;
                $scope.tripId = res.tripId;
                //toast saved
                Toast.show($filter('translate')("tripsaved_message_feedback"), "short", "bottom");
                $ionicHistory.nextViewOptions({
                    historyRoot: true,
                    disableBack: true
                });
                $state.go('app.mytrips');
            });
            return;
        }
        $scope.data = {};
        $scope.showError = false;
        //        $scope.days = [
        //            {
        //                text: "L",
        //                checked: false
        //            },
        //            {
        //                text: "M",
        //                checked: false
        //            },
        //            {
        //                text: "M",
        //                checked: false
        //            },
        //            {
        //                text: "G",
        //                checked: false
        //            },
        //            {
        //                text: "V",
        //                checked: false
        //            },
        //            {
        //                text: "S",
        //                checked: false
        //            },
        //            {
        //                text: "D",
        //                checked: false
        //            }
        //  ];
        //        $scope.recursiveChange = function () {
        //            console.log('Push Notification Change', $scope.data.recursiveTrip);
        //        };
        //        $scope.data.recursiveTrip = true;



        $scope.recurrencyPopupDoW = [
            {
                name: 'dow_monday',
                shortname: 'dow_monday_short',
                value: 2,
                checked: true
        },
            {
                name: 'dow_tuesday',
                shortname: 'dow_tuesday_short',
                value: 3,
                checked: true
        },
            {
                name: 'dow_wednesday',
                shortname: 'dow_wednesday_short',
                value: 4,
                checked: false
        },
            {
                name: 'dow_thursday',
                shortname: 'dow_thursday_short',
                value: 5,
                checked: false
        },
            {
                name: 'dow_friday',
                shortname: 'dow_friday_short',
                value: 6,
                checked: false
        },
            {
                name: 'dow_saturday',
                shortname: 'dow_saturday_short',
                value: 7,
                checked: false
        },
            {
                name: 'dow_sunday',
                shortname: 'dow_sunday_short',
                value: 1,
                checked: false
        }
    ];
        // Prompt popup code
        $ionicPopup.prompt({
            templateUrl: 'templates/popup-savetrip.html',
            title: $filter('translate')('save_trip_title'),
            cssClass: 'parking-popup',
            scope: $scope,

            //            title: $filter('translate')('save_trip_title'),
            //            templateUrl: 'templates/popup-savetrip.html',
            //            //subTitle: $filter('translate')('save_trip_text'),
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
                            //Toast.show($filter('translate')("save_trip_error_message"), "short", "bottom");
                            $scope.showError = true;

                            e.preventDefault();
                        } else {
                            return $scope.data.nametrip;
                        }
                    }
                                }]
        }).then(function (res) {
            if (res) {
                planService.saveTrip($scope.tripId, $scope.trip, res, $scope.requestedFrom, $scope.requestedTo).then(function (res) {
                    planService.setEditInstance(null);
                    $scope.editMode = false;
                    $scope.tripId = res.tripId;
                    //toast saved
                    Toast.show($filter('translate')("tripsaved_message_feedback"), "short", "bottom");
                    $ionicHistory.goBack();
                });
            }
        });


    }
    $scope.modifyTrip = function () {
        //get configuration with tripid
        planService.getTrip($scope.tripId).then(function (trip) {
            planService.setName("from", $scope.requestedFrom);
            planService.setName("to", $scope.requestedTo);
            planService.setPlanConfigure(trip.data.originalRequest);
            planService.setEditInstance(trip);
            //            planService.setTripId($scope.tripId);
            //            planService.setTripName(trip.data.name);
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
        if (!$scope.fogEffect()) {
            trackService.start($scope.tripId); //params= idTrip, endTime, latEnd, longEnd
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
        if ($scope.isThisJourney() && $scope.trackingIsGoingOn()) {
            return true;
        }
        return false;
    }

    $scope.trackingIsGoingOn = function () {
        //check local storage is tracking
        if (localStorage.getItem(Config.getAppId() + '_state') != null) {
            return true;
        }
        return false;
    }
    $scope.fogEffect = function () {
        if (!$scope.isThisJourney() && $scope.trackingIsGoingOn()) {
            return true
        }
        return false;
    }
    $scope.showPopupIfNotThisJourney = function () {
        if ($scope.fogEffect()) {
            Toast.show('si sta gia monitorando un altro percorso', "short", "bottom");
        }

    }
    $scope.trackStop = function () {
        trackService.stop();
    }
})
