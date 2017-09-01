angular.module('viaggia.controllers.taxi', [])

/**
 * A SERVICE TO WORK WITH TAXI DATA FROM SERVER
 */
.controller('TaxiCtrl', function ($scope, $http, $q, $filter, Config, $ionicModal, $cordovaGeolocation, $ionicPopup, $state, $ionicLoading, planService, mapService, taxiService, GeoLocate) {


    $scope.showStreetName = false;
    $scope.userPosition = {}

    $scope.load = function () {
        $scope.locateMe();
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
                //set message on popup

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
                    boundsArray.push(list[i].location);
                }
                if (boundsArray.length > 0) {
                    var bounds = L.latLngBounds(boundsArray);
                    mapService.getMap('modalMapTaxi').then(function (map) {
                        if ($scope.userPosition && $scope.userPosition.name && $scope.showStreetName) {
                            mapService.setMyLocationMessage('modalMapTaxi', $scope.userPosition.name);
                        }
                        map.fitBounds(bounds);
                    });
                }
                $scope.markers = markers;
                if (withPopup) {
                    showPopup(list[0]);
                }

            }, function (err) {
                Config.loaded();
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
        mapService.initMap('modalMapTaxi',true).then(function () {
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
                                name: $scope.popupTaxi.address,
                                lat: $scope.popupTaxi.location[0],
                                long: $scope.popupTaxi.location[1]
                            },
                        });
                        planService.setName('to', $scope.popupTaxi.address);
                        $scope.closeMap();
                        $state.go('app.plan');
                    }
                }
            ]
        });

    }
    $scope.$on("$ionicView.enter", function (event, data) {
        console.log("refresh geocoder");
        $scope.locateMe();
    });

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


    $scope.locateMe = function () {
        //  $ionicLoading.show();

        GeoLocate.locate().then(function (position) {
            $scope.position = position;
            var placedata = $q.defer();
            var places = {};
            var url = Config.getGeocoderURL() + '/location?latlng=' + position[0] + ',' + position[1];
            //add timeout
            $http.get(encodeURI(url), {
                timeout: 5000
            })

            .success(function (data, status, headers, config) {
                places = data.response.docs;
                name = '';
                if (data.response.docs[0]) {
                    $scope.userPosition = data.response.docs[0];
                    if (GeoLocate.getAccuracy() <= Config.getTaxiAccuracy()) {
                        $scope.showStreetName = true;

                    } else {
                        $scope.showStreetName = false;
                    }
                }
                $ionicLoading.hide();
                // $scope.$apply();
            })

            .error(function (data, status, headers, config) {
                //temporary
                $ionicLoading.hide();
                // $scope.refresh = true;
                $scope.loading = false;
                $scope.taxiCompanies = null;
            });
            //                });
        }, function () {
            $ionicLoading.hide();
            //$scope.refresh = true;
            console.log('CANNOT LOCATE!');
        });
        // }
    };
    init();
});
