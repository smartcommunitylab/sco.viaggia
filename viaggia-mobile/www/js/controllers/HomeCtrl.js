angular.module('viaggia.controllers.home', [])

.controller('HomeCtrl', function ($scope, Config, mapService, ionicMaterialMotion, ionicMaterialInk) {

    $scope.buttons = [{
        label: 'News',
        icon: 'ion-ios-paper'
}, {
        label: 'Notifications',
        icon: 'ion-ios-bell'
}];
    var mymap = document.getElementById('map-container');

    Config.init().then(function () {
        ionicMaterialMotion.ripple();
        ionicMaterialInk.displayEffect();

        angular.extend($scope, {
            center: {
                lat: Config.getMapPosition().lat,
                lng: Config.getMapPosition().long,
                zoom: Config.getMapPosition().zoom
            },
            events: {}
        });
    });

    $scope.initMap = function () {
        mapService.initMap().then(function () {

            if (mymap != null) {
                mapService.resizeElementHeight(mymap);
                mapService.refresh();
            }
        });
    }
    window.onresize = function () {
        if (mymap != null) {
            mapService.resizeElementHeight(mymap);
            mapService.refresh();

        }
    }


    //just for init
    angular.extend($scope, {
        center: {
            lat: 0,
            lng: 0,
            zoom: 8
        },
        events: {}
    });


})
