angular.module('viaggia.controllers.home', [])

    .controller('HomeCtrl', function ($scope, $state, GameSrv, profileService, $rootScope, $ionicPlatform, $timeout, $interval, $filter, $location, $ionicHistory, marketService, notificationService, Config, GeoLocate, mapService, ionicMaterialMotion, ionicMaterialInk, bookmarkService, planService, $ionicLoading, $ionicPopup, trackService, Toast, tutorial, GameSrv, DiaryDbSrv, BT) {

        $scope.challenges = [];
        $scope.expansion = [];
        $scope.buttons = [{
            label: $filter('translate')('menu_news'),
            icon: 'ic_news'
        }, {
            label: $filter('translate')('menu_notifications'),
            icon: 'ic_notification'
        }];

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

        $scope.$watch(function () {
            return profileService.status;
        }, function (newVal, oldVal, scope) {
            $scope.status = profileService.getProfileStatus();
            setUserLevel();
            setUserProgress();
            //TODO fake challenge
            if ($scope.status && $scope.status.challengeConcept)
                //     $scope.status.challengeConcept.activeChallengeData = [
                //         {
                //             "challId": "start_survey-1624ea3d21e-63568495",
                //             "challDesc": "Fill out the start survey and gain a bonus of 100 green leaves points.",
                //             "challCompleteDesc": "To win this challenge, complete the initial game questionnaire that you can access <a href='https://dev.smartcommunitylab.it/core.mobility/gamificationweb/survey/en/start/CnbSEzji02s7UKrI1flpV5KpBNtWiONw4T0ElIODy1g' target='_system'>here</a>.",
                //             "challTarget": 1,
                //             "status": 0,
                //             "row_status": 0.0,
                //             "type": "survey",
                //             "active": false,
                //             "success": false,
                //             "startDate": 1521737781790,
                //             "endDate": 1522947381790,
                //             "daysToEnd": 0,
                //             "bonus": 100,
                //             "challCompletedDate": 0,
                //             "type": "comp_time"
                //         },
                //         {
                //             "challId": "start_survey-1624ea3d21e-63568495",
                //             "challDesc": "Fill out the start survey and gain a bonus of 100 green leaves points.",
                //             "challCompleteDesc": "To win this challenge, complete the initial game questionnaire that you can access <a href='https://dev.smartcommunitylab.it/core.mobility/gamificationweb/survey/en/start/CnbSEzji02s7UKrI1flpV5KpBNtWiONw4T0ElIODy1g' target='_system'>here</a>.",
                //             "challTarget": 1,
                //             "status": 0,
                //             "row_status": 0.0,
                //             "type": "survey",
                //             "active": false,
                //             "success": false,
                //             "startDate": 1521737781790,
                //             "endDate": 1522947381790,
                //             "daysToEnd": 0,
                //             "bonus": 100,
                //             "challCompletedDate": 0,
                //             "type": "single"
                //         },
                //         {
                //             "challId": "start_survey-1624ea3d21e-63568495",
                //             "challDesc": "Fill out the start survey and gain a bonus of 100 green leaves points.",
                //             "challCompleteDesc": "To win this challenge, complete the initial game questionnaire that you can access <a href='https://dev.smartcommunitylab.it/core.mobility/gamificationweb/survey/en/start/CnbSEzji02s7UKrI1flpV5KpBNtWiONw4T0ElIODy1g' target='_system'>here</a>.",
                //             "challTarget": 1,
                //             "status": 0,
                //             "row_status": 0.0,
                //             "type": "survey",
                //             "active": false,
                //             "success": false,
                //             "startDate": 1521737781790,
                //             "endDate": 1522947381790,
                //             "daysToEnd": 0,
                //             "bonus": 100,
                //             "challCompletedDate": 0,
                //             "type": "comp_perf"
                //         },
                //         {
                //             "challId": "start_survey-1624ea3d21e-63568495",
                //             "challDesc": "Fill out the start survey and gain a bonus of 100 green leaves points.",
                //             "challCompleteDesc": "To win this challenge, complete the initial game questionnaire that you can access <a href='https://dev.smartcommunitylab.it/core.mobility/gamificationweb/survey/en/start/CnbSEzji02s7UKrI1flpV5KpBNtWiONw4T0ElIODy1g' target='_system'>here</a>.",
                //             "challTarget": 1,
                //             "status": 0,
                //             "row_status": 0.0,
                //             "type": "survey",
                //             "active": false,
                //             "success": false,
                //             "startDate": 1521737781790,
                //             "endDate": 1522947381790,
                //             "daysToEnd": 0,
                //             "bonus": 100,
                //             "challCompletedDate": 0,
                //             "type": "coop"
                //         },

                //     ]
                // $scope.status.challengeConcept.oldChallengeData = [
                //     {
                //         "challId": "260004cf-d6d7-4b30-8fb7-9107d77e72f9",
                //         "challDesc": "Fai almeno 1 viaggio in autobus e avrai un bonus di 50 punti Green Leaves",
                //         "challCompleteDesc": "Per vincere la sfida vale il numero di itinerari che utilizzano il trasporto pubblico pianificati con ViaggiaRovereto Play&Go e compiuti durante la validita' della sfida.",
                //         "challTarget": 1,
                //         "status": 0,
                //         "row_status": 0,
                //         "type": "TRIPNUMBER",
                //         "active": false,
                //         "success": false,
                //         "startDate": 1460671201175,
                //         "endDate": 1460930401175,
                //         "daysToEnd": 0
                //     },
                //     {
                //         "challId": "6b37c81c-30ae-4563-bf69-e9620ca52b52",
                //         "challDesc": "Raccomanda la App ad almeno 2 utenti e guadagni 50 punti Green Leaves",
                //         "challCompleteDesc": "Per vincere la sfida, almeno 2 tuoi amici si devono registrare al gioco indicando il tuo nickname nell'apposito campo durante la registrazione.",
                //         "challTarget": 2,
                //         "status": 50,
                //         "row_status": 1,
                //         "type": "RECOMMENDATION",
                //         "active": false,
                //         "success": false,
                //         "startDate": 1461189601815,
                //         "endDate": 1461276001815,
                //         "daysToEnd": 0
                //     },
                //     {
                //         "challId": "76a2256f-da36-4d7d-957a-86399c091d52",
                //         "challDesc": "Ottieni almeno 1 badge nella Badge Collection green leaves e vinci un bonus di 30 punti Green Leaves",
                //         "challCompleteDesc": "I badge della collezione green leaves vengono assegnati al raggiungimento di 50, 100, 200, 400, 800, 1500, 2500, 5000, 10000 e 20000 punti.",
                //         "challTarget": 1,
                //         "status": 0,
                //         "row_status": 0,
                //         "type": "NEXTBADGE",
                //         "active": false,
                //         "success": false,
                //         "startDate": 1461362401208,
                //         "endDate": 1461621601208,
                //         "daysToEnd": 0
                //     },
                //     {
                //         "challId": "f936c43c-e73d-421f-abc1-92b561fbbbe7",
                //         "challDesc": "Fai almeno 1 viaggio in bici e avrai un bonus di 30 punti Green Leaves",
                //         "challCompleteDesc": "Per vincere la sfida effettua almeno un viaggio utilizzando la bici nel corso del periodo di validita' della sfida.",
                //         "challTarget": 1,
                //         "status": 0,
                //         "row_status": 0,
                //         "type": "TRIPNUMBER",
                //         "active": false,
                //         "success": false,
                //         "startDate": 1461362401506,
                //         "endDate": 1461621601506,
                //         "daysToEnd": 0
                //     },
                //     {
                //         "challId": "124254ca-5f83-4081-8c06-f20d757fd7f4",
                //         "challDesc": "Raccomanda la App ad almeno 1 utente e guadagni 50 punti Green Leaves",
                //         "challCompleteDesc": "Per vincere la sfida, almeno 1 tuo amico si deve registrare al gioco indicando il tuo nickname nell'apposito campo durante la registrazione.",
                //         "challTarget": 1,
                //         "status": 100,
                //         "row_status": 4,
                //         "type": "RECOMMENDATION",
                //         "active": false,
                //         "success": true,
                //         "startDate": 1460671201950,
                //         "endDate": 1460930401950,
                //         "daysToEnd": 0
                //     },
                //     {
                //         "challId": "656f644b-a272-45e1-91d8-afd9af72a927",
                //         "challDesc": "Fai almeno 1 viaggio a impatto zero e avrai un bonus di 20 punti Green Leaves",
                //         "challCompleteDesc": "Gli itinerari a impatto zero sono quelli che comprendono solo tratte in bici, bike sharing o a piedi.",
                //         "challTarget": 1,
                //         "status": 0,
                //         "row_status": 0,
                //         "type": "ZEROIMPACT",
                //         "active": false,
                //         "success": false,
                //         "startDate": 1461189601431,
                //         "endDate": 1461276001431,
                //         "daysToEnd": 0
                //     }

                // ]
                setChallenges();
        });
        var initExpansion = function () {
            for (var i = 0; i < $scope.challenges.length; i++) {
                $scope.expansion[i] = false;
            }
        }
        var setChooseButton = function () {
            //if proposed is not empty enable
            GameSrv.getProposedChallenges(profileService.status).then(function (challenges) {
                if (challenges && challenges.length) {
                    $scope.buttonEnabled = true;

                } else {
                    $scope.buttonEnabled = false;
                }
            }, function (err) {
                $scope.buttonEnabled = false;
            });
        }
        var setChallenges = function () {
            // get the updated active challenges
            GameSrv.getActiveChallenges(profileService.status).then(function (challenges) {
                // if (!!$scope.status && !!$scope.status['challengeConcept']&& !!$scope.status['challengeConcept']['challengeData']) {
                if (challenges) {
                    $scope.challenges = challenges;
                    if (!$scope.challenges) {
                        $scope.challenges = [];
                    }
                    else {
                        initExpansion();
                    }
                } else {
                    $scope.challenges = [];
                }
            });

        }
        var setUserProgress = function () {
            $scope.userProgress = 0;
            if ($scope.status && $scope.status.levels && $scope.status.levels.length > 0 && $scope.status.levels[0]) {
                var total = $scope.status.levels[0].endLevelScore - $scope.status.levels[0].startLevelScore;
                $scope.toNextLevel = $scope.status.levels[0].toNextLevel;
                var mypos = total - $scope.status.levels[0].toNextLevel;
                $scope.userProgress = (mypos * 100) / total;
            }
        }
        var setUserLevel = function () {
            $scope.level = "";
            if ($scope.status && $scope.status.levels && $scope.status.levels.length > 0 && $scope.status.levels[0].levelValue)
                $scope.level = $scope.status.levels[0].levelValue;
        }
        // var mymap = document.getElementById('map-container');
        $scope.getChallengeTemplate = function (challenge) {
            switch (challenge.type) {
                case 'comp_time': {
                    return 'templates/game/challengeTemplates/competitiveTime.html';
                    break;
                }
                case 'comp_perf': {
                    return 'templates/game/challengeTemplates/competitivePerformance.html';
                    break;
                }
                case 'coop': {
                    return 'templates/game/challengeTemplates/cooperative.html';
                    break;
                }
                default:
                    return 'templates/game/challengeTemplates/default.html';
            }
        }


        Config.init().then(function () {
            $rootScope.title = Config.getAppName();
            // angular.extend($scope, {
            //     center: {
            //         lat: Config.getMapPosition().lat,
            //         lng: Config.getMapPosition().long,
            //         zoom: Config.getMapPosition().zoom
            //     },
            //     events: {}
            // });

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
            setChallenges();
            setChooseButton();
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
                            if ($rootScope.GPSAllow === true) {
                                updateTrackingInfo();
                            }
                            var listener = $rootScope.$watch('GPSAllow', function () {
                                if ($rootScope.GPSAllow === false) {
                                    trackService.cleanTracking();
                                    $scope.trackingIsOn = false;
                                    //check if it
                                    trackService.geolocationDisabledPopup();
                                    listener();
                                }
                            });
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
                if (transportType == 'bus') {
                    BT.needBTActivated(function (result) {
                        if (result) {
                            $ionicPopup.confirm({
                                title: $filter('translate')("pop_up_bt_title"),
                                template: $filter('translate')("pop_up_bt"),
                                buttons: [
                                    {
                                        text: $filter('translate')("btn_close"),
                                        type: 'button-cancel'
                                    },
                                    {
                                        text: $filter('translate')("pop_up_bt_button_enable"),
                                        type: 'button-custom',
                                        onTap: function () {
                                            bluetoothSerial.enable();
                                        }
                                    }
                                ]
                            });
                        }
                    });
                }
            }, function (errorCode) {
                $scope.trackingIsOn = false;
                trackService.geolocationPopup();
            }).finally(Config.loaded());
        }



        $scope.track = function (transportType) {
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
        $scope.trackAndMap = function (transportType) {
            //init multimodal id used for db 
            $scope.startTracking(transportType);
            $state.go('app.mapTracking');

        }
        $scope.stopTrackingHome = function () {
            $scope.trackingIsOn = false;
            $scope.stopTracking();
        }

        $scope.startTracking = function (transportType) {
            if (!$rootScope.syncRunning) {
                $scope.localizationAlwaysAllowed().then(function (loc) {
                    if (!loc) {
                        $scope.showWarningPopUp();
                    } else {
                        // else {
                        $scope.isBatterySaveMode().then(function (saveMode) {
                            if (saveMode) {
                                $scope.showSaveBatteryPopUp($scope.track, transportType);
                            }
                            else {
                                $scope.track(transportType);
                            }
                        })
                    }
                })
            }
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
            tutorial.showTutorial('main', 'main', 5, $scope);
        }
        $scope.expand = function (index) {
            $scope.expansion[index] = !$scope.expansion[index];
        }
        $scope.isExpanded = function (index) {
            return $scope.expansion[index]
        }
        $scope.getWidthUser = function (challenge) {
            //TODO
            // if (challenge.type == 'coop')
            //     return "width:30%;"
            // return "width:60%;"
            return "width:" + challenge.status + "%;"

        }
        $scope.getWidthOther = function (challenge) {
            //TODO
            if (challenge.type == 'coop')
                return "width:40%;;"
            return "width:40%;"
        }
        $scope.getWidthSeparator = function (challenge) {
            //TODO

            return "width:30%;background:transparent;"
        }
        $scope.getValueUser = function (challenge) {
            //TODO
            // usa status ma verifica challTarget
            // return challenge.status + $filter('translate')('user_points_label');
            return $filter('translate')('user_chall_status') + challenge.status + "%";
        }
        $scope.getValueOther = function (challenge) {
            //TODO
            return "5 " + $filter('translate')('user_points_label');
        }
    })
    .controller('HomeContainerCtrl', function ($scope, $rootScope, profileService, GameSrv, Config, Toast, $filter) {


        $rootScope.currentUser = null;
        $scope.noStatus = false;
        $rootScope.profileImg = null;
        $scope.tmpUrl = 'https://dev.smartcommunitylab.it/core.mobility/gamificationweb/player/avatar/' + Config.getAppId() + '/'
        Config.loading();
        GameSrv.getLocalStatus().then(
            function (status) {
                $scope.status = status;
                profileService.setProfileStatus(status);
                $rootScope.currentUser = status.playerData;
                $scope.getImage();

                // profileService.getProfileImage(status.playerData.playerId).then(function(urlImg){
                //     $rootScope.urlImg=urlImg;
                // })
            },
            function (err) {
                $scope.noStatus = true;
                Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
            }
        ).finally(Config.loaded);
        $scope.getImage = function () {
            if ($scope.status)
                profileService.getProfileImage($scope.status.playerData.playerId).then(function (image) {
                    // var file = new Blob([ image ], {
                    //     type : 'image/jpeg'
                    // });
                    // var fileURL = URL.createObjectURL(file);
                    // $scope.profileImg = fileURL;

                    // var img = document.getElementById( "#photo" );
                    // img.src = fileURL;
                    $rootScope.profileImg = $scope.tmpUrl + $scope.status.playerData.playerId + '?' + new Date().getTime();
                }, function (error) {
                    $rootScope.profileImg = 'img/game/generic_user.png' + '?' + new Date().getTime();
                })
        }

    })
    .controller('MobilityCtrl', function ($scope, $state, $ionicHistory, $location, bookmarkService) {

        bookmarkService.getBookmarksRT().then(function (list) {
            var homeList = [];
            list.forEach(function (e) {
                if (e.home) homeList.push(e);
            });
            $scope.primaryLinks = homeList; //Config.getPrimaryLinks();
        });
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
    })
