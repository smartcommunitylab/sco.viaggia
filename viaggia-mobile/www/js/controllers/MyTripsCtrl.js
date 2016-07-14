angular.module('viaggia.controllers.mytrips', [])

.controller('MyTripsCtrl', function ($scope, Config, $timeout, $filter, ionicMaterialMotion, ionicMaterialInk, planService, $state, trackService, Toast) {

    planService.getTrips().then(function (data) {
        var array = [];
        if (data) {
            for (var key in data) {
                array.push(data[key]);
            }
        }
        array.sort(function (t1, t2) {
            return t2.data.startime - t1.data.startime;
        });

        $scope.savedTrips = array;
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

    $scope.deleteTrip = function ($index) {
        var journey = $scope.savedTrips[$index];
        if (!trackService.isTracking(journey.clientId)) {

            $scope.showConfirm($filter('translate')("popup_delete_trip_message"), $filter('translate')("popup_delete_trip_title"), function () {
                Config.loading();
                planService.deleteTrip(journey.clientId).then(function (res) {
                    $scope.savedTrips.splice($index, 1);
                }).finally(Config.loaded);
            });

        } else {
            Toast.show($filter('translate')('toast_not_deletable'), "short", "bottom");
        }

        //delete $scope.placesandcoordinates[favorite.name];
    }
    $scope.modifyTrip = function ($index) {
        var journey = $scope.savedTrips[$index];
        if (!trackService.isTracking(journey.clientId)) {

            $scope.showConfirm($filter('translate')("popup_modify_trip_message"), $filter('translate')("popup_modify_trip_title"), function () {
                Config.loading();
                planService.getTrip(journey.clientId).then(function (trip) {
                    planService.setName("from", $scope.requestedFrom);
                    planService.setName("to", $scope.requestedTo);
                    planService.setPlanConfigure(planService.buildConfigureOptions(trip));
                    planService.setEditInstance(trip);
                    //            planService.setTripId($scope.tripId);
                    //            planService.setTripName(trip.name);
                    var params = {
                        replan: true,
                        tripId: journey.clientId
                    }
                    $state.go('app.plan', params);
                }).finally(Config.loaded);
            });

        } else {
            Toast.show($filter('translate')('toast_not_modifiable'), "short", "bottom");
        }

        //delete $scope.placesandcoordinates[favorite.name];
    }
})
