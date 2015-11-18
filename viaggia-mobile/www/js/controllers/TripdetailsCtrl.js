angular.module('viaggia.controllers.tripdetails', [])

.controller('TripDetailsCtrl', function ($scope, $ionicModal, $filter, $ionicPopup, planService, mapService, Config, Toast, $filter, $ionicHistory, $state) {
    $scope.title = $filter('translate')('map_detail_title');
    var trip = planService.getSelectedJourney();
    $scope.requestedFrom = planService.getName("from");
    $scope.requestedTo = planService.getName("to");
    $scope.tripId = planService.getTripId();
    $scope.labelModify = $filter('translate')('journey_details_modify');
    $scope.labelDelete = $filter('translate')('journey_details_delete');
    planService.process(trip, $scope.requestFrom, $scope.requestTo);
    $scope.currentItinerary = trip;
    $scope.toTime = function (millis) {
        return planService.getTimeStr(new Date(millis));
    };
    $ionicModal.fromTemplateUrl('templates/mapModal.html', {
        id: '1',
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modalMap = modal;
    });
    $scope.openMapTrip = function () {
        $scope.modalMap.show();
    }

    $scope.closeMap = function () {
        $scope.modalMap.hide();
    }
    $scope.saveTrip = function () {
        // Prompt popup code
        $ionicPopup.prompt({
            title: $filter('translate')('save_trip_title'),
            template: $filter('translate')('save_trip_text'),

        }).then(function (res) {
            planService.saveTrip($scope.tripId, trip, res, $scope.requestedFrom, $scope.requestedTo).then(function (res) {

                //return tripToSave that contains new tripId and in data the trip

                $scope.tripId = res.tripId;
                //toast saved
                Toast.show($filter('translate')("tripsaved_message_feedback"), "short", "bottom");
            });
        });


    }
    $scope.modifyTrip = function () {
        $state.go('app.plan');

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
        mapService.initMap().then(function () {
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
