angular.module('viaggia.controllers.home', [])

.controller('HomeCtrl', function ($scope, $timeout, $location, Config, mapService, ionicMaterialMotion, ionicMaterialInk) {

    $scope.buttons = [{
        label: 'News',
        icon: 'ion-ios-paper'
}, {
        label: 'Notifications',
        icon: 'ion-ios-bell'
}];
    var mymap = document.getElementById('map-container');

    Config.init().then(function () {
        angular.extend($scope, {
            center: {
                lat: Config.getMapPosition().lat,
                lng: Config.getMapPosition().long,
                zoom: Config.getMapPosition().zoom
            },
            events: {}
        });
        $scope.primaryLinks = Config.getPrimaryLinks();
    });

    $scope.$on('ngLastRepeat.primaryLinks', function (e) {
        $timeout(function () {
            ionicMaterialMotion.ripple();
            ionicMaterialInk.displayEffect()
        }); // No timeout delay necessary.
    });


    $scope.initMap = function () {
        mapService.initMap('homeMap').then(function () {

            if (mymap != null) {
                mapService.resizeElementHeight(mymap, 'homeMap');
                mapService.refresh('homeMap');
            }
        });
    }
    window.onresize = function () {
        if (mymap != null) {
            mapService.resizeElementHeight(mymap, 'homeMap');
            mapService.refresh('homeMap');

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

  $scope.go = function(state) {
    $location.path(state);
  }

})
