angular.module('viaggia.controllers.planlist', [])

.controller('PlanlistCtrl', function ($scope, planService, ionicMaterialMotion) {
    $scope.journeys = planService.getplanJourneyResults();
    ionicMaterialMotion.ripple();
})
