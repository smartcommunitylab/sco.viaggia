angular.module('viaggia.controllers.planlist', [])

.controller('PlanlistCtrl', function ($scope, planService, ionicMaterialMotion, ionicMaterialInk, $timeout) {
    $scope.journeys = planService.getplanJourneyResults();
    $scope.journeys.forEach(function (it, idx) {
        it.length = planService.getLength(it);
        it.means = planService.extractItineraryMeans(it);
        it.price = planService.getItineraryCost(it);
        it.index = idx;
    });
    $scope.$on('ngLastRepeat.journeys', function (e) {
        $timeout(function () {
            ionicMaterialMotion.ripple();
            ionicMaterialInk.displayEffect()
        }, 0); // No timeout delay necessary.
    });

})
