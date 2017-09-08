angular.module('viaggia.controllers.home', [])

    .controller('HomeCtrl', function ($scope, $state, $rootScope, $ionicPlatform, $timeout, $interval, $filter, $location, $ionicHistory, marketService, notificationService, Config, GeoLocate, mapService, ionicMaterialMotion, ionicMaterialInk, bookmarkService, planService, $ionicLoading, $ionicPopup, trackService, Toast, tutorial, GameSrv, DiaryDbSrv) {
        //load from localstorage the id notifications read
        $ionicPlatform.ready(function () {
            document.addEventListener("resume", function () {
                notificationInit();
                Config.setWeeklySposnsor();

            }, false);
            Config.setWeeklySposnsor();

        });

        //aggoiorna le notifiche
        var notificationInit = function () {
            //scrico le ultime di una settimana
            if (localStorage.getItem(Config.getAppId() + '_lastUpdateTime') == null) {
                date = new Date();
                //date.setDate(date.getDate() - 7);
                lastUpdateTime = date.getTime();
            } else {
                lastUpdateTime = localStorage.getItem(Config.getAppId() + '_lastUpdateTime');
            }
            notificationService.getNotifications(lastUpdateTime, 0, 10).then(function (items) { //solo le nuove
                if (items) {
                    $rootScope.countNotification = items.length;
                    //last update time is the last time of notification
                    if (items.length > 0) {

                        lastUpdateTime = items[0].updateTime + 1;
                    }
                    localStorage.setItem(Config.getAppId() + '_lastUpdateTime', lastUpdateTime);
                }
            }, function (err) {

                $rootScope.countNotification = 0;

            });
        }
        $scope.openSponsorLink = function (link) {
            window.open(link, '_system', 'location=yes');
            return false;
        }
        var localDataInit = function () {
            planService.getTrips().then(function () {
                //$ionicLoading.hide();
            }, function () {
                //$ionicLoading.hide();
            });
        }
        $scope.buttons = [{
            label: $filter('translate')('menu_news'),
            icon: 'ic_news'
        }, {
            label: $filter('translate')('menu_notifications'),
            icon: 'ic_notification'
        }];
        var mymap = document.getElementById('map-container');

        Config.init().then(function () {
            $rootScope.title = Config.getAppName();
            angular.extend($scope, {
                center: {
                    lat: Config.getMapPosition().lat,
                    lng: Config.getMapPosition().long,
                    zoom: Config.getMapPosition().zoom
                },
                events: {}
            });

            bookmarkService.getBookmarksRT().then(function (list) {
                var homeList = [];
                list.forEach(function (e) {
                    if (e.home) homeList.push(e);
                });
                $scope.primaryLinks = homeList; //Config.getPrimaryLinks();
            });
            marketService.initMarketFavorites();
            notificationInit();
            initWatch();
            localDataInit();

        }, function () {
            //$ionicLoading.hide();
        });
        $scope.$on("$ionicView.afterEnter", function (scopes, states) {
            $ionicLoading.hide();
        });
        $scope.$on("$ionicView.beforeEnter", function (scopes, states) {
            // $ionicLoading.show();
        });
        $scope.$on("$ionicView.enter", function (scopes, states) {
            Config.init().then(function () {
                if (window.BackgroundGeolocation) {
                    trackService.startup().then(function () {
                        $scope.trackingIsOn = trackService.trackingIsGoingOn() && !trackService.trackingIsFinished();
                        // $ionicLoading.hide();

                        if ($scope.trackingIsOn) {
                            if ($rootScope.GPSAllow == true) {
                                updateTrackingInfo();
                            } else if ($rootScope.GPSAllow == false) {
                                trackService.cleanTracking();
                                $scope.trackingIsOn = false;
                                trackService.geolocationDisabledPopup();
                            } else if ($rootScope.GPSAllow == null) {
                                var listener = $rootScope.$watch('GPSAllow', function () {
                                    if ($rootScope.GPSAllow == true) {
                                        updateTrackingInfo();
                                    } else if ($rootScope.GPSAllow == false) {
                                        trackService.cleanTracking();
                                        $scope.trackingIsOn = false;
                                        trackService.geolocationDisabledPopup();
                                        listener();
                                    }
                                });
                            }
                        }
                    }, function (err) {
                        //track service startup not worked.
                        // $ionicLoading.hide();

                    });

                };
            });

        }, function (err) {
            $scope.homeCreation = false;
        });

        var translateTransport = function (t) {
            if (t == 'walk') return $filter('translate')('track_walk_action');
            if (t == 'bike') return $filter('translate')('track_bike_action');
            return $filter('translate')('track_other_action');
        }

        function setTrackingInfo() {
            $scope.trackingInfo = {
                transport: translateTransport(trackService.trackedTransport()),
                time: $filter('date')(new Date().getTime() - trackService.trackingTimeStart(), 'HH:mm:ss', '+0000')
            };
        };

        var updateTrackingInfo = function () {
            setTrackingInfo();
            $scope.trackInfoInterval = $interval(function () {
                setTrackingInfo();
            }, 1000);
        }

        var startTransportTrack = function (transportType) {
            $scope.trackingIsOn = true;
            trackService.startTransportTrack(transportType).then(function () {
                updateTrackingInfo();
            }, function (errorCode) {
                $scope.trackingIsOn = false;
                trackService.geolocationPopup();
            }).finally(Config.loaded());
        }
        $scope.startTracking = function (transportType) {
            if (!$rootScope.syncRunning) {
                Config.loading();
                if (!trackService.trackingIsGoingOn() || trackService.trackingIsFinished()) {
                    trackService.checkLocalization().then(function () {
                        startTransportTrack(transportType);
                    }, function (error) {
                        Config.loaded();
                        if (Config.isErrorLowAccuracy(error)) {
                            //popup "do u wanna go on?"
                            $ionicPopup.confirm({
                                title: $filter('translate')("pop_up_low_accuracy_title"),
                                template: $filter('translate')("pop_up_low_accuracy_template"),
                                buttons: [
                                    {
                                        text: $filter('translate')("btn_close"),
                                        type: 'button-cancel'
                                    },
                                    {
                                        text: $filter('translate')("pop_up_low_accuracy_button_go_on"),
                                        type: 'button-custom',
                                        onTap: function () {
                                            startTransportTrack(transportType);
                                        }
                                    }
                                ]
                            });
                        } else if (Config.isErrorGPSNoSignal(error)) {
                            //popup "impossible to track" and stop
                            var alert = $ionicPopup.alert({
                                title: $filter('translate')("pop_up_no_geo_title"),
                                template: $filter('translate')("pop_up_no_geo_template"),
                                okText: $filter('translate')("btn_close"),
                                okType: 'button-cancel'
                            });
                            alert.then(function (e) {
                                trackService.startup();
                            });
                        }
                    });

                } else {
                    Config.loaded();
                }
            }
        }
        $scope.stopTracking = function () {
            Config.loading();
            $scope.trackingIsOn = false;
            if (!!$scope.trackInfoInterval) $interval.cancel($scope.trackInfoInterval);
            $scope.trackingInfo = {};
            trackService.computeInfo().then(function (data) {
                Config.loaded();
                var travelForDiary = GameSrv.getTravelForDiary()
                trackService.stop();
                if (Math.floor(data.dist > Config.getMinimumDistance())) {
                    if (data.valid) {
                        GameSrv.addTravelDiary(travelForDiary);
                        $ionicPopup.confirm({
                            title: $filter('translate')("pop_up_points_title"),
                            template: $filter('translate')("pop_up_points_template"),
                            buttons: [
                                {
                                    text: $filter('translate')("btn_close"),
                                    type: 'button-cancel'
                                },
                                {
                                    text: $filter('translate')("pop_up_points_btn"),
                                    type: 'button-custom',
                                    onTap: function () {
                                        $state.go('app.diary');
                                    }
                                }
                            ]
                        });
                    } else {
                        $ionicPopup.alert({
                            title: $filter('translate')("pop_up_invalid_tracking_title"),
                            template: $filter('translate')("pop_up_invalid_tracking_template"),
                            okText: $filter('translate')("btn_close"),
                            okType: 'button-cancel'
                        });

                    }
                } else {
                    // Toast.show($filter('translate')("no_points"), "short", "bottom");
                    $ionicPopup.alert({
                        title: $filter('translate')("no_points_title"),
                        template: $filter('translate')("no_points", {
                            points: data.points
                        }),
                        okText: $filter('translate')("btn_close"),
                        okType: 'button-cancel'
                    })
                }
            }, function () {
                Config.loaded();
                $scope.showErrorServer();
                trackService.stop();
            }).finally(Config.loaded);

        }

        $scope.openSavedTracks = function () {
            planService.getTrips().then(function (trips) {
                if (trips && !angular.equals(trips, {})) {
                    $state.go('app.mytrips');
                } else {
                    //Toast.show($filter('translate')("no_saved_tracks_to_track"), "short", "bottom");
                    var confirmPopup = $ionicPopup.confirm({
                        title: $filter('translate')("my_trip_empty_list"),
                        template: $filter('translate')("no_saved_tracks_to_track"),
                        buttons: [
                            {
                                text: $filter('translate')("pop_up_close"),
                                type: 'button-cancel'
                            },
                            {
                                text: $filter('translate')("pop_up_plan"),
                                type: 'button-custom',
                                onTap: function () {
                                    confirmPopup.close();
                                    planService.setPlanConfigure(null);
                                    $state.go('app.plan');
                                }
                            }
                        ]
                    });
                }
            });
        }

        $scope.$on('ngLastRepeat.primaryLinks', function (e) {
            $timeout(function () {
                ionicMaterialMotion.ripple();
                ionicMaterialInk.displayEffect()
            }); // No timeout delay necessary.
        });
        var initWatch = function () {
            $scope.$watch('notificationService.notifications', function (newVal, oldVal, scope) {
                notificationInit();
            });
        }
        /* DISABLED MAP
            $scope.initMap = function () {
                mapService.initMap('homeMap').then(function (map) {

                    if (mymap != null) {
                        mapService.resizeElementHeight(mymap, 'homeMap');
                        mapService.refresh('homeMap');
                    }
                    Config.init().then(function () {
                      mapService.centerOnMe('homeMap', Config.getMapPosition().zoom);
                    });
                });
            }
            window.onresize = function () {
                if (mymap != null) {
                    mapService.resizeElementHeight(mymap, 'homeMap');
                    mapService.refresh('homeMap');
                }
            }


            $scope.$on('$ionicView.beforeEnter', function(){
              mapService.resizeElementHeight(mymap, 'homeMap');
              mapService.refresh('homeMap');
            });

            //just for init
            angular.extend($scope, {
                center: {
                    lat: 0,
                    lng: 0,
                    zoom: 8
                },
                events: {}
            });
        */
        $scope.openNotifications = function () {
            $rootScope.countNotification = 0;
            $state.go('app.notifications');
        }
        $scope.go = function (state) {
            if (state.indexOf('(') > 0) {
                eval('$scope.' + state);
            } else {
                $location.path(state);
            }

        }
        $scope.goToBookmarks = function () {
            $state.go('app.bookmarks');
            $ionicHistory.nextViewOptions({
                disableBack: true
            });

        }
        $scope.getCountNotification = function (counter) {
            if (counter > 9) {
                return counter + "+";
            }
            return counter;
        }
        $scope.showTutorial = function () {
            tutorial.showTutorial('main', 'main', 4, $scope);
        }

    })
