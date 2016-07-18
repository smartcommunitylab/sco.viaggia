angular.module('viaggia.controllers.home', [])

.controller('HomeCtrl', function ($scope, $state, $rootScope, $ionicPlatform, $timeout, $interval, $filter, $location, $ionicHistory, marketService, notificationService, Config, GeoLocate, mapService, ionicMaterialMotion, ionicMaterialInk, bookmarkService, userService, planService, $ionicLoading, $ionicPopup, trackService, Toast) {
    //load from localstorage the id notifications read
    $ionicPlatform.ready(function () {
        document.addEventListener("resume", function () {
            notificationInit();
            Config.setWeeklySposnsor();

        }, false);
        Config.setWeeklySposnsor();

    });

    //aggoiorna le notifiche
    var notificationInit = function () {
        //scrico le ultime di una settimana
        if (localStorage.getItem(Config.getAppId() + '_lastUpdateTime') == null) {
            date = new Date();
            //date.setDate(date.getDate() - 7);
            lastUpdateTime = date.getTime();
        } else {
            lastUpdateTime = localStorage.getItem(Config.getAppId() + '_lastUpdateTime');
        }
        notificationService.getNotifications(lastUpdateTime, 0, 10).then(function (items) { //solo le nuove
            if (items) {
                $rootScope.countNotification = items.length;
                //last update time is the last time of notification
                if (items.length > 0) {

                    lastUpdateTime = items[0].updateTime + 1;
                }
                localStorage.setItem(Config.getAppId() + '_lastUpdateTime', lastUpdateTime);
            }
        }, function (err) {

            $rootScope.countNotification = 0;

        });
    }
    $scope.openSponsorLink = function (link) {
        window.open(link, '_system', 'location=yes');
        return false;
    }
    var localDataInit = function () {
        userService.getUserData();
        planService.getTrips().then(function () {
            //$ionicLoading.hide();
        }, function () {
            //$ionicLoading.hide();
        });
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
        localDataInit();

    }, function () {
        //$ionicLoading.hide();
    });
    $scope.$on("$ionicView.afterEnter", function (scopes, states) {
        $ionicLoading.hide();

    });
    $scope.$on("$ionicView.enter", function (scopes, states) {
      Config.init().then(function () {
        $scope.trackingIsOn = trackService.trackingIsGoingOn() && !trackService.trackingIsFinished();
        if ($scope.trackingIsOn) {
          updateTrackingInfo();
        }
      });
    });

    var translateTransport = function(t) {
      if (t == 'walk') return $filter('translate')('track_walk_action');
      if (t == 'bike') return $filter('translate')('track_bike_action');
      return $filter('translate')('track_other_action');
    }

    function setTrackingInfo() {
        $scope.trackingInfo = {
          transport: translateTransport(trackService.trackedTransport()),
          time: $filter('date')(new Date().getTime() - trackService.trackingTimeStart(),'HH:mm:ss','+0000')
        };
    };

    var updateTrackingInfo = function() {
      setTrackingInfo();
      $scope.trackInfoInterval = $interval(function(){
        setTrackingInfo();
      }, 1000);
    }

    $scope.startTracking = function(transportType) {
      Config.loading();
      if (!trackService.trackingIsGoingOn() || trackService.trackingIsFinished()) {
        trackService.startTransportTrack(transportType).then(function() {
          $scope.trackingIsOn = true;
          updateTrackingInfo();
        }, function(errorCode) {
          trackService.geolocationPopup();
        }).finally(Config.loaded);
      }
    }
    $scope.stopTracking = function() {
      Config.loading();

      trackService.computeInfo().then(function(data){
        trackService.stop().then(function(){
          // TODO: show distance if needed
          if (data.transport && data.dist){
            if (data.transport == 'walk') data.points = Math.max(53,data.dist / 1000 * 15);
            if (data.transport == 'bike') data.points = Math.max(53,data.dist / 1000 * 7.5);
//            alert(JSON.stringify(data));
            $ionicPopup.confirm({
                title: $filter('translate')("pop_up_points_title"),
                template: $filter('translate')("pop_up_points_template", {points:data.points}),
                buttons: [
                    {
                        text: $filter('translate')("btn_close"),
                        type: 'button-cancel'
                                },
                    {
                        text: $filter('translate')("pop_up_points_btn"),
                        type: 'button-custom',
                        onTap: function(){
                          $state.go('app.game');
                        }
                    }
                ]
            });
          }
        }).finally(function(){
          Config.loaded();
          $scope.trackingIsOn = false;
          $interval.cancel($scope.trackInfoInterval);
          $scope.trackingInfo = {};
        });
      });
    }

    $scope.openSavedTracks = function() {
      planService.getTrips().then(function(trips) {
        if (trips && !angular.equals(trips, {})) {
          $state.go('app.mytrips');
        } else {
          Toast.show($filter('translate')("no_saved_tracks_to_track"), "short", "bottom");
        }
      });
    }

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
        if (state.indexOf('(') > 0) {
            eval('$scope.' + state);
        } else {
            $location.path(state);
        }

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
