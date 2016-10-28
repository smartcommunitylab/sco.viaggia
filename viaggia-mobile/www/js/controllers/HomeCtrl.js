angular.module('viaggia.controllers.home', [])

.controller('HomeCtrl', function ($scope, $state, $rootScope, $ionicPlatform, $timeout, $filter, $location, $ionicHistory, marketService, notificationService, Config, GeoLocate, mapService, ionicMaterialMotion, ionicMaterialInk, bookmarkService) {
    //load from localstorage the id notifications read
    $ionicPlatform.ready(function () {
        document.addEventListener("resume", function () {
            notificationInit();
        }, false);
    });

    //aggoiorna le notifiche
    var notificationInit = function () {
    }

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

        bookmarkService.getBookmarksRT().then(function (list) {
            var homeList = [];
            list.forEach(function (e) {
                if (e.home) homeList.push(e);
            });
            $scope.primaryLinks = homeList; //Config.getPrimaryLinks();
        });
        marketService.initMarketFavorites();
        notificationInit();
        initWatch();
    });

    $scope.$on('ngLastRepeat.primaryLinks', function (e) {
        $timeout(function () {
            ionicMaterialMotion.ripple();
            ionicMaterialInk.displayEffect()
        }); // No timeout delay necessary.
    });
    var initWatch = function () {
            $scope.$watch('notificationService.notifications', function (newVal, oldVal, scope) {
                notificationInit();
            });
        }
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
    $scope.openNotifications = function () {
        $rootScope.countNotification = 0;
        $state.go('app.notifications');
    }
    $scope.go = function (state) {
        $location.path(state);
    }
    $scope.goToBookmarks = function () {
        $state.go('app.bookmarks');
        $ionicHistory.nextViewOptions({
            disableBack: true
        });

    }
    $scope.getCountNotification = function (counter) {
        if (counter > 9) {
            return counter + "+";
        }
        return counter;
    }

})
