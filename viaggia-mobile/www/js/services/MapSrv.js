angular.module('viaggia.services.map', [])

.factory('mapService', function ($q, $http, $ionicPlatform, $filter, Config, planService, leafletData, GeoLocate) {
    var colorsAndTypes = Config.getColorsTypes();

    var cachedMap = {};

    var getMapOfColors = function () {
        var mapOfColors = [];
        for (var k = 0; k < colorsAndTypes.length; k++) {
            mapOfColors[colorsAndTypes[k].type] = colorsAndTypes[k].color;
        }
        return mapOfColors;
    }

    var getColorByType = function (transport) {
        var colors = [];
        if (transport.type == 'BUS') {
            if (Config.getExtraurbanAgencies().indexOf(parseInt(transport.agencyId)) != -1)
                return mapOfColors['BUSSUBURBAN'];
        }
        return mapOfColors[transport.type];
    }
    var getMapOfIcons = function () {
        var mapOfIcons = [];
        for (var k = 0; k < colorsAndTypes.length; k++) {
            mapOfIcons[colorsAndTypes[k].type] = colorsAndTypes[k].icon;
        }
        return mapOfIcons;
    }
    var getIconByType = function (transport) {
        var icons = [];
        if (transport.type == 'BUS') {
            if (Config.getExtraurbanAgencies().indexOf(parseInt(transport.agencyId)) != -1)
                return mapOfIcons['BUSSUBURBAN'];
        }
        return mapOfIcons[transport.type];
    }
    var getPopUpMessage = function (trip, leg, i) {
        //from step to step
        var divreturn = "";
        if (trip.leg[i]) {
            var fromIndex = trip.leg[i].fromStep;
            var toIndex = trip.leg[i].toStep;
            var steps = toIndex - fromIndex;
            var internalIndex = fromIndex;
            //for (var k = 0; k < steps; k++) {
            //                if (steps > 1) {
            //                    divreturn = divreturn + '<div>' + $filter('translate')('popup_step_number') + k + '</div>';
            //                }
            if (trip.steps[internalIndex].startime) {
                divreturn = divreturn + '<div><strong>' + planService.getTimeStr(new Date(trip.steps[internalIndex].startime)) + '</strong></div><div class="col inter-leg">'
            }
            if (trip.steps[internalIndex].action) {
                divreturn = divreturn + '<p>' + trip.steps[internalIndex].action
            }
            if (trip.steps[internalIndex].actionDetails) {
                divreturn = divreturn + '<strong>' + trip.steps[internalIndex].actionDetails + '</strong></p>'
            }
            if (trip.steps[internalIndex].from) {
                divreturn = divreturn + '<p>' + trip.steps[internalIndex].fromLabel + '<strong>' + trip.steps[internalIndex].from + '</strong></p>'
            }
            if (trip.steps[internalIndex].to) {
                divreturn = divreturn + '<p>' + trip.steps[internalIndex].toLabel + '<strong>' + trip.steps[internalIndex].to + '</strong></p>'
            }
            if (trip.steps[internalIndex].parking && trip.steps[internalIndex].parking.cost) {
                divreturn = divreturn + '<p>' + trip.steps[internalIndex].parking.cost + '</strong></p>'
            }
            if (trip.steps[internalIndex].parking && trip.steps[internalIndex].parking.time) {
                divreturn = divreturn + '<p>' + trip.steps[steps].parking.time + '</p></div>'
            }
            internalIndex++;
            //}
        }
        return divreturn;
    }
    var mapService = {};
    var myLocation = {};
    var mapOfColors = getMapOfColors();
    var mapOfIcons = getMapOfIcons();


    mapService.getMap = function (mapId) {
        var deferred = $q.defer();

        if (cachedMap[mapId] == null) {
            mapService.initMap(mapId).then(function () {
                deferred.resolve(cachedMap[mapId]);
            });
        } else {
            deferred.resolve(cachedMap[mapId]);
        }

        return deferred.promise;
    }

    mapService.setMyLocation = function (myNewLocation) {
        myLocation = myNewLocation
    };
    mapService.getMyLocation = function () {
        return myLocation;
    };

    //init map with tile server provider and show my position
    mapService.initMap = function (mapId) {
        var deferred = $q.defer();

        leafletData.getMap(mapId).then(function (map) {
                cachedMap[mapId] = map;
                L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/{type}/{z}/{x}/{y}.{ext}', {
                    type: 'map',
                    ext: 'jpg',
                    attribution: '',
                    subdomains: '1234',
                    maxZoom: 18
                }).addTo(map);
                $ionicPlatform.ready(function () {
                    GeoLocate.locate().then(function (e) {
                        L.marker(L.latLng(e[0], e[1])).addTo(map);
                    });
                });

                deferred.resolve(true);
            },
            function (error) {
                console.log('error creation');
                deferred.reject(error);
            });
        return deferred.promise;
    }

    mapService.getTripPolyline = function (trip) {
            var listOfPoints = {};
            for (var k = 0; k < trip.leg.length; k++) {
                listOfPoints["p" + k] = {
                    color: getColorByType(trip.leg[k].transport),
                    weight: 5,
                    latlngs: mapService.decodePolyline(trip.leg[k].legGeometery.points),
                    message: getPopUpMessage(trip, trip.leg[k], k),
                }
            }
            return listOfPoints;
        }
        //    var parkAndWalk = function (trip, index) {
        //        if (index > (trip.leg.length - 2)) {
        //            return false;
        //        } //end of the journey
        //        //check if trip.leg[index] trip.leg[index1]
        //        if (trip.leg[index].type = "")
        //            return false;
        //    }
        //    var getMarkerParkAndWalk = function (leg) {}
    mapService.getTripPoints = function (trip) {
        //manage park&walk
        var markers = [];
        for (i = 0; i < trip.leg.length; i++) {
            //if (!parkAndWalk(trip, i)) {
            markers.push({
                    lat: parseFloat(trip.leg[i].from.lat),
                    lng: parseFloat(trip.leg[i].from.lon),

                    message: getPopUpMessage(trip, trip.leg[i], i),
                    icon: {
                        iconUrl: getIconByType(trip.leg[i].transport),
                        iconSize: [36, 50],
                        iconAnchor: [18, 50],
                        popupAnchor: [-0, -50]
                    },
                    //                        focus: true
                })
                //            }
                //        else {
                //                markers.push(getMarkerParkAndWalk(trip.leg[i]));
                //            }
            var bound = [trip.leg[i].from.lat, trip.leg[i].from.lon];

        }
        //add the arrival place
        markers.push({
            lat: parseFloat(trip.leg[trip.leg.length - 1].to.lat),
            lng: parseFloat(trip.leg[trip.leg.length - 1].to.lon),

            message: $filter('translate')('pop_up_arrival'),
            icon: {
                iconUrl: "img/ic_arrival.png",
                iconSize: [36, 50],
                iconAnchor: [0, 50],
                popupAnchor: [18, -50]
            },
            //                        focus: true
        });



        return markers;
    }
    mapService.encodePolyline = function (coordinate, factor) {
        coordinate = Math.round(coordinate * factor);
        coordinate <<= 1;
        if (coordinate < 0) {
            coordinate = ~coordinate;
        }
        var output = '';
        while (coordinate >= 0x20) {
            output += String.fromCharCode((0x20 | (coordinate & 0x1f)) + 63);
            coordinate >>= 5;
        }
        output += String.fromCharCode(coordinate + 63);
        return output;
    }

    mapService.resizeElementHeight = function (element, mapId) {
        var height = 0;
        var body = window.document.body;
        if (window.innerHeight) {
            height = window.innerHeight;
        } else if (body.parentElement.clientHeight) {
            height = body.parentElement.clientHeight;
        } else if (body && body.clientHeight) {
            height = body.clientHeight;
        }
        console.log('height' + height);
        element.style.height = (((height - element.offsetTop) / 2) + "px");
        this.getMap(mapId).then(function (map) {
            map.invalidateSize();
        })
    }
    mapService.refresh = function (mapId) {
        this.getMap(mapId).then(function (map) {
            map.invalidateSize();
        })
    }
    mapService.decodePolyline = function (str, precision) {
        var index = 0,
            lat = 0,
            lng = 0,
            coordinates = [],
            shift = 0,
            result = 0,
            byte = null,
            latitude_change,
            longitude_change,
            factor = Math.pow(10, precision || 5);

        // Coordinates have variable length when encoded, so just keep
        // track of whether we've hit the end of the string. In each
        // loop iteration, a single coordinate is decoded.
        while (index < str.length) {

            // Reset shift, result, and byte
            byte = null;
            shift = 0;
            result = 0;

            do {
                byte = str.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);

            latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

            shift = result = 0;

            do {
                byte = str.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);

            longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

            lat += latitude_change;
            lng += longitude_change;

            coordinates.push([lat / factor, lng / factor]);
        }

        return coordinates;
    };

    mapService.encodePolyline = function (coordinates, precision) {
        if (!coordinates.length) return '';

        var factor = Math.pow(10, precision || 5),
            output = encode(coordinates[0][0], factor) + encode(coordinates[0][1], factor);

        for (var i = 1; i < coordinates.length; i++) {
            var a = coordinates[i],
                b = coordinates[i - 1];
            output += encode(a[0] - b[0], factor);
            output += encode(a[1] - b[1], factor);
        }

        return output;
    };

    return mapService;
})
