angular.module('viaggia.controllers.tripdetails', [])

.controller('TripDetailsCtrl', function ($scope, $ionicModal, $filter, planService, mapService, Config) {
    $scope.title = $filter('translate')('map_detail_title');
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
        //        $scope.modalMap.show().then(function () {
        //            var modalMap = document.getElementById('modal-map-trip-container');
        //            if (modalMap != null) {
        //                mapService.resizeElementHeight(modalMap);
        //                mapService.refresh();
        //            }
        //        });
    }

    $scope.closeMap = function () {
        $scope.modalMap.hide();
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
