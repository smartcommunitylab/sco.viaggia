angular.module('viaggia.controllers.mytrips', [])

.controller('MyTripsCtrl', function ($scope, Config, $timeout, ionicMaterialMotion, ionicMaterialInk, planService, $state) {

    $scope.savedTripsOnMemory = JSON.parse(localStorage.getItem(Config.getAppId() + "_savedTrips"));
    $scope.savedTripsKeys = [];
    if ($scope.savedTripsOnMemory) {
        $scope.savedTripsKeys = Object.keys($scope.savedTripsOnMemory);
    }
    $scope.savedTrips = [];
    for (var k = 0; k < $scope.savedTripsKeys.length; k++) {
        $scope.savedTrips.push($scope.savedTripsOnMemory[$scope.savedTripsKeys[k]]);
    }
    $scope.$on('ngLastRepeat.savedTrips', function (e) {
        $timeout(function () {
            ionicMaterialMotion.ripple();
            ionicMaterialInk.displayEffect()
        }, 0); // No timeout delay necessary.
    });

    $scope.showPlan = function (journey) {
        planService.setSelectedJourney(journey.data.data);
        planService.setPlanConfigure(journey.data.originalRequest);
        planService.setName("from", journey.data.originalFrom.name);
        planService.setName("to", journey.data.originalTo.name);
        planService.setTripId(journey.tripId);
        $state.go('app.tripdetails');
    }
})
