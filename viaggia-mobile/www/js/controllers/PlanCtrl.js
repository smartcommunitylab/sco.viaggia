angular.module('viaggia.controllers.plan', [])

.controller('PlanCtrl', function ($scope, Config, $q, $http, $ionicModal, $ionicLoading, $filter, $state, $window, leafletData, planService) {

    $scope.preferences = Config.getPlanPreferences();
    $scope.types = Config.getPlanTypes();
    $scope.datepickerObject = {};
    $scope.dateTimestamp = null;
    $scope.hourTimestamp = null;
    $scope.datepickerObject.inputDate = new Date();

    var initMapTypes = function (types) {
        var map = {};
        for (var i = 0; i < types.length; i++) {
            map[types[i]] = false;
        }
        return map;
    }

    $scope.timePickerObject24Hour = {
        inputEpochTime: ((new Date()).getHours() * 60 * 60 + (new Date()).getMinutes() * 60), //Optional
        step: 10, //Optional
        format: 24, //Optional
        titleLabel: '24-hour Format', //Optional
        closeLabel: 'Cancel', //Optional
        setLabel: 'Select', //Optional
        setButtonType: 'button-balanced', //Optional
        closeButtonType: 'button-positive', //Optional
        callback: function (val) { //Mandatory
            timePicker24Callback(val);
        }
    };

    function timePicker24Callback(val) {
        if (typeof (val) === 'undefined') {
            console.log('Time not selected');
        } else {
            $scope.timePickerObject24Hour.inputEpochTime = val;
            var selectedTime = new Date(val * 1000);
            $scope.hourTimestamp = $filter('date')(val * 1000, 'hh:mma');
            //            console.log('Selected epoch is : ', val, 'and the time is ', selectedTime.getUTCHours(), ':', selectedTime.getUTCMinutes(), 'in UTC');
            //            console.log($scope.hourTimestamp);
        }
    }

    var datePickerCallbackPopup = function (val) {
        if (typeof (val) === 'undefined') {
            console.log('No date selected');
        } else {
            $scope.datepickerObjectPopup.inputDate = val;
            //            console.log('Selected date is : ', val.getTime())
            $scope.dateTimestamp = $filter('date')(val.getTime(), 'MM/dd/yyyy');
        }
    };
    $scope.datepickerObjectPopup = {
        titleLabel: 'Ionic-Datepicker', //Optional
        todayLabel: 'Today', //Optional
        closeLabel: 'Close', //Optional
        setLabel: 'Set', //Optional
        errorMsgLabel: 'Please select time.', //Optional
        setButtonType: 'button-assertive', //Optional
        modalHeaderColor: 'bar-positive', //Optional
        modalFooterColor: 'bar-positive', //Optional
        templateType: 'popup', //Optional
        inputDate: $scope.datepickerObject.inputDate, //Optional
        mondayFirst: true, //Optional
        //        disabledDates: disabledDates, //Optional
        //        monthList: monthList, //Optional
        from: new Date(), //Optional
        to: new Date(2020, 12, 1), //Optional
        callback: function (val) { //Optional
            datePickerCallbackPopup(val);
        }
    };

    $scope.mapTypes = initMapTypes($scope.types);
    $scope.place = null;
    $scope.planParams = {
        //tmp, i need structure with lat-long
        from: {
            name: '',
            lat: '',
            long: ''
        },
        to: {
            name: '',
            lat: '',
            long: ''
        },
        routeType: '',
        transportTypes: [],
        departureTime: '',
        date: ''
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

    $scope.openMapPlan = function (place) {
        $scope.place = place;
        $scope.modalMap.show();
    }

    $scope.closeMap = function () {
        $scope.modalMap.hide();
    }

    $scope.isSwitched = function (type) {
        return $scope.mapTypes[type];
    }
    $scope.switch = function (type) {
        $scope.mapTypes[type] = !$scope.mapTypes[type];
    }

    var setPlanParams = function () {
        //routeType
        //transportTypes
        for (var i = 0; i < $scope.types.length; i++) {
            if ($scope.mapTypes[$scope.types[i]]) {
                $scope.planParams.transportTypes.push($scope.types[i]);
            }
        }
        //departureTime
        $scope.planParams.departureTime = $scope.hourTimestamp;
        //date
        $scope.planParams.date = $scope.dateTimestamp;

    }
    $scope.plan = function () {
        //prepare plansParams
        //time test
        setPlanParams();
        //check params into setPlanParams
        /*call plan*/

        planService.planJourney($scope.planParams).then(function (value) {
            //if ok let's go to visualization
            $state.go('app.planlist')
        }, function (error) {
            //error then pop up some problem
            $scope.showErrorServer()
        });
    }

    /*part for the map*/
    var selectPlace = function (placeSelected) {
        if ($scope.place == 'from') {
            //tmp
            $scope.planParams.from.name = placeSelected;
            $scope.planParams.from.lat = planService.getPosition($scope.place).latitude;
            $scope.planParams.from.long = planService.getPosition($scope.place).longitude;
        } else if ($scope.place == 'to') {
            //tmp
            $scope.planParams.to.name = placeSelected;
            $scope.planParams.to.lat = planService.getPosition($scope.place).latitude;
            $scope.planParams.to.long = planService.getPosition($scope.place).longitude;
        }
        console.log(placeSelected);
        /*close map*/
        $scope.closeMap();
    }



    $scope.locateMe = function () {
        $ionicLoading.show();
        $window.navigator.geolocation.getCurrentPosition(function (position) {
                $scope.$apply(function () {
                    $scope.position = position;
                    //                        alert(position.coords.latitude + ' ' + position.coords.longitude);
                    var placedata = $q.defer();
                    var places = {};
                    var url = Config.getGeocoderURL() + '/location?latlng=' + position.coords.latitude + ',' + position.coords.longitude;
                    //                    var url = "https: //os.smartcommunitylab.it/core.geocoder/spring/location?latlng=" + position.coords.latitude + ',' + position.coords.longitude;
                    //add timeout
                    $http.get(encodeURI(url), {
                        timeout: 5000
                    }).
                    success(function (data, status, headers, config) {
                        //                         planService.setName($scope.place, data.response.docs[0]);

                        places = data.response.docs;
                        //show a pop up where u can choose if address is correct and set up in the bar
                        // A confirm dialog
                        name = '';
                        if (data.response.docs[0]) {
                            planService.setName('from', data.response.docs[0]);
                            //                            if (data.response.docs[0].street)
                            //                                name = name + data.response.docs[0].street;
                            //                            if (data.response.docs[0].housenumber) {
                            //                                if (name)
                            //                                    name = name + ', ';
                            //                                name = name + data.response.docs[0].housenumber;
                            //                            }
                            //                            if (data.response.docs[0].city) {
                            //                                if (name)
                            //                                    name = name + ', ';
                            //                                name = name + data.response.docs[0].city;
                            //                            }

                            $ionicLoading.hide();
                            //set my position
                        } else {
                            $ionicLoading.hide();
                            //set my position

                        }
                    }).
                    error(function (data, status, headers, config) {
                        //temporary
                        $ionicLoading.hide();
                        $scope.showNoConnection();
                    });


                });
            },
            function (error) {
                $ionicLoading.hide();
                //showNoPlaceFound();
            }, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            });
    };
    $scope.locateMe();

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
            planService.setPosition($scope.place, args.leafletEvent.latlng.lat, args.leafletEvent.latlng.lng);
            var placedata = $q.defer();
            //var places = {};
            var url = Config.getGeocoderURL() + '/location?latlng=' + args.leafletEvent.latlng.lat + ',' + args.leafletEvent.latlng.lng;

            $http.get(encodeURI(url), {
                timeout: 5000
            }).
            success(function (data, status, headers, config) {
                $ionicLoading.hide();
                //places = data.response.docs;
                name = '';
                if (data.response.docs[0]) {
                    planService.setName($scope.place, data.response.docs[0]);
                    $scope.showConfirm(name, $filter('translate')("popup_address"), function () {
                        return selectPlace(name)
                    });
                } else {
                    $scope.showConfirm($filter('translate')("popup_lat") + args.leafletEvent.latlng.lat.toString().substring(0, 7) + " " + $filter('translate')("popup_long") + args.leafletEvent.latlng.lng.toString().substring(0, 7), $filter('translate')("popup_no_address"), function () {
                        return selectPlace(args.leafletEvent.latlng)
                    });
                }
            }).error(function (data, status, headers, config) {
                $ionicLoading.hide();
                $scope.showNoConnection();

            });
        });



        $scope.detail = function (view) {
            window.location.assign(view);
        }

        $scope.closeWin = function () {
            leafletData.getMap().then(function (map) {
                map.closePopup();
            });
        }
    }
    angular.extend($scope, {
        center: {
            lat: Config.getMapPosition().lat,
            lng: Config.getMapPosition().long,
            zoom: Config.getMapPosition().zoom
        },
        events: {}
    });
    /*end of part for map*/

})
