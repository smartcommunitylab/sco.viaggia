angular.module('viaggia.controllers.profile', [])

    .controller('ProfileCtrl', function ($scope, Config, GameSrv, Toast) {
        $scope.currentUser = null;
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

    })
    .controller('ProfileOthersCtrl', function ($scope, $filter, $stateParams, Config, GameSrv, Toast) {
        Config.loading();
        $scope.profileId = $stateParams.profileId
        $scope.user = null;
        $scope.badges = null;
        $scope.badgeTypes = Config.getBadgeTypes();
        $scope.maxStat = GameSrv.getMaxStat("Total");

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
        GameSrv.getProfileOther($scope.profileId).then(
            function (profile) {
                $scope.user = profile
                updateBadges();
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
            } else if ($scope.maxStat && stat < $scope.maxvalues["max" + $scope.filter.selected + veichle] && stat < $scope.maximum) {
                return { width: "" + ((75 * stat) / $scope.maximum) + "%" }
            } else {
                return { width: "75%" }
            }
        }
    })
