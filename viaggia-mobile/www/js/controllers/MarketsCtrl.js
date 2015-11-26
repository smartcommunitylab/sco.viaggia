angular.module('viaggia.controllers.markets', [])

.controller('MarketsCtrl', function ($scope, $state, planService, marketService) {
    var mercatino = marketService.getMercatinoPoint();
    var park = marketService.getParkPoint();
    $scope.goToMarket = function () {
        planService.setPlanConfigure({
            to: mercatino,
        });
        planService.setName('to', mercatino.name);
        $state.go('app.plan');
    }
    $scope.goToPark = function () {
        planService.setPlanConfigure({
            to: park,
        });
        planService.setName('to', park.name);
        $state.go('app.plan');
    }
});
