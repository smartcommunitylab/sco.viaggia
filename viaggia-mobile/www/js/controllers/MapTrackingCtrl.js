angular.module('viaggia.controllers.mapTracking', [])

    .controller('MapTrackingCtrl', function ($scope, $rootScope, leafletData, mapService, Config) {
        $scope.pathLine = {
            p1: {
                color: 'red',
                weight: 8,
                latlngs: []
            }
        };
        $scope.$on('$ionicView.afterEnter', function (e) {
            $scope.initMap();
        });

        $scope.initMap = function () {
            mapService.initMap('trackingMap', true).then(function () {
                //add polyline
            })
        }
        // BackgroundGeolocation.getLocations(function(locations) {
        //     console.log("locations: ", locations);
        //   });
        $scope.centerOnMe = function () {


            $scope.center = {
                lat: $rootScope.myPosition[0],
                lng: $rootScope.myPosition[1],
                zoom: $scope.center.zoom
            }
              
        }
        function onLocation(location) {
            console.log('- location: ', location);
            // add to map
            $scope.pathLine.p1.latlngs.push({ lat: location.coords.latitude, lng: location.coords.longitude })
            // $scope.center = {
            //     lat: location.coords.latitude,
            //     lng: location.coords.longitude,
            //     zoom: $scope.center.zoom
            // }
            // leafletData.getMap('trackingMap').then(function (map) {
            //     mapService.addMyPosition(map);
            // });
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
