angular.module('viaggia.controllers.profile', [])

    .controller('ProfileCtrl', function ($scope, $rootScope, Config, GameSrv, Toast) {
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
    .controller('ProfileOthersCtrl', function ($scope) {

    })
    .controller('ProfileOthersContainerCtrl', function ($scope, $filter, $stateParams, Config, GameSrv, $ionicScrollDelegate, Toast) {
        Config.loading();
        $scope.profileId = $stateParams.profileId
        $scope.user = null;
        $scope.badges = null;
        $scope.badgeTypes = Config.getBadgeTypes();
        $scope.maxStat = GameSrv.getMaxStat("Total");
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

        $scope.filter.options = ['Monthly', 'Total'];
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
        var updateBadges = function () {
            var badges = {};
            if (!!$scope.user) {
                angular.forEach($scope.badgeTypes, function (badgeType) {
                    for (var i = 0; i < $scope.user['badgeCollectionConcept'].length; i++) {
                        if ($scope.user['badgeCollectionConcept'][i].name === badgeType) {
                            badges[badgeType] = $scope.user['badgeCollectionConcept'][i]['badgeEarned'];
                        }
                    }
                });
            }
            $scope.badges = badges;
        }
        $scope.calculateMaxStats = function () {
            $scope.maxStat = GameSrv.getMaxStat("Total");
            if ($scope.maxStat) {
                $scope.maximum = 0;
                Object.keys($scope.maxStat).map(function (objectKey, index) {
                    if (objectKey.startsWith("max ") && $scope.maxStat[objectKey] > $scope.maximum) {
                        $scope.maximum = $scope.maxStat[objectKey];
                    }
                });
            }
        }
        GameSrv.getRemoteMaxStat().then(function () {
            $scope.calculateMaxStats();
        })
        GameSrv.getProfileOther($scope.profileId).then(
            function (profile) {
                $scope.user = profile
                updateBadges();

                //TODO real challenges and stiatistics
                // {"playerData":{"gameId":"596e1b00e4b0004279fc0736","level":"n00b","nickName":"Try","playerId":"140"},"pointConcept":[{"name":"green leaves","score":15,"periodType":"daily","start":1501106400000,"periodDuration":86400000,"periodIdentifier":"daily","instances":[{"score":15,"start":1522188000000,"end":1522274400000}]},{"name":"green leaves","score":15,"periodType":"weekly","start":1501106400000,"periodDuration":604800000,"periodIdentifier":"weekly","instances":[{"score":15,"start":1521673200000,"end":1522274400000}]}],"badgeCollectionConcept":[{"name":"public transport aficionado","badgeEarned":[]},{"name":"sustainable life","badgeEarned":[]},{"name":"recommendations","badgeEarned":[]},{"name":"leaderboard top 3","badgeEarned":[{"name":"1st_of_the_week","url":"https://dev.smartcommunitylab.it/core.mobility/img/mail/leaderboard/leaderboard1.png"}]},{"name":"bike aficionado","badgeEarned":[]},{"name":"park and ride pioneer","badgeEarned":[]},{"name":"bike sharing pioneer","badgeEarned":[]},{"name":"green leaves","badgeEarned":[]}],"challengeConcept":{"activeChallengeData":[],"oldChallengeData":[{"challId":"start_survey-1624ea3d21e-63568495","challDesc":"Fill out the start survey and gain a bonus of 100 green leaves points.","challCompleteDesc":"To win this challenge, complete the initial game questionnaire that you can access <a href='https://dev.smartcommunitylab.it/core.mobility/gamificationweb/survey/en/start/CnbSEzji02s7UKrI1flpV5KpBNtWiONw4T0ElIODy1g' target='_system'>here</a>.","challTarget":1,"status":0,"row_status":0.0,"type":"survey","active":false,"success":false,"startDate":1521737781790,"endDate":1522947381790,"daysToEnd":0,"bonus":100,"challCompletedDate":0},{"challId":"'initial_challenge_1624ea3d24c-63568495","challDesc":"Do at least 1 trip zero impact and you will get a bonus of 50 green leaves points.","challCompleteDesc":"Impact zero itineraries are those including only bike, bike sharing, and walking mode.","challTarget":1,"status":0,"row_status":0.0,"type":"absoluteIncrement","active":false,"success":false,"startDate":1521737781836,"endDate":1522947381836,"daysToEnd":0,"bonus":50,"challCompletedDate":0}]}}
                // TODO statistics
                // {"firstBefore":null,"firstAfter":null,"stats":[{"from":1416783600000,"to":1533592799000,"data":{"bus":3998.6265751776673}}]}

            },
            function (err) {
                Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
            }
        ).finally(Config.loaded);

        $scope.getStyle = function (stat, veichle) {
            if (veichle == 'transit') {
                $scope.maxStat["max " + veichle] = Math.max(($scope.maxStat["max bus"] || 0), ($scope.maxStat["max bike"] || 0), ($scope.maxStat["max train"] || 0), ($scope.maxStat["max transit"] || 0));
            }

            if ($scope.maxStat && (75 * stat) / $scope.maximum < 10 && veichle == 'transit') {
                return { width: "10%" }
            } else if ($scope.maxStat && ((75 * stat) / $scope.maximum < 5)) {
                return { width: + "5%" }
            } else if ($scope.maxStat && stat < $scope.maxvalues["maxTotal" + veichle] && stat < $scope.maximum) {
                return { width: "" + ((75 * stat) / $scope.maximum) + "%" }
            } else {
                return { width: "75%" }
            }
        }
    })
    .controller('ProfileOthersChallengesCtrl', function ($scope) {
    })
    .controller('ProfileOthersStatisticsCtrl', function ($scope) {
    })
