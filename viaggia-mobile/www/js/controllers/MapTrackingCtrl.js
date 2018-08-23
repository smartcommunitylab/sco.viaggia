angular.module('viaggia.controllers.mapTracking', [])

    .controller('MapTrackingCtrl', function ($scope, $state, $interval, $filter, $rootScope, trackService, $ionicHistory, mapService, Config) {


        $scope.pathLine = {
            walk: {
                color: 'red',
                type: 'polyline',
                weight: 8,
                latlngs: []
            },
            bike: {
                color: 'yellow',
                type: 'polyline',

                weight: 8,
                latlngs: []
            },
            train: {
                color: 'blue',
                type: 'polyline',

                weight: 8,
                latlngs: []
            },
            bus: {
                color: 'green',
                type: 'polyline',

                weight: 8,
                latlngs: []
            }
        };
        $scope.loadingMapData = false;
        $scope.$on('$ionicView.afterEnter', function (e) {
            $scope.initMap();
        });

        function setTrackingInfo() {
            if (localStorage.getItem(Config.getAppId() + '_startTimestamp'))
                $scope.trackingInfo = {
                    time: $filter('date')(new Date().getTime() - trackService.trackingTimeStart(), 'HH:mm:ss', '+0000')
                };
            else {
                $scope.trackingInfo = {
                    time: ""
                };
            }
        };

        var updateTrackingInfo = function () {
            setTrackingInfo();
            $scope.trackInfoInterval = $interval(function () {
                setTrackingInfo();
            }, 1000);
        }
        $scope.initMap = function () {
            $scope.loadingMapData = true;
            mapService.initMap('trackingMap', true).then(function () {
                if ($rootScope.myPosition) {
                    $scope.center = {
                        lat: $rootScope.myPosition[0],
                        lng: $rootScope.myPosition[1],
                        zoom: Config.getMapPosition().zoom
                    }
                }
                //add all the previous points on the map
                var actualMultimodal = localStorage.getItem(Config.getAppId() + '_multimodalId');
                BackgroundGeolocation.getLocations(function (locations) {
                    $scope.initPath();
                    // locations.sort(function (a, b) { return (a.timestamp > b.timestamp) ? 1 : ((b.timestamp > a.timestamp) ? -1 : 0); });
                    for (var i = 0; i < locations.length; i++) {
                        var location = locations[i];
                        // locations.forEach(location => {
                        //check if stored are equal to current multimodal
                        if (location.extras.multimodalId === actualMultimodal)
                            // $scope.pathLine[location.extras.transportType].latlngs.push({ lat: location.coords.latitude, lng: location.coords.longitude });
                            $scope.pathLine['walk'].latlngs.push({ lat: location.coords.latitude, lng: location.coords.longitude });
                    }
                    updateTrackingInfo();
                    $scope.updateBar(location);
                    // console.log("locations: ", locations);
                    $scope.loadingMapData = false;
                    BackgroundGeolocation.on('location', onLocation, onLocationError);

                }, function () {
                    $scope.loadingMapData = false;
                    BackgroundGeolocation.on('location', onLocation, onLocationError)
                });
            })
        }
        $scope.initPath = function () {
            $scope.pathLine.walk.latlngs = [];
            $scope.pathLine.bike.latlngs = [];
            $scope.pathLine.bus.latlngs = [];
            $scope.pathLine.train.latlngs = [];
        }

        // $scope.stopTracking = function () {
        //     trackService.stop();
        //     $scope.goHome();

        //     //clean also multimodal if present
        // }
        $scope.goHome = function () {
            $state.go('app.home');
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
        }
        $scope.shownGroupTrack = false;
        $scope.toggleGroupTrack = function () {
            if ($scope.isGroupTrackShown()) {
                $scope.shownGroupTrack = false;
            } else {
                $scope.shownGroupTrack = true;
            }
        };

        $scope.isGroupTrackShown = function () {
            return $scope.shownGroupTrack === true;
        };






        $scope.centerOnMe = function () {

            if ($rootScope.myPosition && $scope.center.zoom)
                $scope.center = {
                    lat: $rootScope.myPosition[0],
                    lng: $rootScope.myPosition[1],
                    zoom: $scope.center.zoom
                }
        }

        function onLocation(location) {
            // console.log('- location: ', location);
            // // add to map
            // var actualTrack = $scope.getActualTracking();
            // if (actualTrack)
            //     $scope.pathLine[actualTrack].latlngs.push({ lat: location.coords.latitude, lng: location.coords.longitude });

            // update the only path and update the bars on the
            if (!$scope.loadingMapData && ($scope.pathLine['walk'].latlngs.length == 0 || ($scope.pathLine['walk'].latlngs[$scope.pathLine['walk'].latlngs.length - 1].lat != location.coords.latitude && $scope.pathLine['walk'].latlngs[$scope.pathLine['walk'].latlngs.length - 1].lng != location.coords.longitude))) {
                $scope.pathLine['walk'].latlngs.push({ lat: location.coords.latitude, lng: location.coords.longitude });
                $scope.updateBar(location);
                mapService.refresh('trackingMap');
            }
        }
        function onLocationError(error) {
            console.log('- location error: ', error);
        }
        // Add a location listener
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
