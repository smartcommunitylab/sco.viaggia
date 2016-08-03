angular.module('viaggia.controllers.mytrips', [])

.controller('MyTripsCtrl', function ($scope, Config, $timeout, ionicMaterialMotion, ionicMaterialInk, planService, $state, $filter, loginService) {

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
    $scope.load = function () {
        Config.loading();
        planService.getTrips(true).then(function (data) {
            $scope.savedTripsDB = data;
            $scope.savedTripsKeys = [];
            if ($scope.savedTripsDB) {
                $scope.savedTripsKeys = Object.keys($scope.savedTripsDB);
            }
            $scope.savedTrips = [];
            for (var k = 0; k < $scope.savedTripsKeys.length; k++) {
                $scope.savedTrips.push($scope.savedTripsDB[$scope.savedTripsKeys[k]]);
            }
            Config.loaded();
            $scope.$broadcast('scroll.refreshComplete');
            //$scope.$apply();
        }, function () {
            Config.loaded();
            $scope.$broadcast('scroll.refreshComplete');
        });
    }
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
    $scope.deleteTrip = function ($index) {
        var journey = $scope.savedTrips[$index];

        $scope.showConfirm($filter('translate')("popup_delete_trip_message"), $filter('translate')("popup_delete_trip_title"), function () {
            Config.loading();
            planService.deleteTrip(journey.tripId).then(function (res) {
                $scope.savedTrips.splice($index, 1);
            }).finally(Config.loaded);
        });



        //delete $scope.placesandcoordinates[favorite.name];
    }
    $scope.userIsLogged = function () {
        return loginService.userIsLogged();
    }
    $scope.modifyTrip = function ($index) {
        var journey = $scope.savedTrips[$index];


        $scope.showConfirm($filter('translate')("popup_modify_trip_message"), $filter('translate')("popup_modify_trip_title"), function () {
            Config.loading();
            planService.getTrip(journey.tripId).then(function (trip) {
                if (trip.data) {
                    planService.setName("from", trip.data.originalFrom.name);
                    planService.setName("to", trip.data.originalTo.name);
                    planService.setPlanConfigure(planService.buildConfigureOptions(trip));
                    planService.setEditInstance(trip);
                    //            planService.setTripId($scope.tripId);
                    //            planService.setTripName(trip.name);
                    var params = {
                        replan: true,
                        tripId: journey.clientId
                    }
                    $state.go('app.plan', params);
                }
            }).finally(Config.loaded);
        });
    }
})
