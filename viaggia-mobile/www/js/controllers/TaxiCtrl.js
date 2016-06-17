angular.module('viaggia.controllers.taxi', [])

/**
 * A SERVICE TO WORK WITH TAXI DATA FROM SERVER
 */
.controller('TaxiCtrl', function ($scope, $http, $q, $filter, Config, $ionicModal, $ionicPopup, $state, planService, mapService, taxiService) {




    $scope.load = function () {
        taxiService.getCompanies(Config.getAppId(), Config.getTaxiId()).then(function (data) {
            $scope.taxiCompanies = data;
            $scope.loading = false;
            Config.loaded();
            $scope.$broadcast('scroll.refreshComplete');
            //            if ($scope.selected) {
            //                $scope.showMap(true);
            //            }
        }, function (err) {
            $scope.taxiCompanies = null;
            $scope.$broadcast('scroll.refreshComplete');
            $scope.showNoConnection();
            $scope.loading = true;
            Config.loaded();
        });
    }
    var init = function () {
        $scope.loading = true;
        Config.loading();
        $scope.load();
    };
    $scope.showMap = function (withPopup) {
        $scope.modalMap.show().then(function () {
            Config.loading();
            taxiService.getTaxiPoints(Config.getAppId(), Config.getTaxiId()).then(function (data) {
                Config.loaded();
                $scope.taxiPoints = data;
                var markers = [];
                var list = ($scope.selected != null && withPopup) ? [$scope.selected] : $scope.taxiPoints;
                if (list == null) list = [];
                var boundsArray = [];
                for (var i = 0; i < list.length; i++) {
                    markers.push({
                        taxi: list[i],
                        lat: parseFloat(list[i].location[0]),
                        lng: parseFloat(list[i].location[1]),
                        icon: {
                            iconUrl: 'img/ic_taxi.png',
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
                    mapService.getMap('modalMapTaxi').then(function (map) {
                        map.fitBounds(bounds);
                    });
                }
                $scope.markers = markers;
                if (withPopup) {
                    showPopup(list[0]);
                }
            });
        }, function (err) {
            //output error
            Config.loaded();
        });
    };

    $scope.$on('$ionicView.beforeEnter', function () {
        mapService.refresh('modalMapTaxi');
    });

    $ionicModal.fromTemplateUrl('templates/mapModalTaxi.html', {
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
        mapService.initMap('modalMapTaxi').then(function () {
            console.log('map initialized');
        });
    };

    var showPopup = function (p) {
        $scope.popupTaxi = p;
        $scope.selected = p;

        $ionicPopup.show({
            templateUrl: 'templates/taxiPopup.html',
            title: $filter('translate')('lbl_taxi'),
            cssClass: 'parking-popup',
            scope: $scope,
            buttons: [
                {
                    text: $filter('translate')('btn_close'),
                    type: 'button-close'
                },
                {
                    text: $filter('translate')('btn_nav_to'),
                    onTap: function (e) {
                        planService.setPlanConfigure({
                            to: {
                                address: $scope.popupTaxi.address,
                                lat: $scope.popupTaxi.location[0],
                                long: $scope.popupTaxi.location[1]
                            },
                        });
                        planService.setName('to', $scope.popupTaxi.description);
                        $scope.closeMap();
                        $state.go('app.plan');
                    }
                }
            ]
        });

    }

    $scope.$on('leafletDirectiveMarker.modalMapTaxi.click', function (e, args) {
        var p = $scope.markers[args.modelName].taxi;
        showPopup(p);
    });

    $scope.navigate = function () {
        planService.setPlanConfigure({
            to: {
                name: $scope.selected.description,
                lat: $scope.selected.location[0],
                long: $scope.selected.location[1]
            },
        });
        planService.setName('to', $scope.selected.description);
        $scope.closeMap();
        $state.go('app.plan');
    };
    $scope.callPhone = function (number) {

    }
    $scope.messagePhone = function (number) {

    }
    init();
});
