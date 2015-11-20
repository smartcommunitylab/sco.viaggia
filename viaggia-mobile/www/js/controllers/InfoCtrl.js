angular.module('viaggia.controllers.info', [])

.controller('InfoCtrl', function ($scope) {})

.controller('ParkingCtrl', function ($scope, $state, $stateParams, $timeout, $filter, $ionicModal, $ionicPopup, ionicMaterialMotion, ionicMaterialInk, leafletData, mapService, parkingService, Config, planService) {
    $scope.agencyId = $stateParams.agencyId;
    $scope.parkings = null;

    $scope.markers = [];

    $scope.title = $filter('translate')('menu_real_time_park');

    $scope.$on('ngLastRepeat.parkings', function (e) {
        $timeout(function () {
            ionicMaterialMotion.ripple();
            ionicMaterialInk.displayEffect()
        }); // No timeout delay necessary.
    });

    $scope.load = function () {
        parkingService.getParkings($scope.agencyId).then(function (data) {
            $scope.parkings = data;
            $scope.parkings.forEach(function (e) {
                if (e.monitored && e.slotsAvailable > -2) {
                    e.availLevel = e.slotsAvailable <= 5 ? 'avail-red' : e.slotsAvailable > 20 ? 'avail-green' : 'avail-yellow';
                }
            });
            Config.loaded();
            $scope.$broadcast('scroll.refreshComplete');
        }, function (err) {
            $scope.parkings = null;
            $scope.$broadcast('scroll.refreshComplete');
            Config.loaded();
        });
    }

    var init = function () {
        Config.loading();
        $scope.load();
    };

    $scope.selected = null;
    $scope.select = function (p) {
        if ($scope.selected == p) $scope.selected = null;
        else $scope.selected = p;
    };

    $scope.showMap = function () {
        $scope.modalMap.show().then(function () {
            var markers = [];

            var list = $scope.selected != null ? [$scope.selected] : $scope.parkings;
            if (list == null) list = [];
            var boundsArray = [];
            for (var i = 0; i < list.length; i++) {
                markers.push({
                    parking: list[i],
                    lat: parseFloat(list[i].position[0]),
                    lng: parseFloat(list[i].position[1]),
                    icon: {
                        iconUrl: 'img/ic_parkingLot.png',
                        iconSize: [36, 50],
                        iconAnchor: [18, 50],
                        popupAnchor: [-0, -50]
                    },
                    //                        focus: true
                });
                boundsArray.push(list[i].position);
            }
            if (boundsArray.length > 0) {
                var bounds = L.latLngBounds(boundsArray);
                mapService.getMap('modalMap').then(function (map) {
                    map.fitBounds(bounds);
                });
            }
            $scope.markers = markers;
        });
    };

    $ionicModal.fromTemplateUrl('templates/mapModal.html', {
        id: '1',
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modalMap = modal;
    });

    angular.extend($scope, {
          center: {
            lat: Config.getMapPosition().lat,
            lng: Config.getMapPosition().long,
            zoom: Config.getMapPosition().zoom
          },
        markers: [],
        events: {}
    });

    $scope.closeMap = function () {
        $scope.modalMap.hide();
    };
    $scope.initMap = function () {
        mapService.initMap('modalMap').then(function () {
          console.log('map initialized');
        });
    };

    $scope.$on('leafletDirectiveMarker.modalMap.click', function (e, args) {
        var p = $scope.markers[args.modelName].parking;
        $scope.popupParking = p;
        $ionicPopup.show({
            templateUrl: 'templates/parkingPopup.html',
            title: $filter('translate')('lbl_parking'),
            cssClass: 'parking-popup',
            scope: $scope,
            buttons: [
                {
                    text: $filter('translate')('btn_close')
                },
                {
                    text: $filter('translate')('btn_nav_to'),
                    onTap: function (e) {
                      planService.setPlanConfigure({
                        to: {name: $scope.popupParking.description, lat: $scope.popupParking.position[0], long: $scope.popupParking.position[1]},
                      });
                      $scope.closeMap();
                      $state.go('app.plan');
                    }
        }
      ]
        });
    });

    $timeout(init, 200);
})


.controller('BikeSharingCtrl', function ($scope, $state, $stateParams, $timeout, $filter, $ionicModal, $ionicPopup, ionicMaterialMotion, ionicMaterialInk, leafletData, mapService, bikeSharingService, Config, planService) {
    $scope.agencyId = $stateParams.agencyId;
    $scope.parkings = null;

    $scope.markers = [];

    $scope.title = $filter('translate')('menu_real_time_bike');

    $scope.$on('ngLastRepeat.parkings', function (e) {
        $timeout(function () {
            ionicMaterialMotion.ripple();
            ionicMaterialInk.displayEffect()
        }); // No timeout delay necessary.
    });



    $scope.load = function () {
        bikeSharingService.getStations($scope.agencyId).then(function (data) {
            $scope.parkings = data;
            Config.loaded();
            $scope.$broadcast('scroll.refreshComplete');
        }, function (err) {
            $scope.parkings = null;
            $scope.$broadcast('scroll.refreshComplete');
            Config.loaded();
        });
    }

    var init = function () {
        Config.loading();
        $scope.load();
    };

    $scope.selected = null;
    $scope.select = function (p) {
        if ($scope.selected == p) $scope.selected = null;
        else $scope.selected = p;
    };

    $scope.showMap = function () {
        $scope.modalMap.show().then(function () {
            var markers = [];

            var list = $scope.selected != null ? [$scope.selected] : $scope.parkings;
            if (list == null) list = [];
            var boundsArray = [];
            for (var i = 0; i < list.length; i++) {
                markers.push({
                    parking: list[i],
                    lat: parseFloat(list[i].position[0]),
                    lng: parseFloat(list[i].position[1]),
                    icon: {
                        iconUrl: 'img/ic_bike.png',
                        iconSize: [36, 50],
                        iconAnchor: [18, 50],
                        popupAnchor: [-0, -50]
                    },
                    //                        focus: true
                });
                boundsArray.push(list[i].position);
            }
            if (boundsArray.length > 0) {
                var bounds = L.latLngBounds(boundsArray);
                mapService.getMap('modalMap').then(function (map) {
                    map.fitBounds(bounds);
                });
            }
            $scope.markers = markers;
        });
    };

    $ionicModal.fromTemplateUrl('templates/mapModal.html', {
        id: '1',
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modalMap = modal;
    });

    angular.extend($scope, {
        center: {
          lat: Config.getMapPosition().lat,
          lng: Config.getMapPosition().long,
          zoom: Config.getMapPosition().zoom
        },
        markers: [],
        events: {}
    });

    $scope.closeMap = function () {
        $scope.modalMap.hide();
    };
    $scope.initMap = function () {
        mapService.initMap('modalMap').then(function () {});
    };

    $scope.$on('leafletDirectiveMarker.modalMap.click', function (e, args) {
        var p = $scope.markers[args.modelName].parking;
        $scope.popupParking = p;
        $ionicPopup.show({
            templateUrl: 'templates/bikesharingPopup.html',
            title: $filter('translate')('lbl_bike_station'),
            cssClass: 'parking-popup',
            scope: $scope,
            buttons: [
                {
                    text: $filter('translate')('btn_close')
                },
                {
                    text: $filter('translate')('btn_nav_to'),
                    onTap: function (e) {
                      planService.setPlanConfigure({
                        to: {name: $scope.popupParking.address, lat: $scope.popupParking.position[0], long: $scope.popupParking.position[1]},
                      });
                      $scope.closeMap();
                      $state.go('app.plan');
                    }
        }
      ]
        });
    });

    init();
})
