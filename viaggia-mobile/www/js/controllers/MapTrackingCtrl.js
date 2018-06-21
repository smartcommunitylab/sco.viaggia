angular.module('viaggia.controllers.mapTracking', [])

    .controller('MapTrackingCtrl', function ($scope, $state, $filter, $rootScope, $ionicPopup, trackService, $ionicHistory, mapService, Config) {
        $scope.pathLine = {
            walk: {
                color: 'red',
                weight: 8,
                latlngs: []
            },
            bike: {
                color: 'yellow',
                weight: 8,
                latlngs: []
            },
            train: {
                color: 'blue',
                weight: 8,
                latlngs: []
            },
            bus: {
                color: 'green',
                weight: 8,
                latlngs: []
            }
        };
        $scope.$on('$ionicView.afterEnter', function (e) {
            $scope.initMap();
        });

        $scope.initMap = function () {
            mapService.initMap('trackingMap', true).then(function () {
                if ($rootScope.myPosition) {
                    $scope.center = {
                        lat: $rootScope.myPosition[0],
                        lng: $rootScope.myPosition[1],
                        zoom: Config.getMapPosition().zoom
                    }
                }
                //add all the previous points on the map
                $scope.initPath();
                var actualMultimodal = localStorage.getItem(Config.getAppId() + '_multimodalId');
                BackgroundGeolocation.getLocations(function (locations) {
                    locations.forEach(location => {

                        //check if stored are equal to current multimodal
                        if (location.extras.multimodalId === actualMultimodal)
                            $scope.pathLine[location.extras.transportType].latlngs.push({ lat: location.coords.latitude, lng: location.coords.longitude });
                    });
                    // console.log("locations: ", locations);
                });


            })
        }
        $scope.initPath = function () {
            $scope.pathLine.walk.latlngs = [];
            $scope.pathLine.bike.latlngs = [];
            $scope.pathLine.bus.latlngs = [];
            $scope.pathLine.train.latlngs = [];
        }

        $scope.stopTracking = function () {
            trackService.stop();
            //clean also multimodal if present
            $ionicHistory.goBack();
        }
        $scope.goHome = function () {
            $state.go('app.home');
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
        }

        $scope.changeTracking = function (type) {
            //se type e' uguale al tipo attuale non cambiare
            if (!$scope.actualTracking(type) && trackService.trackingIsGoingOn()) {
                //show popup if u want change the tracking mean
                $ionicPopup.show({
                    title: $filter('translate')("pop_up_change_free_track_title"),
                    template: $filter('translate')("pop_up_change_free_track_template"),
                    buttons: [
                        {
                            text: $filter('translate')("btn_close"),
                            type: 'button-cancel'
                        },
                        {
                            text: $filter('translate')("pop_up_change_free_track_go_on"),
                            type: 'button-custom',
                            onTap: function () {
                                //close track and start another one
                                trackService.stopNoSynch().then(function () {
                                    trackService.startTransportTrack(type).then(function () {
                                    });
                                }, function () {
                                    Toast.show($filter('translate')('pop_up_error_server_template'), "short", "bottom");
                                });
                            }
                        }]
                })

            }
        }

        $scope.actualTracking = function (type) {
            //TODO actually return true only if type is walk
            var tripId = localStorage.getItem(Config.getAppId() + '_tripId');
            if (tripId && tripId.startsWith(type))
                return true;
            return false;
        }
        $scope.getActualTracking = function () {
            //TODO actually return true only if type is walk
            var tripId = localStorage.getItem(Config.getAppId() + '_tripId');
            return tripId.substring(0, tripId.indexOf('_'));
        }
        $scope.centerOnMe = function () {

            if ($rootScope.myPosition && $scope.center.zoom)
                $scope.center = {
                    lat: $rootScope.myPosition[0],
                    lng: $rootScope.myPosition[1],
                    zoom: $scope.center.zoom
                }

        }
        function onLocation(location) {
            console.log('- location: ', location);
            // add to map
            $scope.pathLine[$scope.getActualTracking()].latlngs.push({ lat: location.coords.latitude, lng: location.coords.longitude });
        }
        function onLocationError(error) {
            console.log('- location error: ', error);
        }
        // Add a location listener
        BackgroundGeolocation.on('location', onLocation, onLocationError);
        // $scope.pathLine = mapService.getTripPolyline(trip.data);
        // $scope.pathMarkers = mapService.getTripPoints(trip.data);

        angular.extend($scope, {
            center: {
                lat: Config.getMapPosition().lat,
                lng: Config.getMapPosition().long,
                zoom: Config.getMapPosition().zoom
            },
            markers: $scope.pathMarkers,
            events: {},
            pathLine: $scope.pathLine
        });
        function myLoop() {
            setTimeout(function () {

                //aggiorna mappa
                // planService.getTrip($stateParams.tripId).then(function (trip) {
                // });
                myLoop();
            }, 500)
        }

        myLoop();
    });
