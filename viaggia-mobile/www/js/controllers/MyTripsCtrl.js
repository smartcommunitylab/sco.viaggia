angular.module('viaggia.controllers.mytrips', [])

.controller('MyTripsCtrl', function ($scope, Config, $timeout, ionicMaterialMotion, ionicMaterialInk, planService, $state) {

    planService.getTrips().then(function (data) {
        $scope.savedTripsDB = data;
        $scope.savedTripsKeys = [];

        if ($scope.savedTripsDB) {
            $scope.savedTripsKeys = Object.keys($scope.savedTripsDB);
        }
        $scope.savedTrips = [];
        for (var k = 0; k < $scope.savedTripsKeys.length; k++) {
            $scope.savedTrips.push($scope.savedTripsDB[$scope.savedTripsKeys[k]]);
        }
    });
    $scope.$on('ngLastRepeat.savedTrips', function (e) {
        $timeout(function () {
            ionicMaterialMotion.ripple();
            ionicMaterialInk.displayEffect()
        }, 0); // No timeout delay necessary.
    });

    $scope.showPlan = function (journey) {
        $state.go('app.tripdetails', {
            tripId: journey.clientId
        });
    }
    $scope.isRecurrency = function (trip) {
        if (trip.recurrency && trip.recurrency.daysOfWeek && trip.recurrency.daysOfWeek.length > 0) {
            return true;
        }
        return false;
    }


})
