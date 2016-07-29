angular.module('viaggia.controllers.tripdetails', [])

.controller('TripDetailsCtrl', function ($scope, $stateParams, $ionicModal, $filter, $ionicPopup, planService, mapService, Config, Toast, $filter, $ionicHistory, $state, $location, bookmarkService) {
    $scope.title = $filter('translate')('journey_detail');

    function getDaysOfRecurrency(days) {
        var returndays = [];
        for (var len = 0; len < days.length; len++) {
            if (days[len].checked) {
                returndays.push(len + 1);
            }
        }
        return returndays;
    };
    var initMyTrip = function () {
        $scope.editMode = false;
        planService.getTrip($stateParams.tripId).then(function (trip) {
            $scope.trip = trip;
            $scope.tripId = $stateParams.tripId;
            $scope.tripName = trip.name;

            $scope.bookmarkStyle = bookmarkService.getBookmarkStyle($location.path());
            $scope.requestedFrom = trip.originalFrom.name;
            $scope.requestedTo = trip.originalTo.name;
            $scope.recurrency = trip.recurrency;
            if ($scope.isRecurrent()) {
                $scope.recurrentDays = getDaysOfRecurrency($scope.recurrency);
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
        }
        $scope.requestedTo = planService.getName("to");
        if (!$scope.requestedTo) {
            $scope.requestedTo = trip.to.name;
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
        console.log('Recursive Change', $scope.journey.recursiveTrip);
        if (!$scope.journey.recursiveTrip) {
            $scope.recurrencyPopupDoW = JSON.parse(JSON.stringify(Config.getDaysRec()));
        }
    };
    $scope.isRecurrent = function () {
        if ($scope.recurrency && $scope.recurrency.daysOfWeek && $scope.recurrency.daysOfWeek.length > 0) {
            return true;
        }
        return false;

    }
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



})
