angular.module('viaggia.controllers.game', [])

    .controller('GameCtrl', function ($scope, GameSrv, Config, Toast, $filter) {
        $scope.currentUser = null;
        $scope.status = null;
        $scope.ranking = null;
       // $scope.statistics = null
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
                        $scope.currentUser = ranking['actualUser'];
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
        //	$scope.$on('$stateChangeSuccess', function () {
        //	});
    })

    .controller('PointsCtrl', function ($scope) {
        // green leaves: Green Leaves
        // bike aficionado: Bike Trip Badge
        // sustainable life: Zero Impact Badge
        // public transport aficionado: Public Transport Badge
        // park and ride pioneer: Park And Ride Badge
        // recommendations: User Recommendation Badge
        // leaderboard top 3: Leaderboard Top 3 Badge

        $scope.badges = null;
        $scope.badgeTypes = ['green leaves', 'bike aficionado', 'sustainable life', 'public transport aficionado', 'bike sharing pioneer', 'park and ride pioneer', 'recommendations', 'leaderboard top 3'];

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
    })

    .controller('ChallengesCtrl', function ($scope, $http, $filter, $ionicScrollDelegate, $ionicPopup, $window, $timeout) {
        $scope.challenges = null;

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
        $scope.filter.selected = !$scope.filter.selected ? $scope.filter.options[0] : $scope.filter.selected;

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
    })
    .controller('GameMenuCtrl', function ($scope, GameSrv) {
        //$scope.title="Play&Go";
        $scope.init = function () {
            GameSrv.getLocalStatus().then(
                function (status) {
                    $scope.title = status.playerData.nickName
                });
        }

        $scope.init();

    })
    .controller('StatisticsCtrl', function ($scope, $ionicScrollDelegate, $window, $filter,$timeout,Toast, Config,GameSrv, $ionicLoading, $timeout) {
        $scope.stats = [];
        //$scope.statistics = []
        //$scope.maxStat = 0;
        $scope.maybeMore = true;
        var getStatistics = false;
        $scope.statsPerPage =5;
        $scope.singleStatStatus = true;
        $scope.status = null;
        $scope.noStatus = false;


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
        $scope.filter.filter = function (selection){
            $scope.showLoading = function() {
                $ionicLoading.show({
                content: 'Loading',
                animation: 'fade-in',
                showBackdrop: true,
                showDelay: 0
                });
            };
            $scope.showLoading()
            $scope.calculateMaxStats()
            $scope.maybeMore = true;
            $scope.singleStatStatus = true;
            $scope.stats=[];
            $ionicScrollDelegate.$getByHandle('statisticScroll').scrollTop();
            $scope.init()
            Config.loaded();
        }

        //
        //

        var generateRankingStyle = function () {
            // header 44, tabs 49, filter 44, listheader 44, my ranking 48
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
        $scope.calculateMaxStats = function (stats) {
            GameSrv.getMaxStat($scope.filter.selected).then(function (MaxStats){
            $scope.maxStat = MaxStats
            })}

       $scope.getStyle= function(stat, veichle) {
           $scope.previousStat = null;
           var maxvalues= {
                maxDailywalk : 10,
                maxDailybike : 20,
                maxDailytransit : 50,
                maxDailycar: 50,
                maxWeeklywalk: 70,
                maxWeeklybike: 140,
                maxWeeklytransit: 300,
                maxWeeklycar: 300,
                maxMonthlywalk: 280,
                maxMonthlybike: 560,
                maxMonthlytransit: 1200,
                maxMonthlycar: 1200,
                maxTotalwalk: 840,
                maxTotalbike: 1680,
                maxTotaltransit: 3600,
                maxTotalcar: 3600,
           }

        if((83*stat)/$scope.maxStat[0]["max"+veichle]<8.8 && veichle == 'transit'){
            return "width:"+(8.8)+"%"
        } else if((83*stat)/$scope.maxStat[0]["max"+veichle]<4.5) {
            return "width:"+(4.5)+"%"
        } else if ($scope.maxStat[0]["max"+veichle] < maxvalues["max"+$scope.filter.selected+veichle]) {
            return "width:"+((83*stat)/$scope.maxStat[0]["max"+veichle])+"%"
        } else {
            return "width:"+(83)+"%"
        }}

//            if ($scope.maxStat[0]["max"+veichle] < maxvalues["max"+$scope.filter.selected+veichle]) {
//            return "width:"+((83*stat)/$scope.maxStat[0]["max"+veichle])+"%"
//        } else {
//            return "width:"+(83)+"%"
//        }}

         GameSrv.getLocalStatus().then(
            function (status) {
                $scope.status = status;
                $scope.noStatus = false;
                    },
            function (err) {
                $scope.noStatus = true;
                Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
            })
        //).finally(Config.loaded);

            $scope.loadMore = function () {
                if (!getStatistics) {
                    getStatistics = true;
                    $scope.findbefore()
                    //var x = 1475186400000 - $scope.valbefore;
                    var temporanea = $scope.previousStat
                        var x = temporanea - $scope.valbefore;
                        var from = x;
                        var to =  $scope.stats != null ? $scope.nextStat : new Date().getTime();
                     GameSrv.getStatistics($scope.filter.selected, from, to).then(
                         function (statistics) {
                         $scope.stats = $scope.stats.concat(statistics.stats);
                             temporanea = temporanea - $scope.valbefore;
                            $scope.calculateMaxStats($scope.stats);
                          if (statistics.stats.length < $scope.statsPerPage) {
                            $scope.maybeMore = false;
                            }
                            $scope.$broadcast('scroll.infiniteScrollComplete');
                            $scope.singleStatStatus = true;
                            Config.loaded();
                            getStatistics = false;
                            },
                         function (err) {
                            $scope.maybeMore = true;
                            Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
                            $scope.$broadcast('scroll.infiniteScrollComplete');
                            getStatistics = false;
                            $scope.singleStatStatus = false;
                            }
                        );
                }
              };
    $scope.valbefore = 0
    $scope.findbefore = function () {
            if ($scope.filter.selected == "Daily") {
                $scope.valbefore = 604800000
            }
            if ($scope.filter.selected == "Weekly") {
                $scope.valbefore = 2592000000
            }
            if ($scope.filter.selected == "Monthly") {
                $scope.valbefore = 31104000000
            }
            if ($scope.filter.selected == "Total") {
                $scope.valbefore = new Date().getTime()
            }
        }
        $scope.init = function () {
            $scope.findbefore();
            var x = new Date().getTime() - $scope.valbefore;
          //GameSrv.getStatistics($scope.filter.selected,  x, new Date().getTime()).then(function (statistics) {
            GameSrv.getStatistics($scope.filter.selected,  x, new Date().getTime()).then(function (statistics) {
            $scope.singleStatStatus = true;
            $scope.stats = statistics.stats;
            $scope.previousStat = statistics.firstBefore;
            $scope.nextStat = statistics.firstAfter;
            $scope.calculateMaxStats($scope.stats);
        }, function(err){
                $scope.stats = [];
                Toast.show($filter('translate')("pop_up_error_server_template"), "short", "bottom");
                $scope.$broadcast('scroll.infiniteScrollComplete');
                getStatistics = false;
                $scope.singleStatStatus = false;
           });
            generateRankingStyle();
        }
        $scope.init();

        })

    .controller('DiaryCtrl', function ($scope, GameSrv, $ionicScrollDelegate,) {
        $scope.singleDiaryStatus = true;
        $scope.messages = [];
        var getDiary = false;


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

        $scope.filter.options = ['badge', 'challenge', 'trip', 'ranking', 'allnotifications'];
        $scope.filter.selected = !$scope.filter.selected ? $scope.filter.options[0] : $scope.filter.selected;
        $scope.filter.filter = function (selection){
        }

        $scope.init = function () {
            var x = new Date().getTime() - 2592000000;
            GameSrv.getDiary($scope.filter.selected,  x, new Date().getTime()).then(function (notifications) {
            $scope.singleDiaryStatus = true;
            $scope.messages = notifications;
           });
        }
        $scope.init();
    })

    .controller('RankingsCtrl', function ($scope, $ionicScrollDelegate, $window, $timeout, Config, GameSrv, Toast, $filter, $ionicPosition) {
        $scope.maybeMore = true;
        $scope.currentUser = {};
        $scope.ranking = [];
        $scope.singleRankStatus = true;
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
            $scope.maybeMore = true;
            $scope.singleRankStatus = true;
            Config.loading();
            GameSrv.getRanking(selection, 0, $scope.rankingPerPage).then(
                function (ranking) {
                    $scope.singleRankStatus = true;
                    $scope.currentUser = ranking['actualUser'];
                    $scope.ranking = ranking['classificationList'];
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                    Config.loaded();
                }

            );
        };

        //$scope.filter.filter($scope.filter.selected);

        /* Infinite scrolling */
        $scope.loadMore = function () {
            if (!getRanking) {
                getRanking = true;
                var start = $scope.ranking != null ? $scope.ranking.length : 0;
                var end = start + $scope.rankingPerPage;
                GameSrv.getRanking($scope.filter.selected, start, end).then(
                    function (ranking) {
                        $scope.currentUser = ranking['actualUser'];
                        $scope.ranking = $scope.ranking.concat(ranking['classificationList']);

                        if (ranking['classificationList'].length < $scope.rankingPerPage) {
                            $scope.maybeMore = false;
                        }

                        $scope.$broadcast('scroll.infiniteScrollComplete');
                        getRanking = false;
                        $scope.singleRankStatus = true;
                    },
                    function (err) {
                        $scope.maybeMore = true;
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
