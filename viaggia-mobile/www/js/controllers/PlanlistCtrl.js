angular.module('viaggia.controllers.planlist', [])

.controller('PlanlistCtrl', function ($scope, planService, ionicMaterialMotion, ionicMaterialInk, $timeout, $state, $filter, $stateParams) {
    $scope.plantitle = $filter('translate')('plan_title');
    $scope.containsGreen = false;
    $scope.journeys = planService.getplanJourneyResults();
    $scope.empty = false;
    if ($stateParams.tripId) {
        $scope.tripId = $stateParams.tripId
    }
    if (!$scope.planConfigure) {
        $scope.planConfigure = planService.getPlanConfigure();
    }
    if ($scope.planConfigure) {
        //$scope.departureTime = convertTo24Hour($scope.planConfigure.departureTime);
        $scope.departureTime = planService.convertTo24Hour($scope.planConfigure.departureTime);
        $scope.departureDate = $filter('date')(planService.mmddyyyy2date($scope.planConfigure.date), 'dd/MM/yyyy');
    }
    $scope.nameFrom = planService.getName('from');
    $scope.nameTo = planService.getName('to');
    if ($scope.journeys && $scope.journeys.length > 0) {
        $scope.journeys.forEach(function (it, idx) {
            if (it.promoted) {
                $scope.containsGreen = true;
            }
            if (!it.hasOwnProperty("original")) {
                it.original = JSON.parse(JSON.stringify(it));
            }
            it.length = planService.getLength(it);
            it.means = planService.extractItineraryMeans(it);
            it.price = planService.getItineraryCost(it);
            it.index = idx;
        });
    } else {
        $scope.empty = true;
    }
    $scope.$on('ngLastRepeat.journeys', function (e) {
        $timeout(function () {
            ionicMaterialMotion.ripple();
            ionicMaterialInk.displayEffect()
        }, 0); // No timeout delay necessary.
    });
    $scope.showPlan = function (journey) {
        planService.setSelectedJourney(journey);
        if ($scope.tripId) {
            if (planService.getEditInstance()) {
                $state.go('app.newtripdetails', {
                    tripId: $scope.tripId,
                    replan: true,
                    lastStep: true
                });
            } else {
                $state.go('app.newtripdetails', {
                    tripId: $scope.tripId,
                    replan: true
                })
            };
        } else {
            $state.go('app.newtripdetails');
        }
    }

    //    function convertTo24Hour(time) {
    //        var hours = parseInt(time.substr(0, 2));
    //        if (time.indexOf('AM') != -1 && hours == 12) {
    //            time = time.replace('12', '0');
    //        }
    //        if (time.indexOf('PM') != -1 && hours < 12) {
    //            time = time.replace(hours, (hours + 12));
    //        }
    //        if (time.match(/0..:/))
    //            time = time.substring(1);
    //        return time.replace(/(AM|PM)/, '');
    //
    //    }
})
