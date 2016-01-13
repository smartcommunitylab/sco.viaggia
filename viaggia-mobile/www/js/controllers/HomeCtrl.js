angular.module('viaggia.controllers.home', [])

.controller('HomeCtrl', function ($scope, $rootScope, $timeout, $filter, $location, marketService, Config, GeoLocate, mapService, ionicMaterialMotion, ionicMaterialInk, bookmarkService) {

    $scope.buttons = [{
        label: $filter('translate')('menu_news'),
        icon: 'ic_news'
}, {
        label: $filter('translate')('menu_notifications'),
        icon: 'ic_notification'
}];
    var mymap = document.getElementById('map-container');

    Config.init().then(function () {
        $rootScope.title = Config.getAppName();
        angular.extend($scope, {
            center: {
                lat: Config.getMapPosition().lat,
                lng: Config.getMapPosition().long,
                zoom: Config.getMapPosition().zoom
            },
            events: {}
        });
        bookmarkService.getBookmarks().then(function(list) {
          var homeList = [];
          list.forEach(function(e) {if (e.home) homeList.push(e);});
          $scope.primaryLinks = homeList;//Config.getPrimaryLinks();
        });
        marketService.initMarketFavorites();

    });

    $scope.$on('ngLastRepeat.primaryLinks', function (e) {
        $timeout(function () {
            ionicMaterialMotion.ripple();
            ionicMaterialInk.displayEffect()
        }); // No timeout delay necessary.
    });

    /* DISABLED MAP
        $scope.initMap = function () {
            mapService.initMap('homeMap').then(function (map) {

                if (mymap != null) {
                    mapService.resizeElementHeight(mymap, 'homeMap');
                    mapService.refresh('homeMap');
                }
                Config.init().then(function () {
                  mapService.centerOnMe('homeMap', Config.getMapPosition().zoom);
                });
            });
        }
        window.onresize = function () {
            if (mymap != null) {
                mapService.resizeElementHeight(mymap, 'homeMap');
                mapService.refresh('homeMap');
            }
        }


        $scope.$on('$ionicView.beforeEnter', function(){
          mapService.resizeElementHeight(mymap, 'homeMap');
          mapService.refresh('homeMap');
        });

        //just for init
        angular.extend($scope, {
            center: {
                lat: 0,
                lng: 0,
                zoom: 8
            },
            events: {}
        });
    */
    $scope.go = function (state) {
        $location.path(state);
    }

})
