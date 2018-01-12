angular.module('viaggia.controllers.info', [])

    .controller('InfoCtrl', function ($scope) { })

    .controller('ParkingCtrl', function ($scope, $state, $stateParams, $timeout, $filter, $ionicModal, $ionicPopup, $location, ionicMaterialMotion, ionicMaterialInk, leafletData, mapService, parkingService, Config, planService, bookmarkService) {
        $scope.agencyId = $stateParams.agencyId;
        $scope.parkings = null;
        $scope.loading = true;
        $scope.markers = [];

        $scope.title = $filter('translate')('menu_real_time_park');

        $scope.$on('ngLastRepeat.parkings', function (e) {
            $timeout(function () {
                ionicMaterialMotion.ripple();
                ionicMaterialInk.displayEffect()
            }); // No timeout delay necessary.
        });

        $scope.load = function (selectedId) {
            var parkids = Config.getParkingAgencyIds();
            parkingService.getParkings(parkids).then(function (data) {
                $scope.parkings = data;
                $scope.parkings.forEach(function (e) {
                    if (e.monitored && e.slotsAvailable > -2) {
                        e.availLevel = e.slotsAvailable <= 5 ? 'avail-red' : e.slotsAvailable > 20 ? 'avail-green' : 'avail-yellow';
                    }
                    if (decodeURI(selectedId) == e.id) {
                        $scope.select(e);
                    }

                });
                $scope.loading = false;
                Config.loaded();
                $scope.$broadcast('scroll.refreshComplete');
                //            if ($scope.selected) {
                //                $scope.showMap(true);
                //            }
            }, function (err) {
                $scope.parkings = null;
                $scope.showNoConnection();
                $scope.loading = true;
                $scope.$broadcast('scroll.refreshComplete');
                Config.loaded();
            });
        }

        var init = function () {
            $scope.loading = true;
            Config.loading();
            $scope.load($stateParams.id);
        };

        $scope.selected = null;
        $scope.select = function (p) {
            //        if ($scope.selected == p) {
            //            $scope.selected = null;
            //        } else {
            $scope.selected = p;
            var path = $location.path();
            if ($state.current.name == 'app.parkingstation') {
                path = path.substr(0, path.lastIndexOf('/'));
            }
            path += '/' + p.id;
            $scope.bookmarkStyle = bookmarkService.getBookmarkStyle(path);
            //        }
            $scope.showMap(true);
        };

        $scope.showMap = function (withPopup) {
            $scope.modalMap.show().then(function () {
                var markers = [];
                var list = ($scope.selected != null && withPopup) ? [$scope.selected] : $scope.parkings;
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
                    mapService.getMap('modalMapParking').then(function (map) {
                        map.fitBounds(bounds);
                    });
                }
                $scope.markers = markers;
                if (withPopup) {
                    showPopup(list[0]);
                }
            });
        };

        $scope.$on('$ionicView.beforeEnter', function () {
            mapService.refresh('modalMapParking');
        });

        $ionicModal.fromTemplateUrl('templates/mapModalParking.html', {
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
            mapService.initMap('modalMapParking', true).then(function () {
                console.log('map initialized');
            });
        };

        var showPopup = function (p) {
            $scope.popupParking = p;
            $scope.selected = p;

            $ionicPopup.show({
                templateUrl: 'templates/parkingPopup.html',
                title: $filter('translate')('lbl_parking'),
                cssClass: 'parking-popup',
                scope: $scope,
                buttons: [{
                    text: $filter('translate')('btn_close'),
                    type: 'button-close'
                },
                {
                    text: $filter('translate')('btn_nav_to'),
                    onTap: function (e) {
                        planService.setPlanConfigure({
                            to: {
                                name: $scope.popupParking.description,
                                lat: $scope.popupParking.position[0],
                                long: $scope.popupParking.position[1]
                            },
                        });
                        planService.setName('to', $scope.popupParking.description);
                        $scope.closeMap();
                        $state.go('app.plan');
                    }
                }
                ]
            });

        }

        $scope.$on('leafletDirectiveMarker.modalMapParking.click', function (e, args) {
            var p = $scope.markers[args.modelName].parking;
            showPopup(p);
        });

        $scope.navigate = function () {
            planService.setPlanConfigure({
                to: {
                    name: $scope.selected.description,
                    lat: $scope.selected.position[0],
                    long: $scope.selected.position[1]
                },
            });
            planService.setName('to', $scope.selected.description);
            $scope.closeMap();
            $state.go('app.plan');
        };

        init();

        $scope.bookmark = function () {
            var ref = Config.getTTData($stateParams.ref);
            var path = $stateParams.id ? $location.path() : ($location.path() + '/' + $scope.selected.agencyId + '/' + $scope.selected.id);
            bookmarkService.toggleBookmark(path, $scope.selected.name, 'PARKING', {
                agencyId: $scope.selected.agencyId,
                parkingId: $scope.selected.id
            }).then(function (style) {
                $scope.bookmarkStyle = style;
            });
        };

    })


    /*
     Controller that manages the parking meters: compass, visualization on map
     */

    .controller('ParkingMetersCtrl', function ($scope, $rootScope, $timeout, $state, $ionicHistory, $q, Config, $ionicModal, $ionicPopup, $filter, $cordovaDeviceOrientation, mapService, parkingService, GeoLocate, Toast) {
        var firstTimeModal = null;
        $scope.compassPresent = false;
        $scope.isAndroid = ionic.Platform.isAndroid();
        if (!firstTimeParkingMeterView()) {
            firstTimeModal = $ionicPopup.show({
                templateUrl: 'templates/firstTimeParkingMeterPopup.html',
                title: $filter('translate')('lbl_parking'),
                cssClass: 'first-time-parking-meters-popup',
                scope: $scope,
                buttons: [{
                    text: $filter('translate')('btn_close'),
                    type: 'button-close',
                    onTap: function (e) {
                        $ionicHistory.goBack();
                    }
                }, {
                    text: $filter('translate')('btn_undertood'),
                    type: 'button-close',
                    onTap: function (e) {
                        setFirstTimeParkingMeterView();
                        if (ionic.Platform.isWebView()) {
                            cordova.plugins.locationAccuracy.canRequest(function (canRequest) {
                                if (canRequest) {
                                    cordova.plugins.locationAccuracy.request(onRequestSuccess, onRequestFailure, cordova.plugins.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY); // iOS will ignore this
                                }
                            });

                        }
                    }
                }]
            });
        } else {
            geolocate().then(function () {
                //gps allowed and go on
                console.log('gps allowed');

            }, function () {
                //gps not allowed, then pop up, let it do it or come back
                console.log('gps not allowed');
                $ionicPopup.show({
                    templateUrl: 'templates/noGpsPopup.html',
                    title: $filter('translate')('lbl_parking'),
                    cssClass: 'first-time-parking-meters-popup',
                    scope: $scope,
                    buttons: [{
                        text: $filter('translate')('btn_close'),
                        type: 'button-close',
                        onTap: function (e) {
                            $ionicHistory.goBack();
                        }
                    },
                    {
                        text: $filter('translate')('btn_undertood'),
                        type: 'button-close',
                        onTap: function (e) {
                            if (ionic.Platform.isWebView()) {
                                cordova.plugins.locationAccuracy.canRequest(function (canRequest) {
                                    if (canRequest) {
                                        cordova.plugins.locationAccuracy.request(onRequestSuccess, onRequestFailure, cordova.plugins.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY); // iOS will ignore this
                                    }
                                });
                            }
                        }
                    }

                    ]
                });
            })
        }
        $scope.initMapParkingMeter = function () {
            mapService.initMap('modalMapParkingMeters').then(function () {
                console.log('map initialized');
            });
        }
        angular.extend($scope, {
            center: {
                lat: Config.getMapPosition().lat,
                lng: Config.getMapPosition().long,
                zoom: Config.getZoomParkingMeter()
            },
            markers: [],
            events: {}
        });
        $scope.openCalibrationPopup = function () {
            $ionicPopup.show({
                templateUrl: 'templates/calibrationPopup.html',
                title: $filter('translate')('lbl_calibration'),
                cssClass: 'first-time-parking-meters-popup',
                scope: $scope,
                buttons: [{
                    text: $filter('translate')('btn_undertood'),
                    type: 'button-close'
                }

                ]
            });
        }

        function onRequestSuccess(success) {
            console.log("Successfully requested accuracy: " + success.message);
            if (success.code == cordova.plugins.locationAccuracy.SUCCESS_USER_AGREED) {


            } else {
                //se gia l'app geolocalizza probabilmente ho  problemi di geolocalizzazione
            }
            $scope.initParkingMeters();
        }

        function onRequestFailure(error) {
            console.error("Accuracy request failed: error code=" + error.code + "; error message=" + error.message);
            if (error.code !== cordova.plugins.locationAccuracy.ERROR_USER_DISAGREED) {
                //manage error with popup
                $ionicPopup.show({
                    templateUrl: 'templates/calibrationPopup.html',
                    title: $filter('translate')('lbl_calibration'),
                    cssClass: 'first-time-parking-meters-popup',
                    scope: $scope,
                    buttons: [{
                        text: $filter('translate')('btn_close'),
                        type: 'button-close',
                        onTap: function (e) {
                            $ionicHistory.goBack();
                        }
                    },
                    {
                        text: $filter('translate')('btn_yes'),
                        type: 'button-close',
                        onTap: function (e) {
                            if (device.platform=="iOS"){
                                cordova.plugins.diagnostic.switchToSettings();
                            }
                            else {
                                if (device.platform=="iOS"){
                                    cordova.plugins.diagnostic.switchToSettings();
                                }
                                else {
                                cordova.plugins.diagnostic.switchToLocationSettings();
                                }                            }
                        }
                    }

                    ]
                });

            } else {
                //user disagreed so go back
                $ionicHistory.goBack();
            }

        }


        function geolocate() {
            var defer = $q.defer();
            GeoLocate.locate().then(
                function (position) {
                    $rootScope.myPosition = position;
                    $rootScope.GPSAllow = true;
                    defer.resolve();
                },
                function () {
                    console.log('Geolocation not possible');
                    $rootScope.GPSAllow = false;
                    defer.reject();
                }
            );
            return defer.promise;
        };

        function firstTimeParkingMeterView() {
            return localStorage.getItem(Config.getAppId() + "_firstTimeParkingMeterView");
        }

        function setFirstTimeParkingMeterView() {
            localStorage.setItem(Config.getAppId() + "_firstTimeParkingMeterView", true);
        }

        function onSuccess(heading) {
            $scope.compassPresent = true;
            $scope.$apply();
            drawArrow(getDirection(heading.magneticHeading));
            drawDistance(GeoLocate.distance($rootScope.myPosition, [$scope.selectedParkingMeters.lat, $scope.selectedParkingMeters.lng]));
        };

        function onError(compassError) {
            console.log('Compass error: ' + compassError.code);

            $scope.compassPresent = false;
        };

        var options = {
            frequency: 200
        }; // Update every 0.5 seconds


        function addMarkersToMap(parkingMetersZones) {
            var parkingIndex = 0;
            var boundsArray = [];
            var markers = [];
            for (var i = 0; i < parkingMetersZones.length; i++) {
                if (parkingMetersZones[i].parkingMeters) {
                    for (var k = 0; k < parkingMetersZones[i].parkingMeters.length; k++) {
                        parkingIndex++;
                        var previous = false;
                        if (typeof $scope.selectedParkingMetersIndex !== 'undefined' && $scope.selectedParkingMeters.lat == parkingMetersZones[i].parkingMeters[k].lat && $scope.selectedParkingMeters.lng == parkingMetersZones[i].parkingMeters[k].lng) {
                            previous = true;
                        }
                        var parkingMeter = parkingMetersZones[i].parkingMeters[k];
                        parkingMeter.validityPeriod = parkingMetersZones[i].validityPeriod;
                        var icon = 'img/ic_parcometro.png';
                        if (!previous) {
                            if (paymentByCard(parkingMeter)) {
                                icon = 'img/ic_parcometro_euro-card.png'
                            }
                        } else {
                            icon = 'img/ic_parcometro_selected.png';
                            if (paymentByCard($scope.selectedParkingMeters.parking)) {
                                icon = 'img/ic_parcometro_euro-card_selected.png'
                            }

                        }
                        markers.push({
                            parking: parkingMeter,
                            index: parkingIndex,
                            lat: parseFloat(parkingMetersZones[i].parkingMeters[k].lat),
                            lng: parseFloat(parkingMetersZones[i].parkingMeters[k].lng),
                            icon: {
                                iconUrl: icon,
                                iconSize: [36, 50],
                                iconAnchor: [18, 50],
                                popupAnchor: [-0, -50]
                            },
                        });
                        //selected previous
                        if (previous) {
                            $scope.selectedParkingMeters = markers[markers.length - 1];
                            $scope.selectedParkingMetersIndex = markers.length - 1;
                        }
                        boundsArray.push([parkingMetersZones[i].parkingMeters[k].lat, parkingMetersZones[i].parkingMeters[k].lng]);
                    }
                }
            }
            //if selected

            $scope.markers = markers;
            return [markers, boundsArray];
        }
        $scope.initParkingMeters = function () {
            $scope.windowOrientation = window.orientation;

            //locate user
            Config.loading();
            GeoLocate.locate().then(function (position) {
                //get parking meter list based on my position and other parameters in configuration service
                parkingService.getParkingMeters(position[0], position[1], 5).then(function (parkingMetersZones) {
                    //init the comapss service with callbacks
                    var markers = [];
                    var boundsArray = [];
                    if (parkingMetersZones instanceof Array) {
                        returned = addMarkersToMap(parkingMetersZones);
                        markers = returned[0];
                        boundsArray = returned[1];
                        selectNearest(markers);
                        if (ionic.Platform.isWebView()) {
                            GeoLocate.initCompassMonitor(onSuccess, onError, options);
                        }
                        //open Map with compass and driver user to nearest parking meter
                        //manage visualization
                        if (boundsArray.length > 0) {
                            boundsArray.push([$rootScope.myPosition[0], $rootScope.myPosition[1]]);
                            var bounds = L.latLngBounds(boundsArray);
                            mapService.getMap('modalMapParkingMeters').then(function (map) {
                                map.fitBounds(bounds, {
                                    padding: [50, 50]
                                });
                            });
                        }

                    }

                    $timeout(function a() {
                        $scope.$on('leafletDirectiveMap.modalMapParkingMeters.moveend', function (event) {
                            $scope.filterMarkers(Config.getParkingMetersMaxNumber());
                        })
                    }, 2000);
                    Config.loaded();
                }, function (err) {
                    if (!$scope.alertPopup) {
                        $scope.showNoConnection();
                    }
                    Config.loaded();
                })
            }, function (err) {
                Config.loaded();
            });

        }
        $scope.getPaymentMethod = function (parking) {
            if (paymentByCard(parking))
                return $filter('translate')('lbl_parking_meter_payment_card');
            return $filter('translate')('lbl_parking_meter_payment_cash');
        }
        $scope.getValidityPeriodDays = function (weekDays) {
            var returnString = "";
            //turn the string to internationalized string
            var days = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
            for (var k = 0; k < days.length; k++) {
                if (weekDays.indexOf(days[k]) > -1) {
                    returnString += $filter('translate')('weekdays_' + days[k] + '_period') + ', ';
                }
            }
            return returnString.slice(0, -2);;
        }
        //if no modal open
        if (!firstTimeModal) {
            $scope.initParkingMeters();
        }

        $scope.$on("$destroy", function (event) {
            mapService.stopPosTimer('modalMapParkingMeters');
            GeoLocate.closeCompassMonitor();
        });

        window.addEventListener("orientationchange", function () {
            console.log(screen.orientation);
            console.log(window.orientation);
            $scope.windowOrientation = window.orientation;
            //modify the rotation of the compass with screen.orientation
            $scope.initParkingMeters();
        });
        var showPopupParkingMeters = function (p, index) {
            $scope.popupParkingMeter = p;
            $scope.selected = p;

            $ionicPopup.show({
                templateUrl: 'templates/parkingMeterPopup.html',
                title: $filter('translate')('lbl_parking'),
                cssClass: 'parking-meter-popup',
                scope: $scope,
                buttons: [{
                    text: $filter('translate')('btn_close'),
                    type: 'button-close'
                },
                {
                    text: $filter('translate')('btn_drive_me'),
                    onTap: function (e) {
                        driveMeParcometer(p, index);
                    }
                }
                ]

            });
        }

        //open popup with the detail if one of the marker is clicked
        $scope.$on('leafletDirectiveMarker.modalMapParkingMeters.click', function (e, args) {
            var p = $scope.markers[args.modelName].parking;
            var index = $scope.markers[args.modelName].index;
            showPopupParkingMeters(p, index);
        });

        function selectNearest(arrayOfPoints) {
            var minDistance = 9999999;
            for (var i = 0; i < arrayOfPoints.length; i++) {
                var distance = GeoLocate.distance($rootScope.myPosition, [arrayOfPoints[i].lat, arrayOfPoints[i].lng]);
                if (distance < minDistance) {
                    minDistance = distance;
                    $scope.selectedParkingMeters = arrayOfPoints[i];
                    $scope.selectedParkingMetersIndex = i;

                }

            }
            var icon = 'img/ic_parcometro_selected.png';
            if (paymentByCard($scope.selectedParkingMeters.parking)) {
                icon = 'img/ic_parcometro_euro-card_selected.png'
            }
            $scope.markers[$scope.selectedParkingMetersIndex].icon = {
                iconUrl: icon,
                iconSize: [36, 50],
                iconAnchor: [18, 50],
                popupAnchor: [-0, -50]
            }
        }




        function driveMeParcometer(p, index) {
            //reset the old selected if it exist
            var icon = 'img/ic_parcometro.png';
            if ($scope.selectedParkingMeters) {
                if (paymentByCard($scope.selectedParkingMeters.parking)) {
                    icon = 'img/ic_parcometro_euro-card.png'
                }
                if ($scope.allMarkers[$scope.selectedParkingMetersIndex]) {
                    $scope.allMarkers[$scope.selectedParkingMetersIndex].icon = {
                        iconUrl: icon,
                        iconSize: [36, 50],
                        iconAnchor: [18, 50],
                        popupAnchor: [-0, -50]
                    }
                }
            }
            //and select the new one
            for (var i = 0; i < $scope.allMarkers.length; i++) {
                if (index == $scope.allMarkers[i].index) {
                    $scope.selectedParkingMetersIndex = i;
                    $scope.selectedParkingMeters = $scope.allMarkers[i];
                    break;
                }
            }

            //update icon for that
            var icon = 'img/ic_parcometro_selected.png';
            if (paymentByCard($scope.selectedParkingMeters.parking)) {
                icon = 'img/ic_parcometro_euro-card_selected.png'
            }
            $scope.allMarkers[$scope.selectedParkingMetersIndex].icon = {
                iconUrl: icon,
                iconSize: [36, 50],
                iconAnchor: [18, 50],
                popupAnchor: [-0, -50]
            }
            //}
            // marker.target.setIcon(new myIconReplc);
        }

        function getDirection(magneticHeading) {

            //calculate direction between my position and the selected point
            var bearing = GeoLocate.bearing($rootScope.myPosition, [$scope.selectedParkingMeters.lat, $scope.selectedParkingMeters.lng]);
            //rotate it of magnetic heading
            //var rotated_bearing = (bearing > 0 ? bearing : (2 * Math.PI + bearing)) * 360 / (2 * Math.PI);
            var rotated_bearing = (bearing + 360) % 360;
            return (rotated_bearing - magneticHeading) % 360;
            // return rotated_bearing;
        };

        function paymentByCard(parkometer) {
            if (parkometer.paymentMethods) {
                for (var i = 0; i < parkometer.paymentMethods.length; i++) {
                    if (parkometer.paymentMethods[i] == "Cash_And_CreditCard")
                        return true
                }
            }
            return false
        }

        function drawArrow(r) {
            var div = document.getElementById('arrow');
            if (div) {
                div.style.webkitTransform = 'rotate(' + (r - $scope.windowOrientation) + 'deg)';
                div.style.mozTransform = 'rotate(' + (r - $scope.windowOrientation) + 'deg)';
                div.style.msTransform = 'rotate(' + (r - $scope.windowOrientation) + 'deg)';
                div.style.oTransform = 'rotate(' + (r - $scope.windowOrientation) + 'deg)';
                div.style.transform = 'rotate(' + (r - $scope.windowOrientation) + 'deg)';
            }
        }



        function degreesToRadians(degrees) {
            console.log(degrees * (Math.PI / 180));
            return degrees * (Math.PI / 180);
        }

        function radianToDegrees(radians) {
            console.log(radians * (Math.PI / 180));
            return radians * 180 / Math.PI;
        }

        function drawDistance(distance) {
            $scope.distanceFromParkingMeter = Math.round(distance * 1000) + ' m';
        }

        $scope.getPrice = function (price) {
            return (price / 100).toFixed(2) + " €/ora."
        }

        $scope.allMarkers = null;
        var MAX_MARKERS = 50;
        $scope.filterMarkers = function (number, max_number) {
            Config.loading();
            // GeoLocate.locate().then(function (position) {
            mapService.getMap('modalMapParkingMeters').then(function (map) {
                var currBounds = map.getBounds();
                parkingService.getParkingMeters(map.getCenter().lat, map.getCenter().lng, number).then(function (parkingMetersZones) {
                    //init the comapss service with callbacks
                    var markers = [];
                    var boundsArray = [];
                    //
                    if (parkingMetersZones instanceof Array) {
                        returned = addMarkersToMap(parkingMetersZones);
                        markers = returned[0];
                        boundsArray = returned[1];

                        $scope.allMarkers = markers;
                    }
                    var filteredMarkers = [];

                    if ($scope.allMarkers.length > MAX_MARKERS) {
                        $scope.allMarkers.forEach(function (m) {
                            if (currBounds.contains(L.latLng(m.lat, m.lng))) {
                                filteredMarkers.push(m);
                            }
                        });

                        Config.loaded();
                        if (filteredMarkers.length > MAX_MARKERS) {
                            console.log('too many markers');
                            if (!$scope.tooManyMarkers) {
                                Toast.show($filter('translate')('err_too_many_markers'), "short", "bottom");
                                $scope.tooManyMarkers = true;
                            }
                            return;
                        } else if (filteredMarkers.length < MAX_MARKERS) {
                            $scope.tooManyMarkers = false;
                        }
                    } else {
                        Config.loaded();
                        $scope.tooManyMarkers = false;
                    }
                    $scope.markers = filteredMarkers;
                })

                Config.loaded();

            })

        }


    })


    .controller('BikeSharingCtrl', function ($scope, $state, $stateParams, $timeout, $filter, $ionicModal, $ionicPopup, $location, ionicMaterialMotion, ionicMaterialInk, leafletData, mapService, bikeSharingService, Config, planService, bookmarkService) {
        $scope.agencyId = $stateParams.agencyId;
        $scope.parkings = null;

        $scope.markers = [];

        $scope.title = $filter('translate')('menu_real_time_bike');
        $scope.bookmarkStyle = bookmarkService.getBookmarkStyle($scope.selected);

        $scope.$on('ngLastRepeat.parkings', function (e) {
            $timeout(function () {
                ionicMaterialMotion.ripple();
                ionicMaterialInk.displayEffect()
            }); // No timeout delay necessary.
        });



        $scope.load = function (selectedId) {
            var bikeids = Config.getBikeSharingAgencyIds();
            bikeSharingService.getStations(bikeids).then(function (data) {
                $scope.parkings = data;
                $scope.parkings.forEach(function (e) {
                    if (decodeURI(selectedId) == e.id) {
                        $scope.select(e);
                    }

                });
                $scope.loading = false;
                Config.loaded();
                $scope.$broadcast('scroll.refreshComplete');
            }, function (err) {
                $scope.parkings = null;
                $scope.$broadcast('scroll.refreshComplete');
                $scope.showNoConnection();
                $scope.loading = true;
                Config.loaded();
            });
        }

        var init = function () {
            $scope.loading = true;
            Config.loading();
            $scope.load($stateParams.id);
        };

        $scope.selected = null;
        $scope.select = function (p, path) {

            $scope.selected = p;
            var path = $location.path();
            if ($state.current.name == 'app.bikestation') {
                path = path.substr(0, path.lastIndexOf('/'));
            }
            path += '/' + p.id;
            $scope.bookmarkStyle = bookmarkService.getBookmarkStyle(path);
            //        }
            $scope.showMap(true);
        };

        $scope.showMap = function (withPopup) {
            $scope.modalMap.show().then(function () {
                var markers = [];

                var list = ($scope.selected != null && withPopup) ? [$scope.selected] : $scope.parkings;
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

                    //         Config.loaded();
                    //       }
                    boundsArray.push(list[i].position);
                }
                if (boundsArray.length > 0) {
                    var bounds = L.latLngBounds(boundsArray);
                    mapService.getMap('modalMapBike').then(function (map) {
                        map.fitBounds(bounds);
                    });
                }
                $scope.markers = markers;
                if (withPopup) {
                    showPopup(list[0]);
                }
            });
        };

        $ionicModal.fromTemplateUrl('templates/mapModalBike.html', {
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
            mapService.initMap('modalMapBike', true).then(function () { });
        };

        var showPopup = function (p) {
            $scope.popupParking = p;
            $scope.selected = p;

            $ionicPopup.show({
                templateUrl: 'templates/bikesharingPopup.html',
                title: $filter('translate')('lbl_bike_station'),
                cssClass: 'parking-popup',
                scope: $scope,
                buttons: [{
                    text: $filter('translate')('btn_close'),
                    type: 'button-close'
                },
                {
                    text: $filter('translate')('btn_nav_to'),
                    onTap: function (e) {
                        planService.setPlanConfigure({
                            to: {
                                name: $scope.popupParking.address,
                                lat: $scope.popupParking.position[0],
                                long: $scope.popupParking.position[1]
                            },
                        });
                        planService.setName('to', $scope.popupParking.address);
                        $scope.closeMap();
                        $state.go('app.plan');
                    }
                }
                ]
            });

        }

        $scope.$on('leafletDirectiveMarker.modalMapBike.click', function (e, args) {
            var p = $scope.markers[args.modelName].parking;
            showPopup(p);
        });

        $scope.$on('$ionicView.beforeEnter', function () {
            mapService.refresh('modalMapBike');
        });

        $scope.navigate = function () {
            planService.setPlanConfigure({
                to: {
                    name: $scope.selected.address,
                    lat: $scope.selected.position[0],
                    long: $scope.selected.position[1]
                },
            });
            planService.setName('to', $scope.selected.address);
            $scope.closeMap();
            $state.go('app.plan');
        };

        $scope.bookmark = function () {
            var ref = Config.getTTData($stateParams.ref);
            var path = $stateParams.id ? $location.path() : ($location.path() + '/' + $scope.selected.agencyId + '/' + $scope.selected.id);
            bookmarkService.toggleBookmark(path, $scope.selected.name, 'BIKESHARING', {
                agencyId: $scope.selected.agencyId,
                parkingId: $scope.selected.id
            }).then(function (style) {
                $scope.bookmarkStyle = style;
            });
        };

        init();
    })