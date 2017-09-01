angular.module('viaggia.controllers.plan', [])

.controller('PlanCtrl', function ($scope, $rootScope, Config, $q, $http, $ionicPlatform, $ionicPopup, $ionicModal, $ionicLoading, $filter, $state, $stateParams, $window, Toast, leafletData, planService, GeoLocate, mapService) {

    if (!$stateParams.replan) {
        planService.setEditInstance(null);
    }
    if ($stateParams.tripId) {
        $scope.tripId = $stateParams.tripId
    } else {
        planService.setEditInstance(null);
    }
    $scope.plantitle = $filter('translate')('plan_title');
    $scope.preferences = Config.getPlanPreferences();
    $scope.types = Config.getPlanTypes();
    $scope.datepickerObject = {};
    $scope.dateTimestamp = null;
    $scope.hourTimestamp = null;
    $scope.datepickerObject.inputDate = new Date();
    $scope.title = $filter('translate')('plan_map_title');
    $scope.place = null;
    $scope.favoriteFrom = false;
    $scope.favoriteTo = false;
    $scope.placesandcoordinates = null;
    $scope.favoritePlaces = JSON.parse(localStorage.getItem(Config.getAppId() + "_favoritePlaces"));
    if (!$scope.favoritePlaces) {
        $scope.favoritePlaces = [];
    }
    //init the params used for pianifications
    $scope.initParams = function () {
        $scope.refresh = true;
        $scope.planParams = {
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
            date: '',
            wheelchair: false
        }
    };
    //init a map with all the selected types of means. False default
    var initMapTypes = function (types) {
        var map = {};
        for (var i = 0; i < types.length; i++) {
            map[types[i]] = false;
        }
        return map;
    }
    var setDefaultOptions = function () {
        //var planOptionConfig = Config.getPlanDefaultOptions();
        $scope.planParams.departureTime = $filter('date')(new Date().getTime(), 'hh:mma');
        $scope.planParams.date = $filter('date')(new Date().getTime(), 'MM/dd/yyyy');
        $scope.planParams.routeType = planOptionConfig.routeType;
        $scope.planParams.transportTypes = planOptionConfig.transportTypes;
        $scope.planParams.wheelchair = false;
        for (var i = 0; i < $scope.types.length; i++) {
            $scope.mapTypes[$scope.planParams.transportTypes[i]] = true;
        }
    }
    $scope.switchAcc = function () {
        $scope.planParams.wheelchair = !$scope.planParams.wheelchair;
    }
    //is accessibility selected?
    $scope.isSwitchedAcc = function () {
        return $scope.planParams.wheelchair;
    }
    var setSavedOptions = function (Configure) {
        $scope.planParams.departureTime = $filter('date')(new Date().getTime(), 'hh:mma');
        $scope.planParams.date = $filter('date')(new Date().getTime(), 'MM/dd/yyyy');
        $scope.planParams.routeType = Configure.routeType;
        $scope.planParams.transportTypes = Configure.transportTypes;
        $scope.planParams.wheelchair = Configure.wheelchair;
        for (var i = 0; i < $scope.types.length; i++) {
            $scope.mapTypes[$scope.planParams.transportTypes[i]] = true;
        }
    }
    //init the month list in different language
    var monthList = [
        $filter('translate')('popup_datepicker_jan'),
        $filter('translate')('popup_datepicker_feb'),
        $filter('translate')('popup_datepicker_mar'),
        $filter('translate')('popup_datepicker_apr'),
        $filter('translate')('popup_datepicker_may'),
        $filter('translate')('popup_datepicker_jun'),
        $filter('translate')('popup_datepicker_jul'),
        $filter('translate')('popup_datepicker_ago'),
        $filter('translate')('popup_datepicker_sep'),
        $filter('translate')('popup_datepicker_oct'),
        $filter('translate')('popup_datepicker_nov'),
        $filter('translate')('popup_datepicker_dic')
    ];
    //init the week list in different language
    var weekDaysList = [
        $filter('translate')('popup_datepicker_sun'),
        $filter('translate')('popup_datepicker_mon'),
        $filter('translate')('popup_datepicker_tue'),
        $filter('translate')('popup_datepicker_wed'),
        $filter('translate')('popup_datepicker_thu'),
        $filter('translate')('popup_datepicker_fri'),
        $filter('translate')('popup_datepicker_sat')
    ];

    function setDateWidget() {

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
            to: new Date(2220, 12, 1), //Optional
            callback: function (val) { //Optional
                datePickerCallbackPopup(val);
            }
        };
    }

    function setTimeWidget() {
        $scope.timePickerObject24Hour = {
            inputEpochTime: ((new Date()).getHours() * 60 * 60 + (new Date()).getMinutes() * 60), //Optional
            step: 5, //Optional
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
    }

    function timePicker24Callback(val) {
        if (typeof (val) === 'undefined') {
            console.log('Time not selected');
        } else {
            $scope.timePickerObject24Hour.inputEpochTime = val;
            var selectedTime = new Date();
            selectedTime.setHours(val / 3600);
            selectedTime.setMinutes((val % 3600) / 60);
            selectedTime.setSeconds(0);
            $scope.hourTimestamp = $filter('date')(selectedTime, 'hh:mma');
        }
    }
    setTimeWidget();

    var datePickerCallbackPopup = function (val) {
        if (typeof (val) === 'undefined') {
            console.log('No date selected');
        } else {
            $scope.datepickerObjectPopup.inputDate = val;
            $scope.dateTimestamp = $filter('date')(val.getTime(), 'MM/dd/yyyy');
        }
    };
    setDateWidget();

    //super CPU draining. I would need another way to check it
    $scope.isFavorite = function (fromOrTo, name) {
        if (fromOrTo == 'from')
            return $scope.favoriteFrom;
        else $scope.favoriteTo;
    }

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

    $ionicModal.fromTemplateUrl('templates/mapModalPlan.html', {
        id: '1',
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modalMap = modal;
    });

    $ionicModal.fromTemplateUrl('templates/favoritesModal.html', {
        id: '2',
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modalFavorites = modal;
    });

    $scope.bookmarks = function (fromOrTo, name) {
        //else pop up with list of favorites
        $scope.place = fromOrTo;
        var isfavorite = false;
        if (fromOrTo == 'from')
            isfavorite = $scope.favoriteFrom;
        else isfavorite = $scope.favoriteTo;

        if (!!name && name != '' && (!$scope.planParams[fromOrTo].name == '') && !isfavorite) {
            //if name is not contained in favorite, then popup (do u wanna add it?)
            if (!$scope.isFavorite(fromOrTo, name)) {
                //             popup (do u wanna add it?)
                $scope.showConfirm($filter('translate')("add_favorites_template"), $filter('translate')("add_favorites_title"), function () {
                    //add to favorites and refresh
                    $scope.favoritePlaces.push({
                        name: name,
                        lat: planService.getPosition($scope.place).latitude,
                        long: planService.getPosition($scope.place).longitude
                    });
                    if (fromOrTo == 'from')
                        $scope.favoriteFrom = true;
                    else $scope.favoriteTo = true;
                    //write into local storage
                    localStorage.setItem(Config.getAppId() + "_favoritePlaces", JSON.stringify($scope.favoritePlaces));
                });
            } else {
                //planService.setFromOrTo(fromOrTo);
                $scope.openFavorites();
            }
        } else {
            $scope.openFavorites();
        }

    };

    $ionicPlatform.onHardwareBackButton(function () {
        if ($scope.modalMap.isShown()) {
            $scope.modalMap.hide();
        } else if ($scope.modalFavorites.isShown()) {
            $scope.modalFavorites.hide();
        }
        $scope.refresh = true;
    });

    $scope.openMapPlan = function (place) {
        $scope.place = place;
        if ($scope.position) {
          $scope.center = {
              lat: $scope.position[0],
              lng: $scope.position[1],
              zoom: Config.getMapPosition().zoom
          };
        }
        $scope.refresh = false;
        if ($scope.modalMap) {
            $scope.modalMap.show();
        }
    };

    $scope.closeMap = function () {
        $scope.refresh = true;
        if ($scope.modalMap) {
            $scope.modalMap.hide();
        }
    };

    $scope.openFavorites = function () {
        $scope.refresh = false;
        $scope.modalFavorites.show();
    };

    $scope.closeFavorites = function () {
        $scope.refresh = true;
        $scope.modalFavorites.hide();
    };

    $scope.isSwitched = function (type) {
        return $scope.mapTypes[type];
    };

    $scope.switch = function (type) {
        $scope.mapTypes[type] = !$scope.mapTypes[type];
    };

    $scope.deleteFavorite = function (favorite) {
        $scope.showConfirm(favorite.name, $filter('translate')("popup_delete_favorite"), function () {
            $scope.favoritePlaces.splice($scope.favoritePlaces.indexOf(favorite), 1);
            localStorage.setItem(Config.getAppId() + "_favoritePlaces", JSON.stringify($scope.favoritePlaces));
            $scope.closeFavorites();
        });
        //delete $scope.placesandcoordinates[favorite.name];
    };

    var setAndCheckPlanParams = function () {
        //routeType
        if (($scope.planParams.from.name == '') || ($scope.fromName == '')) {
            Toast.show($filter('translate')("error_from_message_feedback"), "short", "bottom");
            return false
        }
        if (($scope.planParams.to.name == '') || ($scope.toName == '')) {
            Toast.show($filter('translate')("error_to_message_feedback"), "short", "bottom");
            return false
        }
        var selectedDate = new Date($scope.datepickerObjectPopup.inputDate);
        selectedDate.setHours(0, 0, 0, 0);
        if (((selectedDate.getTime() + $scope.timePickerObject24Hour.inputEpochTime * 1000)) < (new Date()).getTime() - (5 * 60000)) {
            Toast.show($filter('translate')("error_time_message_feedback"), "short", "bottom");
            return false
        }
        //transportTypes
        $scope.planParams.transportTypes = [];
        for (var i = 0; i < $scope.types.length; i++) {
            if ($scope.mapTypes[$scope.types[i]]) {
                $scope.planParams.transportTypes.push($scope.types[i]);
            }
        }
        if ($scope.planParams.transportTypes.length == 0) {
            Toast.show($filter('translate')("error_select_type_feedback"), "short", "bottom");
            return false
        }
        if ($scope.planParams.wheelchair && !$scope.mapTypes['WALK'] && !$scope.mapTypes['TRANSIT']) {
            Toast.show($filter('translate')("error_select_type_accessibility_feedback"), "short", "bottom");
            return false
        }
        if ($scope.hourTimestamp) {
            //departureTime
            $scope.planParams.departureTime = $scope.hourTimestamp;
        }
        if ($scope.dateTimestamp) {
            //date
            $scope.planParams.date = $filter('date')(selectedDate.getTime(), 'MM/dd/yyyy');
            //            selectedDate.getMonth() + '/' + selectedDate.getDate + '/' + selectedDate.getYear();
            //            $scope.dateTimestamp;
        }
        return true;
    };
    //if the paramas are ok, plan the journey and show the results to the planlist view
    $scope.plan = function () {
        if (setAndCheckPlanParams()) {
            $scope.popupLoadingShow();
            planService.planJourney($scope.planParams).then(function (value) {
                //if ok let's go to visualization
                $scope.popupLoadingHide();
                if ($scope.tripId) {
                    $state.go('app.planlist', {
                        tripId: $scope.tripId
                    })
                } else {
                    $state.go('app.planlist');
                }
            }, function (error) {
                //error then pop up some problem
                $scope.showErrorServer()
                $scope.popupLoadingHide();

            });
        }
    };
    $scope.clearFrom = function () {
        $scope.fromName = '';
    }
    $scope.clearTo = function () {
        $scope.toName = '';
    }

    var selectPlace = function (placeSelected) {
        if ($scope.place == 'from') {
            $scope.fromName = placeSelected;
            $scope.planParams.from.name = placeSelected;
            $scope.planParams.from.lat = planService.getPosition($scope.place).latitude;
            $scope.planParams.from.long = planService.getPosition($scope.place).longitude;
        } else if ($scope.place == 'to') {
            $scope.toName = placeSelected;
            $scope.planParams.to.name = placeSelected;
            $scope.planParams.to.lat = planService.getPosition($scope.place).latitude;
            $scope.planParams.to.long = planService.getPosition($scope.place).longitude;
        }
        console.log(placeSelected);
        /*close map*/
        $scope.closeMap();
    };

    $scope.favoriteSelect = function (newplace) {
        $scope.closeFavorites();
        planService.setPosition($scope.place, newplace.lat, newplace.long);
        planService.setName($scope.place, newplace.name);
        selectPlace(newplace.name);
        if ($scope.place == 'from')
            $scope.favoriteFrom = true;
        else $scope.favoriteTo = true;
    };

    /* part for the map */
    $scope.locateMe = function () {
        $ionicLoading.show();

        GeoLocate.locate().then(function (position) {
            $scope.position = position;
            var placedata = $q.defer();
            var places = {};
            var url = Config.getGeocoderURL() + '/location?latlng=' + position[0] + ',' + position[1];
            //add timeout
            $http.get(encodeURI(url), Config.getGeocoderConf())

            .success(function (data, status, headers, config) {
                places = data.response.docs;
                name = '';
                if (data.response.docs[0]) {
                    $scope.place = 'from';
                    planService.setPosition($scope.place, position[0], position[1]);
                    planService.setName($scope.place, data.response.docs[0]);
                    for (var i = 0; i < $scope.favoritePlaces.length; i++) {
                        if ($scope.favoritePlaces[i].name == name) {
                            $scope.favoriteFrom = true;
                            break;
                        }
                    }
                    //$scope.located = true;
                    selectPlace(name);
                    if (!$scope.placesandcoordinates) {
                        $scope.placesandcoordinates = [];
                    }
                    $scope.placesandcoordinates[name] = {
                        latlong: position[0] + "," + position[1]
                    }
                }
                $ionicLoading.hide();
            })

            .error(function (data, status, headers, config) {
                //temporary
                $ionicLoading.hide();
                $scope.refresh = true;
                $scope.showNoConnection();
            });
            //                });
        }, function () {
            $ionicLoading.hide();
            $scope.refresh = true;
            console.log('CANNOT LOCATE!');
        });
        // }
    };
    // init the address selection map: show a popup when the user click on it with the address (trough Geocoder) or the coordinates of where he clicked
    $scope.initMap = function () {
        mapService.initMap('modalMapPlan',true).then(function () {

            $scope.$on("leafletDirectiveMap.modalMapPlan.click", function (event, args) {
                $ionicLoading.show();
                planService.setPosition($scope.place, args.leafletEvent.latlng.lat, args.leafletEvent.latlng.lng);
                var placedata = $q.defer();
                var url = Config.getGeocoderURL() + '/location?latlng=' + args.leafletEvent.latlng.lat + ',' + args.leafletEvent.latlng.lng;
                $http.get(encodeURI(url), Config.getGeocoderConf())
                    .success(function (data, status, headers, config) {
                        $ionicLoading.hide();
                        $scope.name = '';
                        if (data.response.docs[0]) {
                            planService.setName($scope.place, data.response.docs[0]);
                            $scope.name = planService.getName($scope.place);
                            $ionicPopup.show({
                                templateUrl: 'templates/planMapPopup.html',
                                cssClass: 'parking-popup',
                                scope: $scope,
                                buttons: [
                                    {
                                        text: $filter('translate')('btn_close'),
                                        type: 'button-close'
                                },
                                    {
                                        text: $filter('translate')('btn_conferma'),
                                        onTap: function (e) {
                                            selectPlace($scope.name);
                                        }
                            }

                        ]
                            });
                        } else {
                            /*confirmpopup*/
                            $scope.name = $filter('translate')("popup_lat") + args.leafletEvent.latlng.lat.toString().substring(0, 7) + " " + $filter('translate')("popup_long") + args.leafletEvent.latlng.lng.toString().substring(0, 7);
                            $ionicPopup.show({
                                templateUrl: 'templates/planMapPopup.html',
                                cssClass: 'parking-popup',
                                scope: $scope,
                                buttons: [
                                    {
                                        text: $filter('translate')('btn_close'),
                                        type: 'button-close'
                                                },
                                    {
                                        text: '<i class="icon ion-navigate"></i>',
                                        onTap: function (e) {
                                            selectPlace(args.leafletEvent.latlng);
                                        }
                                    }
                                            ]
                            });
                        }
                    })

                .error(function (data, status, headers, config) {
                    $ionicLoading.hide();
                    $scope.showNoConnection();
                });
            });
        });
    };

    $scope.detail = function (view) {
        window.location.assign(view);
    };

    $scope.closeWin = function () {
        mapService.getMap('modalMapPlan').then(function (map) {
            map.closePopup();
        });
    };

    var addFavoritePlaces = function (typedthings, places) {
        var newplaces = places;
        for (var i = 0; i < $scope.favoritePlaces.length; i++) {
            if (($scope.favoritePlaces[i].name.toUpperCase().indexOf(typedthings.toUpperCase()) > -1) && (newplaces.indexOf($scope.favoritePlaces[i].name) == -1)) { //se favorites places contiene la stringa e non fa ancora parte di places
                //if is not already present in the array
                newplaces.unshift($scope.favoritePlaces[i].name);
            }
        }
        return newplaces;
    };


    var typePlace = function (typedthings, fromOrTo) {
        if (($scope.placesandcoordinates && $scope.placesandcoordinates[typedthings] == null) || typedthings == '' || $scope.placesandcoordinates == null) {
            $scope.planParams[fromOrTo] = {
                name: '',
                lat: '',
                long: ''
            }
            if (fromOrTo == 'from')
                $scope.favoriteFrom = false;
            $scope.favoriteTo = false;
        };

        $scope.result = typedthings;
        planService.getTypedPlaces(typedthings).then(function (data) {
            //merge with favorites and check no double values
            $scope['places' + fromOrTo] = data;
            if (data.length > 0) {
                $scope['places' + fromOrTo] = addFavoritePlaces(typedthings, $scope['places' + fromOrTo]);
                $scope.placesandcoordinates = planService.getnames();
                $scope.placesandcoordinates = planService.addnames($scope.favoritePlaces);
            } else {
                $scope['places' + fromOrTo] = null;
                $scope.placesandcoordinates = null;
            }
        });
    }

    $scope.typePlaceFrom = function (typedthings) {
        typePlace(typedthings, 'from');
    };
    $scope.typePlaceTo = function (typedthings) {
        typePlace(typedthings, 'to');
    };

    $scope.resetParams = function (fromOrTo) {
        $scope['places' + fromOrTo] = null;
        $scope.placesandcoordinates = null;
        $scope.planParams[fromOrTo] = {
            name: '',
            lat: '',
            long: ''
        }
        if (fromOrTo == 'from')
            $scope.favoriteFrom = false;
        else $scope.favoriteTo = false;

    }
    $scope.select = function (suggestion) {
        console.log("select");

    };

    $scope.setPlaceById = function (id) {
        console.log(id);
    };

    $scope.changeStringFrom = function (suggestion) {
        console.log("changestringfrom");
        $scope.place = 'from';
        planService.setPosition($scope.place, $scope.placesandcoordinates[suggestion].latlong.split(',')[0], $scope.placesandcoordinates[suggestion].latlong.split(',')[1]);
        planService.setName($scope.place, suggestion);
        for (var i = 0; i < $scope.favoritePlaces.length; i++) {
            if ($scope.favoritePlaces[i].name == suggestion) {
                $scope.favoriteFrom = true;
                break;
            }
        }

        selectPlace(suggestion);
    };

    $scope.changeStringTo = function (suggestion) {
        console.log("changestringto");
        $scope.place = 'to';
        planService.setPosition($scope.place, $scope.placesandcoordinates[suggestion].latlong.split(',')[0], $scope.placesandcoordinates[suggestion].latlong.split(',')[1]);
        planService.setName($scope.place, suggestion);
        for (var i = 0; i < $scope.favoritePlaces.length; i++) {
            if ($scope.favoritePlaces[i].name == suggestion) {
                $scope.favoriteTo = true;
                break;
            }
        }
        selectPlace(suggestion);
    };

    // execution
    angular.extend($scope, {
        center: {
            lat: Config.getMapPosition().lat,
            lng: Config.getMapPosition().long,
            zoom: Config.getMapPosition().zoom
        },
        events: {}
    });

    var manageOptions = function () {
        if ($scope.planParams.from && $scope.planParams.from.name) {
            $scope.fromName = $scope.planParams.from.name;
            $scope.place = 'from';
            planService.setPosition($scope.place, $scope.planParams.from.lat, $scope.planParams.from.long);
            selectPlace($scope.planParams.from.name);
            if (!$scope.placesandcoordinates) {
                $scope.placesandcoordinates = [];
            }
            $scope.placesandcoordinates[$scope.planParams.from.name] = {
                latlong: $scope.planParams.from.lat + "," + $scope.planParams.from.long
            }
            for (var i = 0; i < $scope.favoritePlaces.length; i++) {
                if ($scope.favoritePlaces[i].name == name) {
                    $scope.favoriteFrom = true;
                    break;
                }
            }
        } else {
            $scope.planParams['from'] = {
                name: '',
                lat: '',
                long: ''
            };
            $scope.locateMe();
        };
        if ($scope.planParams.to && $scope.planParams.to.name) {
            $scope.toName = $scope.planParams.to.name;
            $scope.place = 'to';
            planService.setPosition($scope.place, $scope.planParams.to.lat, $scope.planParams.to.long);
            selectPlace($scope.planParams.to.name);
            if (!$scope.placesandcoordinates) {
                $scope.placesandcoordinates = [];
            }
            $scope.placesandcoordinates[$scope.planParams.to.name] = {
                latlong: $scope.planParams.to.lat + "," + $scope.planParams.to.long
            }
            for (var i = 0; i < $scope.favoritePlaces.length; i++) {
                if ($scope.favoritePlaces[i].name == name) {
                    $scope.favoriteTo = true;
                    break;
                }
            }
        } else {
            $scope.planParams['to'] = {
                name: '',
                lat: '',
                long: ''
            };
        }
        if ($scope.planParams.departureTime) {
            var configdate = new Date();
            var time = planService.convertTo24Hour($scope.planParams.departureTime);
            configdate.setHours(time.substr(0, 2));
            configdate.setMinutes(time.substr(3, 2));
            $scope.timePickerObject24Hour.inputEpochTime = configdate.getHours() * 60 * 60 + configdate.getMinutes() * 60;
        } else {
            $scope.planParams['departureTime'] = $filter('date')(new Date().getTime(), 'hh:mma');
        }
        if ($scope.planParams.date) {
            var configdate = planService.mmddyyyy2date($scope.planParams.date);
            //            configdate.setFullYear($scope.planParams.date.substr(6, 4), $scope.planParams.date.substr(0, 2) - 1, $scope.planParams.date.substr(3, 2));
            $scope.datepickerObjectPopup.dateTimestamp = $filter('date')(configdate.getTime());
            $scope.datepickerObject.inputDate = new Date(configdate);
            setDateWidget();


        } else {
            $scope.planParams['date'] = $filter('date')(new Date().getTime(), 'MM/dd/yyyy');
        }
        if (!$scope.planParams.routeType) {
            $scope.planParams['routeType'] = planOptionConfig.routeType;
        }
        if (!$scope.planParams.transportTypes) {
            $scope.planParams['transportTypes'] = planOptionConfig.transportTypes;
        }
        for (var i = 0; i < $scope.types.length; i++) {
            $scope.mapTypes[$scope.planParams.transportTypes[i]] = true;
        }
        if (!$scope.planParams.departureTime) {
            $scope.planParams['departureTime'] = $filter('date')(new Date().getTime(), 'hh:mma');
        }
        if (!$scope.planParams.date) {
            $scope.planParams['date'] = $filter('date')(new Date().getTime(), 'MM/dd/yyyy');
        }

    }

    $scope.mapTypes = initMapTypes($scope.types);
    $scope.planParams = planService.getPlanConfigure();
    var planOptionConfig = Config.getPlanDefaultOptions();

    //check option by option
    if ($scope.planParams) {
        manageOptions();
    } else {
        $scope.initParams();
        $scope.locateMe();
        setDefaultOptions();
    }


    var oldConfig = null;
    if (planService.getPlanConfigure() != null) {
        oldConfig = planService.getPlanConfigure();
    }
    $scope.updateFn = function (fromOrTo) {
       $scope.resetParams(fromOrTo);
       if (fromOrTo == 'from') {
         $scope.fromName = "";
       } else {
         $scope.toName = "";
       }
     }

    $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
        var oldConfig = planService.getPlanConfigure();

        if ((toState.name == 'app.plan') && (fromState.name == 'app.planlist') && (oldConfig != null)) {
            planService.setPlanConfigure(oldConfig);
            $scope.planParams = planService.getPlanConfigure();
            var planOptionConfig = Config.getPlanDefaultOptions();
            manageOptions();
        }
        if ((toState.name == 'app.plan') && (fromState.name == 'app.home')) {
            planService.setPlanConfigure(null);
        }
    });




})
