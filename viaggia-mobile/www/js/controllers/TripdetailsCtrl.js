angular.module('viaggia.controllers.tripdetails', [])

.controller('TripDetailsCtrl', function ($scope, $ionicModal, planService, mapService, Config) {
    $scope.requestedFrom = planService.getName("from");
    $scope.requestedTo = planService.getName("to");
    var trip = planService.getSelectedJourney();
    planService.process(trip, $scope.requestFrom, trip.to);
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

    $scope.initMap = function () {
        mapService.initMap().then(function () {})
    }

    angular.extend($scope, {
        center: {
            lat: Config.getMapPosition().lat,
            lng: Config.getMapPosition().long,
            zoom: Config.getMapPosition().zoom
        },
        events: {}
    });
})
