angular.module('viaggia.controllers.plan', [])

.controller('PlanCtrl', function ($scope, Config, $q, $http, $ionicModal, $ionicLoading, $filter, $state, $window, leafletData, planService, mapService) {
    $scope.preferences = Config.getPlanPreferences();
    $scope.types = Config.getPlanTypes();
    $scope.datepickerObject = {};
    $scope.dateTimestamp = null;
    $scope.hourTimestamp = null;
    $scope.datepickerObject.inputDate = new Date();
    $scope.title = $filter('translate')('plan_map_title');
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
    var monthList = [
        $filter('translate')('popup_datepicker_jan'),
    $filter('translate')('popup_datepicker_jfeb'),
    $filter('translate')('popup_datepicker_mar'),
    $filter('translate')('popup_datepicker_apr'),
    $filter('translate')('popup_datepicker_may'),
    $filter('translate')('popup_datepicker_jun'),
    $filter('translate')('popup_datepicker_jul'),
    $filter('translate')('popup_datepicker_ago'),
    $filter('translate')('popup_datepicker_sep'),
    $filter('translate')('popup_datepicker_oct'),
    $filter('translate')('popup_datepicker_nov'),
    $filter('translate')('popup_datepicker_dic')];
    var weekDaysList = [
     $filter('translate')('popup_datepicker_sun'),
    $filter('translate')('popup_datepicker_mon'),
    $filter('translate')('popup_datepicker_tue'),
    $filter('translate')('popup_datepicker_wed'),
    $filter('translate')('popup_datepicker_thu'),
    $filter('translate')('popup_datepicker_fri'),
    $filter('translate')('popup_datepicker_sat')
    ];

    var initMapTypes = function (types) {
        var map = {};
        for (var i = 0; i < types.length; i++) {
            map[types[i]] = false;
        }
        return map;
    }
    var setDefaultOptions = function () {
        var planOptionConfig = Config.getPlanDefaultOptions();
        $scope.planParams.departureTime = $filter('date')(new Date().getTime(), 'hh:mma');
        $scope.planParams.date = $filter('date')(new Date().getTime(), 'MM/dd/yyyy');
        $scope.planParams.routeType = planOptionConfig.routeType;
        $scope.planParams.transportTypes = planOptionConfig.transportTypes;
        for (var i = 0; i < $scope.types.length; i++) {
            $scope.mapTypes[$scope.planParams.transportTypes[i]] = true;
        }
    }
    $scope.timePickerObject24Hour = {
        inputEpochTime: ((new Date()).getHours() * 60 * 60 + (new Date()).getMinutes() * 60), //Optional
        step: 1, //Optional
        format: 24, //Optional
        titleLabel: $filter('translate')('popup_timepicker_title'), //Optional
        closeLabel: $filter('translate')('popup_timepicker_cancel'), //Optional
        setLabel: $filter('translate')('popup_timepicker_select'), //Optional
        setButtonType: 'button-popup', //Optional
        closeButtonType: 'button-popup', //Optional
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
        titleLabel: $filter('translate')('popup_datepicker_title'), //Optional
        todayLabel: $filter('translate')('popup_datepicker_today'), //Optional
        closeLabel: $filter('translate')('popup_datepicker_close'), //Optional
        setLabel: $filter('translate')('popup_datepicker_set'), //Optional
        errorMsgLabel: $filter('translate')('popup_datepicker_error_label'), //Optional
        setButtonType: 'button-popup', //Optional
        todayButtonType: 'button-popup', //Optional
        closeButtonType: 'button-popup', //Optional
        modalHeaderColor: 'bar-positive', //Optional
        modalFooterColor: 'bar-positive', //Optional
        templateType: 'popup', //Optional
        showTodayButton: 'true',
        inputDate: $scope.datepickerObject.inputDate, //Optional
        mondayFirst: true, //Optional
        monthList: monthList, //Optional
        weekDaysList: weekDaysList,
        from: new Date(), //Optional
        to: new Date(2020, 12, 1), //Optional
        callback: function (val) { //Optional
            datePickerCallbackPopup(val);
        }
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

    $ionicModal.fromTemplateUrl('templates/mapModal.html', {
        id: '1',
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modalMap = modal;
    });

    $scope.openMapPlan = function (place) {
        $scope.place = place;
        $scope.modalMap.show();
        //        $scope.modalMap.show().then(function () {
        //            var modalMap = document.getElementById('modal-map-container');
        //            if (modalMap != null) {
        //                mapService.resizeElementHeight(modalMap);
        //                mapService.refresh();
        //            }
        //        });
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
        if ($scope.hourTimestamp) {
            //departureTime
            $scope.planParams.departureTime = $scope.hourTimestamp;
        }
        if ($scope.dateTimestamp) {
            //date
            $scope.planParams.date = $scope.dateTimestamp;
        }

    }
    $scope.plan = function () {

        setPlanParams();
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
            $scope.fromName = name;
            $scope.planParams.from.name = placeSelected;
            $scope.planParams.from.lat = planService.getPosition($scope.place).latitude;
            $scope.planParams.from.long = planService.getPosition($scope.place).longitude;
        } else if ($scope.place == 'to') {
            $scope.toName = name;
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
                //                $scope.$apply(function () {
                $scope.position = position;
                var placedata = $q.defer();
                var places = {};
                var url = Config.getGeocoderURL() + '/location?latlng=' + position.coords.latitude + ',' + position.coords.longitude;

                //add timeout
                $http.get(encodeURI(url), {
                    timeout: 5000
                }).
                success(function (data, status, headers, config) {
                    //                         planService.setName($scope.place, data.response.docs[0]);

                    places = data.response.docs;
                    name = '';
                    if (data.response.docs[0]) {
                        $scope.place = 'from';
                        planService.setPosition($scope.place, position.coords.latitude, position.coords.longitude);
                        planService.setName($scope.place, data.response.docs[0]);
                        selectPlace(name);
                    }
                    $ionicLoading.hide();
                }).
                error(function (data, status, headers, config) {
                    //temporary
                    $ionicLoading.hide();
                    $scope.showNoConnection();
                });


                //                });
            },
            function (error) {
                $ionicLoading.hide();
            }, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            });
    };



    $scope.initMap = function () {
        mapService.initMap().then(function () {

            $scope.$on("leafletDirectiveMap.click", function (event, args) {
                $ionicLoading.show();
                planService.setPosition($scope.place, args.leafletEvent.latlng.lat, args.leafletEvent.latlng.lng);
                var placedata = $q.defer();
                var url = Config.getGeocoderURL() + '/location?latlng=' + args.leafletEvent.latlng.lat + ',' + args.leafletEvent.latlng.lng;

                $http.get(encodeURI(url), {
                    timeout: 5000
                }).
                success(function (data, status, headers, config) {
                    $ionicLoading.hide();
                    name = '';
                    if (data.response.docs[0]) {
                        planService.setName($scope.place, data.response.docs[0]);
                        $scope.showConfirm(name, $filter('translate')("popup_address"), function () {
                            //$scope.result = name;
                            return selectPlace(name)
                        });
                    } else {
                        $scope.showConfirm($filter('translate')("popup_lat") + args.leafletEvent.latlng.lat.toString().substring(0, 7) + " " + $filter('translate')("popup_long") + args.leafletEvent.latlng.lng.toString().substring(0, 7), $filter('translate')("popup_no_address"), function () {
                            //$scope.result = args.leafletEvent.latlng;
                            return selectPlace(args.leafletEvent.latlng)
                        });
                    }
                }).error(function (data, status, headers, config) {
                    $ionicLoading.hide();
                    $scope.showNoConnection();
                });
            });

        });
    }
    $scope.detail = function (view) {
        window.location.assign(view);
    }

    $scope.closeWin = function () {
        leafletData.getMap().then(function (map) {
            map.closePopup();
        });
    }

    $scope.typePlace = function (typedthings) {
        $scope.result = typedthings;
        $scope.newplaces = planService.getTypedPlaces(typedthings);
        $scope.newplaces.then(function (data) {
            $scope.places = data;
            $scope.placesandcoordinates = planService.getnames();
        });
    }
    $scope.select = function (suggestion) {
        //            if changed set position, name and address
        //            segnalaService.setPosition($scope.placesandcoordinates[suggestion].latlong.split(',')[0], $scope.placesandcoordinates[suggestion].latlong.split(',')[1]);
        //            segnalaService.setName(suggestion);
        //            $scope.signal.location.address = suggestion;
        console.log("select");
    }
    $scope.changeString = function (suggestion) {
            //            if changed set position, name and address
            //            segnalaService.setPosition($scope.placesandcoordinates[suggestion].latlong.split(',')[0], $scope.placesandcoordinates[suggestion].latlong.split(',')[1]);
            //            segnalaService.setName(suggestion);
            //            $scope.signal.location.address = suggestion;
            console.log("changestring");
        }
        //    execution
    angular.extend($scope, {
        center: {
            lat: Config.getMapPosition().lat,
            lng: Config.getMapPosition().long,
            zoom: Config.getMapPosition().zoom
        },
        events: {}
    });

    $scope.mapTypes = initMapTypes($scope.types);
    $scope.locateMe();
    setDefaultOptions();
})
