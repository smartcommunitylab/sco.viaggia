angular.module('viaggia.controllers.home', [])

.controller('HomeCtrl', function ($scope, Config, mapService, ionicMaterialMotion, ionicMaterialInk) {

    $scope.buttons = [{
        label: 'News',
        icon: 'ic_news'
}, {
        label: 'Notifications',
        icon: 'ic_notification'
}];

    $scope.initMap = function () {
        mapService.initMap().then(function () {});
    }
    ionicMaterialMotion.ripple();
    ionicMaterialInk.displayEffect()
    angular.extend($scope, {
        center: {
            lat: Config.getMapPosition().lat,
            lng: Config.getMapPosition().long,
            zoom: Config.getMapPosition().zoom
        },
        events: {}
    });



})
