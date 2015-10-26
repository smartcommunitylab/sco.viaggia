angular.module('viaggia.controllers.plan', [])

.controller('PlanCtrl', function ($scope, Config, $q, $http, $ionicModal, $ionicLoading, leafletData, planService) {

    $scope.preferences = Config.getPlanPreferences();
    $scope.plan = {
        time: new Date()
    };
    $scope.togglePreferences = function () {
        if ($scope.isPreferencesShown()) {
            $scope.shownPreferences = false;
        } else {
            $scope.shownPreferences = true;
        }
    };
    $scope.isPreferencesShown = function () {
        return $scope.shownPreferences === true;
    };

    $ionicModal.fromTemplateUrl('templates/mapPlan.html', {
        id: '1', // We need to use and ID to identify the modal that is firing the event!
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modalMap = modal;
    });

    $scope.openMapPlan = function () {
        $scope.modalMap.show();
    }

    $scope.closeMap = function () {
        $scope.modalMap.hide();
    }




    /*part for the map*/
    $scope.initMap = function () {


        leafletData.getMap().then(function (map) {


            L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/{type}/{z}/{x}/{y}.{ext}', {
                type: 'map',
                ext: 'jpg',
                attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; ' +
                    'Map data {attribution.OpenStreetMap}',
                subdomains: '1234',
                maxZoom: 18
            }).addTo(map);
            map.locate({
                setView: false,
                maxZoom: 8,
                watch: false,
                enableHighAccuracy: true
            });
            map.on('locationfound', onLocationFound);

            function onLocationFound(e) {
                $scope.myloc = e;
                var radius = e.accuracy / 2;

                L.marker(e.latlng).addTo(map);
                //                        .bindPopup("You are within " + radius + " meters from this point").openPopup();

                L.circle(e.latlng, radius).addTo(map);

            }
            L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/{type}/{z}/{x}/{y}.{ext}', {
                type: 'map',
                ext: 'jpg',
                attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; ' +
                    'Map data {attribution.OpenStreetMap}',
                subdomains: '1234',
                maxZoom: 18
            }).addTo(map);
        });

        $scope.$on("leafletDirectiveMap.click", function (event, args) {
            $ionicLoading.show();
            planService.setPositionFrom(args.leafletEvent.latlng.lat, args.leafletEvent.latlng.lng);
            var placedata = $q.defer();
            var places = {};
            var url = Config.getGeocoderURL() + '/location?latlng=' + args.leafletEvent.latlng.lat + ',' + args.leafletEvent.latlng.lng;

            $http.get(encodeURI(url), {
                timeout: 5000
            }).
            success(function (data, status, headers, config) {
                $ionicLoading.hide();
                places = data.response.docs;
                name = '';
                if (data.response.docs[0]) {
                    if (data.response.docs[0].name) {
                        name = name + data.response.docs[0].name;
                    }
                    if (data.response.docs[0].street && (data.response.docs[0].name != data.response.docs[0].street)) {
                        if (name)
                            name = name + ', ';
                        name = name + data.response.docs[0].street;
                    }
                    if (data.response.docs[0].housenumber) {
                        if (name)
                            name = name + ', ';
                        name = name + data.response.docs[0].housenumber;
                    }
                    if (data.response.docs[0].city) {
                        if (name)
                            name = name + ', ';
                        name = name + data.response.docs[0].city;
                    }


                    $scope.showConfirm(name);
                } else {
                    $scope.showConfirm($filter('translate')("signal_send_lat_template") + args.leafletEvent.latlng.lat.toString().substring(0, 7) + " " + $filter('translate')("signal_send_long_template") + args.leafletEvent.latlng.lng.toString().substring(0, 7), args.leafletEvent.latlng.lat, args.leafletEvent.latlng.lng);
                    // showNoPlace(args.leafletEvent.latlng.lat, args.leafletEvent.latlng.lng);
                }
            }).
            error(function (data, status, headers, config) {
                $ionicLoading.hide();
                showNoConnection();

            });

            //$scope.showConfirm(name);
        });
        $scope.detail = function (view) {
            window.location.assign(view);
        }

        $scope.closeWin = function () {
            leafletData.getMap().then(function (map) {
                map.closePopup();
            });
        }

        $scope.showConfirm = function (name) {
            var confirmPopup = $ionicPopup.confirm({
                title: $filter('translate')("signal_send_confirm_place_title"),
                template: name,
                buttons: [
                    {
                        text: $filter('translate')("signal_send_popup_cancel"),
                        type: 'button-custom'
                            },
                    {
                        text: $filter('translate')("signal_send_popup_ok"),
                        type: 'button-custom',
                        onTap: function (res) {
                            if (res) {
                                segnalaService.setPosition(segnalaService.getPosition()[0], segnalaService.getPosition()[1]);
                                segnalaService.setName(name);
                                //                    window.history.back();
                                window.location.assign('#/app/segnala/' + name);
                                $ionicHistory.nextViewOptions({
                                    disableAnimate: true,
                                    disableBack: true
                                });
                            }
                        }
                    }
            ]
            });

        }


        /*end of part for map*/
    }
    angular.extend($scope, {
        center: {
            lat: 45.890931,
            lng: 11.041126,
            zoom: 12
        },
        events: {}
    });
})
