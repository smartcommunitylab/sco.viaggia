angular.module('viaggia.services.geo', [])

    .factory('GeoLocate', function ($q, $rootScope, $cordovaDeviceOrientation) {
        var localization = undefined;
        var positionError = null;
        if (typeof (Number.prototype.toRad) === "undefined") {
            Number.prototype.toRad = function () {
                return this * Math.PI / 180;
            }
        }

        function compute(v1, a1, v2, a2, d) {
            if ((a1 + a2) / 1000 > d) {
                var v = a1 > a2 ? (v2 - (v2 - v1) * a2 / a1) : (v1 + (v2 - v1) * a1 / a2);
                return [v, v];
            }
            return [v1 + (v2 - v1) * a1 / d / 1000, v2 - (v2 - v1) * a2 / d / 1000];
        }

        function computeLats(p1, p2, d) {
            if (p1.coords.latitude > p2.coords.latitude) {
                var res = computeLats(p2, p1, d);
                return [res[1], res[0]];
            }
            return compute(p1.coords.latitude, p1.coords.accuracy, p2.coords.latitude, p2.coords.accuracy, d);
        }

        function computeLngs(p1, p2, d) {
            if (p1.coords.longitude > p2.coords.longitude) {
                var res = computeLngs(p2, p1, d);
                return [res[1], res[0]];
            }
            return compute(p1.coords.longitude, p1.coords.accuracy, p2.coords.longitude, p2.coords.accuracy, d);
        }

        function transformPair(p1, p2, res, distFunc) {
            var d = distFunc(p1, p2);
            if (d == 0) return;

            var lats = computeLats(p1, p2, d);
            var lngs = computeLngs(p1, p2, d);
            res.push({
                lat: lats[0],
                lng: lngs[0],
                timestamp: p1.timestamp
            });
            res.push({
                lat: lats[1],
                lng: lngs[1],
                timestamp: p2.timestamp
            });
        }

        var myPosition = null;


        var startLocalization = function () {
            if (typeof localization == 'undefined') {
                localization = $q.defer();
                if (ionic.Platform.isWebView()) {
                    //console.log('geolocalization initing (cordova)...');
                    document.addEventListener('deviceready', function () {
                        //console.log('geolocalization inited (cordova)');
                        if (!positionError || (!!positionError && positionError.code != 1)) {
                            $rootScope.locationWatchID = navigator.geolocation.watchPosition(function (position) {
                                r = [position.coords.latitude, position.coords.longitude];
                                $rootScope.myPosition = r;
                                $rootScope.myPositionAccuracy = position.coords.accuracy;
                                localization.resolve(r);
                            }, function (error) {
                                positionError = error;
                                console.log('Cannot geolocate (cordova)');
                                localization.reject('Cannot geolocate (cordova), error.code: ' + error.code);
                            }, {
                                    //frequency: (20 * 60 * 1000), //20 mins
                                    maximumAge: (10 * 6 * 1000), //10 mins
                                    timeout: 6 * 1000, //1 minute
                                    enableHighAccuracy: (device.version.indexOf('2.') == 0) // true for Android 2.x
                                });
                        } else {
                            localization.reject('Cannot geolocate (permission denied)');
                        }
                    }, false);
                } else {
                    //console.log('geolocalization inited (web)');
                    $rootScope.locationWatchID = navigator.geolocation.watchPosition(function (position) {
                        r = [position.coords.latitude, position.coords.longitude];
                        $rootScope.myPosition = r;
                        $rootScope.myPositionAccuracy = position.coords.accuracy;
                        //console.log('geolocated (web)');
                        localization.resolve(r);
                    }, function (error) {
                        positionError = error;
                        console.log('cannot geolocate (web)');
                        localization.reject('cannot geolocate (web)');
                    }, {
                            maximumAge: (10 * 60 * 1000), // 10 minutes
                            timeout: 10 * 1000, // 10 seconds
                            enableHighAccuracy: false
                        });
                }
            }

            return localization.promise;
        };
        var geo = {
            reset: function () {
                localization = undefined;
            },
            initLocalization: function () {
                var defer = $q.defer();
                var tempe = new Date().getTime();
                document.addEventListener('deviceready', function () {
                    console.log('Check geolocation permissions');
                    navigator.geolocation.getCurrentPosition(
                        function (position) {
                            console.log('Gelocation permitted and active');
                            startLocalization()
                            return defer.resolve();
                        },
                        function (error) {

                            positionError = error;
                            if (error.code != 1) {
                                startLocalization();
                                return defer.resolve();
                            } else {
                                console.log('Geolocation permission denied!');
                                return defer.reject();
                            }
                        }, {
                            timeout: 10 * 1000
                        });
                }, false);
                return defer.promise;
            },
            clearWatch: function () {
                navigator.geolocation.clearWatch($rootScope.locationWatchID);
                $rootScope.locationWatchID = undefined;
            },
            reset: function () {
                localization = undefined;
            },
            locate: function () {
                //console.log('geolocalizing...');
                //            return initLocalization(localization).then(function (firstGeoLocation) {
                //                return $rootScope.myPosition;
                //            });
                return startLocalization().then(function (latlng) {
                    return $rootScope.myPosition;
                });
            },
            getAccuracy: function () {
                return $rootScope.myPositionAccuracy;
            },
            //      calculate bearing between two points
            bearing: function (pt1, pt2) {
                var d = false;
                if (pt1 && pt1[0] && pt1[1] && pt2 && pt2[0] && pt2[1]) {
                    var lat1 = Number(pt1[0]);
                    var lon1 = Number(pt1[1]);
                    var lat2 = Number(pt2[0]);
                    var lon2 = Number(pt2[1]);

                    var R = 6371; // km
                    //var R = 3958.76; // miles
                    var dLat = (lat2 - lat1).toRad();
                    var dLon = (lon2 - lon1).toRad();
                    var lat1 = lat1.toRad();
                    var lat2 = lat2.toRad();
                    //          var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    //            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
                    //          var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    //          d = R * c;
                    var y = Math.sin(dLon) * Math.cos(lat2);
                    var x = Math.cos(lat1) * Math.sin(lat2) -
                        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
                    var brng = Math.atan2(y, x) * (180 / Math.PI)
                } else {
                    console.log('cannot calculate distance!');
                }
                return brng;
            },
            distance: function (pt1, pt2) {
                var d = false;
                if (pt1 && pt1[0] && pt1[1] && pt2 && pt2[0] && pt2[1]) {
                    var lat1 = Number(pt1[0]).toRad();
                    var lon1 = Number(pt1[1]).toRad();
                    var lat2 = Number(pt2[0]).toRad();
                    var lon2 = Number(pt2[1]).toRad();

                    var R = 6371; // km
                    //var R = 3958.76; // miles
                    var dLat = (lat2 - lat1);
                    var dLon = (lon2 - lon1);
                    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
                    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    d = R * c;
                } else {
                    console.log('cannot calculate distance!');
                }
                return d;
            },
            distanceTo: function (gotoPosition) {
                var GL = this;
                return localization.promise.then(function (myPosition) {
                    //console.log('myPosition: ' + JSON.stringify(myPosition));
                    //console.log('gotoPosition: ' + JSON.stringify(gotoPosition));
                    return GL.distance(myPosition, gotoPosition);
                });
            },
            /**
             * Input: array of objects of type {coords:{latitude:..., longitude:..., accuracy:...}}
             * Output: array of object of type {lat:..., lng:...}
             */
            transform: function (array) {
                var res = [];

                var distFunc = function (p1, p2) {
                    return geo.distance([p1.coords.latitude, p1.coords.longitude], [p2.coords.latitude, p2.coords.longitude]);
                }

                for (var i = 1; i < array.length; i++) {
                    transformPair(array[i - 1], array[i], res, distFunc);
                }
                return res;
            },
            initCompassMonitor: function (onSuccess, onError, options) {


                if (window.navigator && navigator.compass)
                    compassWatch = navigator.compass.watchHeading(onSuccess, onError, options);

            },
            closeCompassMonitor: function () {
                if (!window.$cordovaDeviceOrientation) return;
                $cordovaDeviceOrientation.clearWatch(compassWatch);
            }
        };

        return geo;
    })
