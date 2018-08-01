angular.module('viaggia.controllers.game', [])




    //The main game Menu
    .controller('GameMenuCtrl', function ($scope, $state, $ionicHistory, GameSrv) {
        //$scope.title="Play&Go";
        $scope.init = function () {
            GameSrv.getLocalStatus().then(
                function (status) {
                    $scope.title = status.playerData.nickName
                });
        }
        $scope.init();

        //the back button is managed with this function
        $scope.goHome = function () {
            $state.go('app.home');
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
        }

    })


    //Container of the tabs, load data of the game: username, ranking, ...
    .controller('GameCtrl', function ($scope, $rootScope, GameSrv, Config, Toast, $timeout, $filter) {

        $rootScope.currentUser = null;
        $scope.status = null;
        $scope.ranking = null;
        $scope.prize = null;
        $scope.noStatus = false;
        $scope.rankingFilterOptions = ['now', 'last', 'global'];
        $scope.rankingPerPage = 50;

        Config.loading();
        GameSrv.getLocalStatus().then(
            function (status) {
                $scope.status = status;
                GameSrv.getRanking($scope.rankingFilterOptions[0], 0, $scope.rankingPerPage).then(
                    function (ranking) {
                        $rootScope.currentUser = ranking['actualUser'];
                        $scope.ranking = ranking['classificationList'];
                        $scope.$broadcast('scroll.infiniteScrollComplete');
                        $scope.noStatus = false;
                    }
                );
            },
            function (err) {
                $scope.noStatus = true;
                Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
            }
        ).finally(Config.loaded);
    })


    //loads the score tab and all the badges of the user
    .controller('PointsCtrl', function ($scope, $rootScope, Config, profileService, $ionicPopup, $filter) {
        // green leaves: Green Leaves
        // bike aficionado: Bike Trip Badge
        // sustainable life: Zero Impact Badge
        // public transport aficionado: Public Transport Badge
        // park and ride pioneer: Park And Ride Badge
        // recommendations: User Recommendation Badge
        // leaderboard top 3: Leaderboard Top 3 Badge

        $scope.badges = null;
        $scope.badgeTypes = Config.getBadgeTypes();
        // $rootScope.profileImg = null;
        $scope.tmpUrl = 'https://dev.smartcommunitylab.it/core.mobility/gamificationweb/player/avatar/'
        $scope.getImage = function () {
            if ($scope.$parent.$parent.$parent.status)
                profileService.getProfileImage($scope.$parent.$parent.$parent.status.playerData.playerId).then(function (image) {
                    // var file = new Blob([ image ], {
                    //     type : 'image/jpeg'
                    // });
                    // var fileURL = URL.createObjectURL(file);
                    // $scope.profileImg = fileURL;

                    // var img = document.getElementById( "#photo" );
                    // img.src = fileURL;
                    $rootScope.profileImg = $scope.tmpUrl + $scope.$parent.$parent.$parent.status.playerData.playerId + '?' + new Date().getTime();
                    // $scope.refreshProfileImage();
                }, function (error) {
                    $rootScope.profileImg = 'img/game/generic_user.png' + '?' + new Date().getTime();;
                })
        }

        $scope.changeProfile = function () {
            $ionicPopup.confirm({
                title: $filter('translate')("change_image_title"),
                template: $filter('translate')("change_image_template"),
                buttons: [
                    {
                        text: $filter('translate')("btn_close"),
                        type: 'button-cancel'
                    },
                    {
                        text: $filter('translate')("change_image_confirm"),
                        type: 'button-custom',
                        onTap: function () {
                            document.getElementById('inputImg').click()
                        }
                    }
                ]
            });
        }
        $scope.uploadFile = function (files) {
            profileService.setProfileImage(files[0]).then(function () {
                console.log("ok");
                $scope.getImage();
            }, function (error) {
                if (error == 413)
                    console.log("Payload too large");
                return;
                if (error == 415)
                    console.log("Unsupported media type");
                return;
                console.log("network error");
            })

        };
        $scope.$watch('status.badgeCollectionConcept', function (newBadges, oldBadges) {
            var badges = {};
            if (!!$scope.status) {
                angular.forEach($scope.badgeTypes, function (badgeType) {
                    for (var i = 0; i < $scope.status['badgeCollectionConcept'].length; i++) {
                        if ($scope.status['badgeCollectionConcept'][i].name === badgeType) {
                            badges[badgeType] = $scope.status['badgeCollectionConcept'][i]['badgeEarned'];
                        }
                    }
                });
            }
            $scope.badges = badges;
        });
        $scope.$watch('$parent.$parent.$parent.status', function (newBadges, oldBadges) {
            $scope.getImage();
        });
    })



    //loads the challenges tab, manage the filter of past and new challenges

    .controller('ChallengesCtrl', function ($scope, $http, $stateParams, $filter, $ionicScrollDelegate, $ionicPopup, $window, $timeout) {
        $scope.challenges = null;
        $scope.param = null;
        $scope.filter = {
            open: false,
            toggle: function () {
                this.open = !this.open;
                $ionicScrollDelegate.resize();
            },
            filterBy: function (selection) {
                if (this.selected !== selection) {
                    this.selected = selection;
                    this.filter(this.selected);
                }
                this.toggle();
            },
            update: function () {
                this.filter(this.selected);
            },
            filter: function (selection) { },
            options: [],
            selected: null
        };

        $scope.filter.options = ['active', 'old'];
        var paramOptions = $stateParams.challengeEnd;
        var now = new Date().getTime();
        $scope.filter.selected = !$scope.filter.selected ? $scope.filter.options[0] : $scope.filter.selected;
        if (paramOptions && paramOptions < now) {
            $scope.filter.selected = $scope.filter.options[1];
        }
        $scope.filter.filter = function (selection) {
            if (!!$scope.status && !!$scope.status['challengeConcept'] && (selection === 'active' || selection === 'old')) {
                if ($scope.status) {
                    $scope.challenges = $scope.status['challengeConcept'][selection + 'ChallengeData'];
                    if (!$scope.challenges) $scope.challenges = [];
                } else {
                    $scope.challenges = null;
                }
            }
        };

        $scope.$watch('status.challengeConcept', function (newChallenges, oldChallenges) {
            $scope.filter.update();
        });

        $scope.showChallengeInfo = function (challenge) {
            // FIXME temporarly not null
            if (!challenge) {
                challenge = {
                    challCompleteDesc: 'Lorem ipsum dolor sic amet'
                };
            }

            var infoPopup = $ionicPopup.alert({
                title: $filter('translate')('game_tab_challenges_info'),
                subTitle: '',
                cssClass: '',
                template: challenge.challCompleteDesc,
                okText: $filter('translate')('pop_up_close'),
                okType: ''
            });

            infoPopup.then(
                function () { }
            );
        };
        $scope.init = function () {
            $scope.param = $stateParams.challengeTypeParam;
            //set filter
            if ($scope.param) {
                $scope.filter.selected = $scope.param;
            }
        }
        /* Resize ion-scroll */
        $scope.challengesStyle = {};

        var generateChallengesStyle = function () {
            // header 44, tabs 49, filter 44, listheader 44, my ranking 48
            $scope.challengesStyle = {
                'height': window.innerHeight - (44 + 49 + 44) + 'px'
            };
            $ionicScrollDelegate.$getByHandle('challengesScroll').resize();
        };

        generateChallengesStyle();

        $window.onresize = function (event) {
            // Timeout required for our purpose
            $timeout(function () {
                generateChallengesStyle();
            }, 200);
        };

        $scope.init();
    })

    .controller('BlacklistCtrl', function ($scope, $ionicScrollDelegate, $window, $filter, $timeout, Toast, Config, GameSrv) {
        $scope.blacklist = [];
        $scope.noBlack = false;
        $scope.maybeMore = true;
        var getBlacklist = false;
        $scope.status = null;
        $scope.noStatus = false;
        $scope.from = 0
        $scope.to =10;


        var generateRankingStyle = function () {
            $scope.rankingStyle = {
                'height': window.innerHeight - (44 + 44) + 'px'
            };
            $ionicScrollDelegate.$getByHandle('statisticScroll').resize();
        };

        $window.onresize = function (event) {
            // Timeout required for our purpose
            $timeout(function () {
                generateRankingStyle();
            }, 200);
        };
    
        GameSrv.getLocalStatus().then(
            function (status) {
                $scope.status = status;
                $scope.noStatus = false;
            },
            function (err) {
                $scope.noStatus = true;
                Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
            })



        $scope.loadMore = function () {
            if (!getBlacklist) {
                getBlacklist = true;
                //TODO manage from and to
                GameSrv.getBlacklist($scope.from, $scope.to).then(
                    function (blacklist) {
                        $scope.blacklist = $scope.blacklist.concat(blacklist.stats);

                        $scope.calculateMaxStats();
                        $scope.$broadcast('scroll.infiniteScrollComplete');
                        Config.loaded();
                        getBlacklist = false;
                    },
                    function (err) {
                        $scope.maybeMore = false;
                        Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
                        $scope.$broadcast('scroll.infiniteScrollComplete');
                        getBlacklist = false;
                    }
                );
            }
        };
    })


    .controller('StatisticsCtrl', function ($scope, $ionicScrollDelegate, $window, $filter, $timeout, Toast, Config, GameSrv) {
        $scope.stats = [];
        $scope.noStats = false;
        $scope.maybeMore = true;
        var getStatistics = false;
        $scope.statsPerPage = 5;
        $scope.singleStatStatus = true;
        $scope.status = null;
        $scope.noStatus = false;
        $scope.serverhow = null
        $scope.previousStat = null;
        $scope.maxvalues = {
            maxDailywalk: 10000,
            maxDailybike: 20000,
            maxDailytransit: 50000,
            maxDailycar: 50000,
            maxWeeklywalk: 70000,
            maxWeeklybike: 140000,
            maxWeeklytransit: 300000,
            maxWeeklycar: 300000,
            maxMonthlywalk: 280000,
            maxMonthlybike: 560000,
            maxMonthlytransit: 1200000,
            maxMonthlycar: 1200000,
            maxTotalwalk: 840000,
            maxTotalbike: 1680000,
            maxTotaltransit: 3600000,
            maxTotalcar: 3600000,
        }
        $scope.filter = {
            open: false,
            toggle: function () {
                this.open = !this.open;
                $ionicScrollDelegate.resize();
            },
            filterBy: function (selection) {
                if (this.selected !== selection) {
                    this.selected = selection;
                    this.filter(this.selected);
                }
                this.toggle();
            },
            update: function () {
                this.filter(this.selected);
            },
            filter: function (selection) { },
            options: [],
            selected: null,
        };

        $scope.filter.options = ['Daily', 'Weekly', 'Monthly', 'Total'];
        $scope.filter.selected = !$scope.filter.selected ? $scope.filter.options[0] : $scope.filter.selected;
        $scope.filter.filter = function (selection) {
            $scope.previousStat = null;
            $scope.calculateMaxStats()
            $scope.serverhow = GameSrv.getServerHow($scope.filter.selected);
            $scope.maybeMore = true;
            $scope.singleStatStatus = true;
            $scope.stats = [];
            $ionicScrollDelegate.$getByHandle('statisticScroll').scrollTop();
            $scope.noStats = false;

        }

        $scope.getTitle = function (day) {
            dateFrom = new Date(day.from)
            dateTo = new Date(day.to)
            if ($scope.filter.selected == $scope.filter.options[0]) {
                // dateFrom = new Date(day.from);
                return dateFrom.toLocaleString(window.navigator.language, { weekday: 'long' }) + ' ' + $filter('date')(dateFrom, 'dd/MM');
            }
            if ($scope.filter.selected == $scope.filter.options[1]) {


                return $filter('date')(dateFrom, 'dd/MM/yyyy') + ' - ' + $filter('date')(dateTo, 'dd/MM/yyyy');
            }
            if ($scope.filter.selected == $scope.filter.options[2]) {
                return dateFrom.toLocaleString(window.navigator.language, { month: 'long' });
            }
            if ($scope.filter.selected == $scope.filter.options[3]) {
                return $filter('translate')('statistic_total_label');
            }
        }

        $scope.serverhow = GameSrv.getServerHow($scope.filter.selected);
        var generateRankingStyle = function () {
            $scope.rankingStyle = {
                'height': window.innerHeight - (44 + 44) + 'px'
            };
            $ionicScrollDelegate.$getByHandle('statisticScroll').resize();
        };

        $window.onresize = function (event) {
            // Timeout required for our purpose
            $timeout(function () {
                generateRankingStyle();
            }, 200);
        };
        $scope.calculateMaxStats = function () {
            $scope.maxStat = GameSrv.getMaxStat($scope.filter.selected);
            if ($scope.maxStat) {
                $scope.maximum = 0;
                Object.keys($scope.maxStat).map(function (objectKey, index) {
                    if (objectKey.startsWith("max ") && $scope.maxStat[objectKey] > $scope.maximum) {
                        $scope.maximum = $scope.maxStat[objectKey];
                    }
                });
            }
        }

        $scope.getStyle = function (stat, veichle) {
            if (veichle == 'transit') {
                $scope.maxStat["max " + veichle] = Math.max(($scope.maxStat["max bus"] || 0), ($scope.maxStat["max bike"] || 0), ($scope.maxStat["max train"] || 0), ($scope.maxStat["max transit"] || 0));
            }
            // if ((83 * stat) / $scope.maxStat["max " + veichle] < 8.8 && veichle == 'transit') {
            //     return { width: "8.8%" }
            // } else if ((83 * stat) / $scope.maxStat["max " + veichle] < 4.5) {
            //     return { width: + "4.5%" }
            // } else if ($scope.maxStat["max " + veichle] < $scope.maxvalues["max" + $scope.filter.selected + veichle] && stat < $scope.maxStat["max " + veichle]) {
            //     return { width: "" + ((83 * stat) / $scope.maxStat["max " + veichle]) + "%" }
            // } else {
            //     return { width: "83%" }
            // }

            if ($scope.maxStat && (75 * stat) / $scope.maximum < 10 && veichle == 'transit') {
                return { width: "10%" }
            } else if ($scope.maxStat && ((75 * stat) / $scope.maximum < 5)) {
                return { width: + "5%" }
            } else if ($scope.maxStat && stat < $scope.maxvalues["max" + $scope.filter.selected + veichle] && stat < $scope.maximum) {
                return { width: "" + ((75 * stat) / $scope.maximum) + "%" }
            } else {
                return { width: "75%" }
            }
        }



        GameSrv.getLocalStatus().then(
            function (status) {
                $scope.status = status;
                $scope.noStatus = false;
            },
            function (err) {
                $scope.noStatus = true;
                Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
            })


        var getTimeForStat = function (type) {
            var temporanea = ($scope.stats != null && $scope.previousStat != null) ? $scope.previousStat : new Date().getTime()
            var x = temporanea - $scope.valbefore;
            var from = new Date(x).setHours(0, 0, 0, 0);
            var to = ($scope.stats != null && $scope.previousStat != null) ? $scope.previousStat : new Date().getTime();
            to = new Date(to).setHours(23, 59, 59, 999);
            //force day from sat to friday if week
            if ($scope.filter.selected == 'Weekly') {
                var fromMoment = new moment(from);
                var toMoment = new moment(to);
                const dayINeedFrom = 6; // for Saturday                    
                const dayINeedTo = 5; // for Saturday                    
                if (fromMoment.isoWeekday() <= dayINeedFrom) {
                    from = fromMoment.isoWeekday(dayINeedFrom);
                } else {
                    from = fromMoment.add(1, 'weeks').isoWeekday(dayINeedFrom);
                }
                if (toMoment.isoWeekday() <= dayINeedTo) {
                    to = toMoment.isoWeekday(dayINeedTo);
                } else {
                    to = toMoment.add(1, 'weeks').isoWeekday(dayINeedTo);
                }
                from = from.valueOf();
                to = to.valueOf();
            }
            else if ($scope.filter.selected == 'Monthly') {
                var fromMoment = new moment(from).startOf('month');
                var toMoment = new moment(to).endOf('month');
                from = fromMoment.valueOf();
                to = toMoment.valueOf();

            }
            if (type == 'from')
                return from;
            return to
        }
        $scope.loadMore = function () {
            if (!getStatistics) {
                getStatistics = true;
                $scope.findbefore()
                from = getTimeForStat('from');
                to = getTimeForStat('to');
                GameSrv.getStatistics($scope.serverhow, from, to).then(
                    function (statistics) {
                        $scope.stats = $scope.stats.concat(statistics.stats);

                        $scope.calculateMaxStats();
                        $scope.$broadcast('scroll.infiniteScrollComplete');
                        $scope.singleStatStatus = true;
                        Config.loaded();
                        getStatistics = false;
                        $scope.singleStatStatus = true;
                        $scope.previousStat = statistics.firstBefore;
                        if (!$scope.previousStat) {
                            $scope.maybeMore = false;
                            if ($scope.stats.length == 0) {
                                $scope.noStats = true;
                            } else {
                                $scope.noStats = true;
                                //even if all the stats is 0 set no stats to true
                                for (var i = 0; i < $scope.stats.length; i++) {
                                    if ($scope.stats[i].data.walk && $scope.stats[i].data.walk != 0 || $scope.stats[i].data.bike && $scope.stats[i].data.bike != 0 || $scope.stats[i].data.car && $scope.stats[i].data.car != 0 || $scope.stats[i].data.transit && $scope.stats[i].data.transit != 0 || $scope.stats[i].data.bus && $scope.stats[i].data.bus != 0 || $scope.stats[i].data.train && $scope.stats[i].data.train != 0) {
                                        $scope.noStats = false;
                                        break;
                                    }
                                }
                            }
                        }
                        $scope.nextStat = statistics.firstAfter;
                    },
                    function (err) {
                        $scope.maybeMore = false;
                        Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
                        $scope.$broadcast('scroll.infiniteScrollComplete');
                        getStatistics = false;
                        $scope.singleStatStatus = true;
                    }
                );
            }
        };
        $scope.valbefore = 0
        $scope.findbefore = function () {
            //windows of data
            if ($scope.filter.selected == "Daily") {
                $scope.valbefore = 604800000 //one week
            }
            if ($scope.filter.selected == "Weekly") {
                $scope.valbefore = 2592000000 //one month
            }
            if ($scope.filter.selected == "Monthly") {
                $scope.valbefore = 31104000000 //one year
            }
            if ($scope.filter.selected == "Total") {
                $scope.valbefore = new Date().getTime()
            }
        }

        $scope.dayHasStat = function (day) {
            return (day.data.walk || day.data.transit || day.data.bike || day.data.car || day.data.bus);
        }
        GameSrv.getRemoteMaxStat().then(function () {
            $scope.findbefore();
            generateRankingStyle();
            // $scope.$apply();
        })
    })

    .controller('DiaryCtrl', function ($scope, $timeout, $state, $filter, GameSrv, $window, $ionicScrollDelegate, DiaryDbSrv, Toast, Config, trackService) {
        $scope.messages = [];
        // $scope.days=[];
        $scope.maybeMore = true;
        var getDiary = false;
        $scope.singleDiaryStatus = true;
        $scope.filter = {
            open: false,
            toggle: function () {
                this.open = !this.open;
                $ionicScrollDelegate.resize();
            },
            filterBy: function (selection) {
                if (this.selected !== selection) {
                    this.selected = selection;
                    this.filter(this.selected);
                }
                this.toggle();
            },
            update: function () {
                this.filter(this.selected);
            },
            filter: function (selection) { },
            options: [],
            selected: null,
        };

        $scope.filter.options = ['allnotifications', 'badge', 'challenge', 'trip', 'raccomandation'];
        $scope.filter.selected = !$scope.filter.selected ? $scope.filter.options[0] : $scope.filter.selected;
        $scope.filter.filter = function (selection) {
            Config.loading();
            $scope.maybeMore = true;
            $scope.singleDiaryStatus = true;
            $ionicScrollDelegate.$getByHandle('diaryScroll').scrollTop();
            $scope.init()
            Config.loaded();
        }

        $scope.manageOneEntry = function (notification, multimodal) {
            var time1 = notification.timestamp
            var time2 = $scope.days[$scope.days.length - 1].name
            var msg1 = new Date(time1).setHours(0, 0, 0, 0);
            var msg2 = new Date(time2).setHours(0, 0, 0, 0);
            if (multimodal) {
                notification = {
                    event: JSON.stringify(notification),
                    id: notification.clientId,
                    timestamp: notification.timestamp,
                    travelValidity: notification.travelValidity,
                    type: notification.type,
                    multimodal: true
                }
            }
            if (msg1 == msg2) {
                $scope.days[$scope.days.length - 1].messages.push(notification)
            } else {
                $scope.days.push({ name: notification.timestamp, messages: [notification] })
            }
        }
        $scope.groupDays = function (notifications) {
            if (notifications[0]) {
                if (!$scope.days) {
                    $scope.days = []
                }
                var event = JSON.parse(notifications[0].event);
                if (notifications[0].type == 'TRAVEL' && event.children && event.children.length > 1) {
                    $scope.days.push(
                        {
                            name: notifications[0].timestamp,
                            messages: []
                        })
                    event.children.sort(function (a, b) {
                        return b.timestamp - a.timestamp;
                    });
                    for (var childrenIndex = 0; childrenIndex < event.children.length; childrenIndex++) {
                        $scope.manageOneEntry(event.children[childrenIndex], true)
                    }
                } else {
                    $scope.days.push(
                        {
                            name: notifications[0].timestamp,
                            messages: [notifications[0]]
                        })
                }
                for (var j = 1; j < notifications.length; j++) {
                    event = JSON.parse(notifications[j].event);
                    if (notifications[j].type == 'TRAVEL' && event.children && event.children.length > 1) {
                        //oder from newest to oldest
                        event.children.sort(function (a, b) {
                            return b.timestamp - a.timestamp;
                        });
                        for (var childrenIndex = 0; childrenIndex < event.children.length; childrenIndex++) {
                            $scope.manageOneEntry(event.children[childrenIndex], true)
                        }
                    }
                    else {
                        $scope.manageOneEntry(notifications[j], false)
                    }
                }
            }
        }
        $scope.isTracking = function (message) {
            if (trackService.isThisTheJourney(message.id)) {
                return true;
            }
            return false;
        }
        $scope.loadMore = function () {
            if (!getDiary && $scope.maybeMore) {
                getDiary = true;
                // console.log("load done")
                if (!$scope.from) {
                    $scope.from = new Date().getTime();
                }
                var temporanea = ($scope.messages != null && $scope.messages.length > 0) ? $scope.messages[$scope.messages.length - 1].timestamp : $scope.from
                var x = temporanea - 2592000000;
                $scope.from = x;
                $scope.to = ($scope.days != null) ? $scope.days[$scope.days.length - 1].messages[$scope.days[$scope.days.length - 1].messages.length - 1].timestamp - 1 : new Date().getTime();
                //bisogna aggiornare scope.to all'ultimo messaggio `
                // if ($scope.messages[0]) {
                // var from = $scope.messages[0].timestamp - 2592000000;
                // var to = $scope.messages[0].timestamp-1;
                var filter = GameSrv.getDbType($scope.filter.selected)
                DiaryDbSrv.readEvents(filter, $scope.from, $scope.to).then(function (notifications) {
                    if (notifications == null || notifications.length == 0) {
                        $scope.maybeMore = false;
                    }
                    $scope.singleDiaryStatus = true;
                    $scope.groupDays(notifications);
                    $scope.messages = notifications;
                    if ($scope.from < Config.getTimeGameLimit()) {
                        $scope.maybeMore = false;
                    }
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                    $scope.singleDiaryStatus = true;
                    Config.loaded();
                    getDiary = false;
                },
                    function (err) {
                        $scope.maybeMore = false;
                        if (!$scope.message) {
                            $scope.days = [];
                        }
                        Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
                        $scope.$broadcast('scroll.infiniteScrollComplete');
                        $scope.singleDiaryStatus = true;
                        Config.loaded();
                        getDiary = false;
                    });
                // } else {
                //     $scope.$broadcast('scroll.infiniteScrollComplete');
                //     $scope.singleDiaryStatus = true;
                //     Config.loaded();
                //     getDiary = false;
                //     $scope.maybeMore = false;
                // }
                // });

            }
        };
        $scope.noDiary = function () {
            if (!$scope.days) { return false }
            else if ($scope.days.length == 0) {
                return true
            }
            return false

        }
        $scope.getStyleColor = function (message) {
            return GameSrv.getStyleColor(message);
        }
        $scope.getIcon = function (message) {
            return GameSrv.getIcon(message);
        }
        $scope.getString = function (message) {
            return GameSrv.getString(message);
        }
        $scope.getState = function (message) {
            return GameSrv.getState(message)
        }
        $scope.getParams = function (message) {
            return GameSrv.getParams(message);
        }
        $scope.openEventTripDetail = function (message) {
            if (JSON.parse(message.event).travelValidity != 'PENDING') {
                $state.go('app.tripDiary', {
                    message: message.event
                });
            }
            else {
                Toast.show($filter('translate')("travel_pending_state"), "short", "bottom");
            }
        }
        $scope.init = function () {
            if (!getDiary) {
                Config.loading();
                getDiary = true;
                // DiaryDbSrv.dbSetup().then(function () {
                var x = new Date().getTime() - 2592000000;
                var filter = GameSrv.getDbType($scope.filter.selected)
                // DiaryDbSrv.readEvents(filter, 1455800361943, 1476269822849).then(function (notifications) {
                DiaryDbSrv.readEvents(filter, x, new Date().getTime()).then(function (notifications) {
                    if (notifications == null || notifications.length == 0) {
                        $scope.maybeMore = false;
                    }
                    $scope.singleDiaryStatus = true;
                    $scope.days = []
                    $scope.groupDays(notifications)
                    $scope.messages = notifications;
                    getDiary = false;
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                    Config.loaded();
                }, function (err) {
                    $scope.days = null;
                    $scope.messages = [];
                    Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                    getDiary = false;
                    $scope.singleDiaryStatus = false;
                    $scope.maybeMore = false;
                    Config.loaded();
                });
                // })
            }
        }
        Config.loading();
        DiaryDbSrv.dbSetup().then(function () {
            $scope.init();
            Config.loaded();
        }, function (err) {
            Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
            Config.loaded();
        })
        /* Resize ion-scroll */
        $scope.rankingStyle = {};

        var generateRankingStyle = function () {
            // header 44, filter 44, 
            $scope.rankingStyle = {
                'height': window.innerHeight - (44 + 44) + 'px'
            };
            $ionicScrollDelegate.$getByHandle('rankingScroll').resize();
        };

        generateRankingStyle();

        $window.onresize = function (event) {
            // Timeout required for our purpose
            $timeout(function () {
                generateRankingStyle();
            }, 200);
        };

        $scope.openChallengeBoard = function (message) {
            //$scope.firstOpenPopup.close();
            //get end
            var end = (JSON.parse(message.event)).challengeEnd;
            $state.go('app.game.challenges', { challengeEnd: end });
        };

    })
    .controller('TripDiaryCtrl', function ($scope, $filter, $timeout, $stateParams, planService, mapService, GameSrv, $window, $ionicScrollDelegate, DiaryDbSrv, Toast, Config) {
        $scope.message = {};
        $scope.trip = {};
        $scope.maxOfMessage = 0;
        $scope.maxvalues = {
            maxDailywalk: 10000,
            maxDailybike: 20000,
            maxDailytransit: 50000,
            maxDailycar: 50000,
            maxWeeklywalk: 70000,
            maxWeeklybike: 140000,
            maxWeeklytransit: 300000,
            maxWeeklycar: 300000,
            maxMonthlywalk: 280000,
            maxMonthlybike: 560000,
            maxMonthlytransit: 1200000,
            maxMonthlycar: 1200000,
            maxTotalwalk: 840000,
            maxTotalbike: 1680000,
            maxTotaltransit: 3600000,
            maxTotalcar: 3600000,
        }
        $scope.$on('$ionicView.beforeEnter', function () {
            mapService.refresh('eventTripMapDetail');
        });


        $scope.initMap = function () {
            mapService.initMap('eventTripMapDetail', false).then(function () {
                console.log('map initialized');
            });
        };
        $scope.$on('$ionicView.afterEnter', function (e) {
            // Prevent destroying of leaflet
            $scope.initMap();
        });
        var fitBounds = function () {
            var boundsArray = [];
            for (var i = 0; i < $scope.pathMarkers.length; i++) {
                var bound = [$scope.pathMarkers[i].lat, $scope.pathMarkers[i].lng];
                boundsArray.push(bound);
            }
            for (var key in $scope.paths) {
                if ($scope.paths[key].latlngs) {
                    var bound = L.polyline($scope.paths[key].latlngs).getBounds();
                    boundsArray.push(bound);
                }
            }

            if (boundsArray.length > 0) {
                var bounds = L.latLngBounds(boundsArray);
                mapService.getMap('eventTripMapDetail').then(function (map) {
                    map.fitBounds(bounds);
                    Config.loaded();
                }, function (err) {
                    Config.loaded();
                });
            } else {
                Config.loaded();
            }
        }
        $scope.tripIsValid = function () {
            return ($scope.trip.validity == 'VALID');
        }

        $scope.calculateMaxStats = function (stats) {
            $scope.maxStat = GameSrv.getMaxStat("Daily");
        }
        $scope.getErrorMotivation = function () {
            $scope.errorMotivation = GameSrv.getError($scope.trip);
        }
        function isOnlyByCar(modes) {
            if (modes.length == 1 && modes[0] == 'car') { return true }
            return false
        }
        $scope.isErrorMessagePresent = function () {
            // if (!$scope.tripIsValid()&&($scope.message.travelEstimatedScore==0 && nn in macchina && distanza percorsa >250m: ))
            if (!$scope.tripIsValid() || ($scope.message.travelScore == 0 && !isOnlyByCar($scope.message.travelModes) && $scope.message.travelLength > 250)) {
                $scope.errorMessagePresent = true;
                return true
            }
            $scope.errorMessagePresent = false;
            return false
        }
        $scope.getStyle = function (stat, veichle) {
            //get max of message
            $scope.maxOfMessage = Math.max(($scope.message.travelDistances.transit || 0), ($scope.message.travelDistances.bike || 0), ($scope.message.travelDistances.bus || 0), ($scope.message.travelDistances.train || 0), ($scope.message.travelDistances.walk || 0), ($scope.message.travelDistances.car || 0))
            if (veichle == 'transit') {
                stat = ($scope.message.travelDistances.transit || 0) + ($scope.message.travelDistances.bus || 0) + ($scope.message.travelDistances.train || 0);
                //     $scope.maxStat["max " + veichle] = Math.max(($scope.maxStat["max bus"]||0), ($scope.maxStat["max train"]||0), ($scope.maxStat["max transit"]||0));
            }

            if ($scope.maxStat && (83 * stat) / $scope.maxOfMessage < 8.8 && veichle == 'transit') {
                return "width:" + (8.8) + "%"
            } else if ($scope.maxStat && (83 * stat) / $scope.maxOfMessage < 4.5) {
                return "width:" + (4.5) + "%"
            } else if ($scope.maxStat && $scope.maxOfMessage < $scope.maxvalues["maxDaily" + veichle] && stat < $scope.maxOfMessage) {
                return "width:" + ((78 * stat) / $scope.maxOfMessage) + "%"
            } else {
                return "width:" + (78) + "%"
            }
        }
        $scope.init = function () {
            $scope.message = JSON.parse($stateParams.message);
            $scope.paths = {};
            $scope.pathMarkers = [];
            var currentlyLine = {};
            //get detailt of trip 
            Config.loading();
            GameSrv.getEventTripDeatil($scope.message.entityId).then(function (trip) {
                $scope.trip = trip;
                if ($scope.isErrorMessagePresent()) {
                    $scope.getErrorMotivation();
                }
                GameSrv.getRemoteMaxStat().then(function () {
                    $scope.calculateMaxStats();
                });
                if (trip.itinerary) {
                    //visualize itinerary planned
                    planService.setPlanConfigure(planService.buildConfigureOptions(trip.itinerary));
                    planService.process(trip.itinerary.data, trip.itinerary.originalFrom, trip.itinerary.originalTo);
                    $scope.paths = mapService.getTripPolyline(trip.itinerary.data);
                    $scope.pathMarkers = mapService.getTripPoints(trip.itinerary.data);
                    //visualize itinerary done
                } else {
                    Config.loaded();
                }

                //add real path
                if (trip.geolocationPolyline) {
                    currentlyLine = mapService.decodePolyline(trip.geolocationPolyline);
                }
                $scope.paths["p" + $scope.paths.length] = {
                    color: '#2975a7',
                    weight: 8,
                    latlngs: currentlyLine
                }
                angular.extend($scope, {
                    center: {
                        lat: Config.getMapPosition().lat,
                        lng: Config.getMapPosition().long,
                        zoom: Config.getMapPosition().zoom
                    },
                    markers: $scope.pathMarkers,
                    events: {},
                    paths: $scope.paths
                });
                // fit bounds
                fitBounds();


            }, function (err) {
                Config.loaded();
                Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");

            });

        }
        angular.extend($scope, {
            center: {
                lat: Config.getMapPosition().lat,
                lng: Config.getMapPosition().long,
                zoom: Config.getMapPosition().zoom
            },
            markers: {},
            events: {},
            paths: {}
        });
        $scope.init();
    }
    )
    .controller('RankingsCtrl', function ($scope, $rootScope, $state, $ionicScrollDelegate, $window, $timeout, Config, GameSrv, Toast, $filter, $ionicPosition) {
        $scope.maybeMore = true;
        $rootScope.currentUser = {};
        $scope.ranking = [];
        $scope.singleRankStatus = true;
        $scope.rankingFilterOptions = ['now', 'last', 'global'];
        var getRanking = false;
        $scope.filter = {
            open: false,
            toggle: function () {
                this.open = !this.open;
                $ionicScrollDelegate.resize();
            },
            filterBy: function (selection) {
                if (this.selected !== selection) {
                    this.selected = selection;
                    this.filter(this.selected);
                }
                this.toggle();
            },
            update: function () {
                this.filter(this.selected);
            },
            filter: function (selection) { },
            options: [],
            selected: null
        };

        $scope.filter.options = $scope.rankingFilterOptions;
        $scope.filter.selected = !$scope.filter.selected ? $scope.filter.options[0] : $scope.filter.selected;

        $scope.filter.filter = function (selection) {
            // reload using new selection
            getRanking = true;
            $scope.maybeMore = true;
            $scope.singleRankStatus = true;
            $scope.ranking = [];
            Config.loading();
            GameSrv.getRanking(selection, 0, $scope.rankingPerPage).then(
                function (ranking) {
                    if (ranking) {
                        getRanking = false;
                        $scope.singleRankStatus = true;
                        $rootScope.currentUser = ranking['actualUser'];
                        $scope.ranking = ranking['classificationList'];
                        if (!$scope.ranking || $scope.ranking.length < $scope.rankingPerPage) {
                            $scope.maybeMore = false;
                        }
                    } else {
                        $scope.maybeMore = false;
                        Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
                        $scope.$broadcast('scroll.infiniteScrollComplete');
                        getRanking = false;
                        if ($scope.ranking.length == 0) {
                            $scope.singleRankStatus = false;

                        }
                        //position to the last visible so No infinite scroll
                        if ($scope.ranking.length > 0) {
                            var visualizedElements = Math.ceil((window.innerHeight - (44 + 49 + 44 + 44 + 48)) / 40);
                            var lastelementPosition = $ionicPosition.position(angular.element(document.getElementById('position-' + ($scope.ranking.length - visualizedElements))));
                            $ionicScrollDelegate.scrollTo(lastelementPosition.left, lastelementPosition.top, true);
                        }
                    }
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                    Config.loaded();
                }

            );

        };

        /* Infinite scrolling */
        $scope.loadMore = function () {
            if (!getRanking && $scope.maybeMore) {
                getRanking = true;
                var start = $scope.ranking != null ? $scope.ranking.length + 1 : 0;
                var end = start + $scope.rankingPerPage;
                GameSrv.getRanking($scope.filter.selected, start, end).then(
                    function (ranking) {
                        if (ranking) {
                            $rootScope.currentUser = ranking['actualUser'];
                            $scope.ranking = $scope.ranking.concat(ranking['classificationList']);

                            if (ranking['classificationList'].length < $scope.rankingPerPage) {
                                $scope.maybeMore = false;
                            }

                            $scope.$broadcast('scroll.infiniteScrollComplete');
                            getRanking = false;
                            $scope.singleRankStatus = true;
                        }
                        else {
                            $scope.maybeMore = false;
                            Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
                            $scope.$broadcast('scroll.infiniteScrollComplete');
                            getRanking = false;
                            if ($scope.ranking && $scope.ranking.length == 0) {
                                $scope.singleRankStatus = false;

                            }
                        }
                    },
                    function (err) {
                        $scope.maybeMore = false;
                        Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
                        $scope.$broadcast('scroll.infiniteScrollComplete');
                        getRanking = false;
                        if ($scope.ranking.length == 0) {
                            $scope.singleRankStatus = false;

                        }
                        //position to the last visible so No infinite scroll
                        if ($scope.ranking.length > 0) {
                            var visualizedElements = Math.ceil((window.innerHeight - (44 + 49 + 44 + 44 + 48)) / 40);
                            var lastelementPosition = $ionicPosition.position(angular.element(document.getElementById('position-' + ($scope.ranking.length - visualizedElements))));
                            $ionicScrollDelegate.scrollTo(lastelementPosition.left, lastelementPosition.top, true);
                        }


                    }
                );
            } else {
                $scope.$broadcast('scroll.infiniteScrollComplete');
            }
        };

        /* Resize ion-scroll */
        $scope.rankingStyle = {};

        var generateRankingStyle = function () {
            // header 44, tabs 49, filter 44, listheader 44, my ranking 48
            $scope.rankingStyle = {
                'height': window.innerHeight - (44 + 49 + 44 + 44 + 48) + 'px'
            };
            $ionicScrollDelegate.$getByHandle('rankingScroll').resize();
        };

        generateRankingStyle();

        $window.onresize = function (event) {
            // Timeout required for our purpose
            $timeout(function () {
                generateRankingStyle();
            }, 200);
        };
    });
