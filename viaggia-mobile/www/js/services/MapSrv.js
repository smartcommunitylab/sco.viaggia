angular.module('viaggia.services.map', [])

.factory('mapService', function ($q, $http, Config, planService, leafletData) {

    var mapService = {};
    var myLocation = {};

    mapService.setMyLocation = function (myNewLocation) {
        myLocation = myNewLocation
    };
    mapService.getMyLocation = function () {
        return myLocation;
    };

    //init map with tile server provider and show my position
    mapService.initMap = function () {
        var deferred = $q.defer();
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
                mapService.setMyLocation(e);
                var radius = e.accuracy / 2;
                L.marker(e.latlng).addTo(map);
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
            deferred.resolve(true);
        }, function (error) {
            console.log('error creation');
            deferred.reject(error);
        });
        return deferred.promise;
    }


    return mapService;
})
