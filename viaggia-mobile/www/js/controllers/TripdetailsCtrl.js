angular.module('viaggia.controllers.tripdetails', [])

.controller('TripDetailsCtrl', function ($scope, $ionicModal, $filter, $ionicPopup, planService, mapService, Config, Toast, $filter, $ionicHistory, $state) {
    $scope.title = $filter('translate')('journey_detail');
    var trip = planService.getSelectedJourney();
    $scope.requestedFrom = planService.getName("from");
    if (!$scope.requestedFrom) {
        $scope.requestedFrom = trip.from.name;
    }
    if (!$scope.requestTo) {
        $scope.requestTo = trip.to.name;
    }
    $scope.requestedTo = planService.getName("to");
    $scope.tripId = planService.getTripId();
    $scope.labelModify = $filter('translate')('journey_details_modify');
    $scope.labelDelete = $filter('translate')('journey_details_delete');
    planService.process(trip, $scope.requestFrom, $scope.requestTo);
    $scope.currentItinerary = trip;
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
    $scope.saveTrip = function () {
        $scope.data = {};
        $scope.showError = false;
        // Prompt popup code
        $ionicPopup.prompt({
            title: $filter('translate')('save_trip_title'),
            templateUrl: 'templates/popup-savetrip.html',
            subTitle: $filter('translate')('save_trip_text'),
            scope: $scope,
            buttons: [
                {
                    text: $filter('translate')('save_trip_close_button')
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
                planService.saveTrip($scope.tripId, trip, res, $scope.requestedFrom, $scope.requestedTo).then(function (res) {
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
        planService.getTripFromMemory($scope.tripId).then(function (trip) {
            planService.setPlanConfigure(trip.data.originalRequest);
            $state.go('app.plan');
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





})
