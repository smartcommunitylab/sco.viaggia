angular.module('viaggia.controllers.profile', [])

    .controller('ProfileCtrl', function ($scope,Config,GameSrv,Toast) {
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
