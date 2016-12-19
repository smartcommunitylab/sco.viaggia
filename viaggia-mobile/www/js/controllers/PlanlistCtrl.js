angular.module('viaggia.controllers.planlist', [])

.controller('PlanlistCtrl', function ($scope, planService, ionicMaterialMotion, ionicMaterialInk, $timeout, $state, $filter) {
    $scope.plantitle = $filter('translate')('plan_title');
    $scope.containsGreen = false;
    $scope.journeys = planService.getplanJourneyResults();
    $scope.empty = false;
    if (!$scope.planConfigure) {
        $scope.planConfigure = planService.getPlanConfigure();
    }
    if ($scope.planConfigure) {
        $scope.departureTime = planService.convertTo24Hour($scope.planConfigure.departureTime);
        $scope.departureDate = $filter('date')(planService.mmddyyyy2date($scope.planConfigure.date),'dd/MM/yyyy');
    }
    $scope.nameFrom = planService.getName('from');
    $scope.nameTo = planService.getName('to');
    if ($scope.journeys && $scope.journeys.length > 0) {
        $scope.journeys.forEach(function (it, idx) {
            if (it.promoted) {
                $scope.containsGreen = true;
            }
            it.length = planService.getLength(it);
            it.means = planService.extractItineraryMeans(it);
            it.price = planService.getItineraryCost(it);
            it.hasAlerts = planService.hasAlerts(it);

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
        $state.go('app.newtripdetails');
    }

})
