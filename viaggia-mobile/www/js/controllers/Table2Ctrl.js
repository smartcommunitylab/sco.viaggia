angular.module('viaggia.controllers.table2', ['ionic', 'ngcTableDirective'])

.controller('Table2Ctrl', function ($scope, $ionicScrollDelegate, $ionicSideMenuDelegate) {
    $scope.stops = [];
    $scope.courses = [];
    for (var k = 0; k < 50; k++) {
        $scope.stops.push("stop " + k);
    }
    for (var k = 0; k < 10; k++) {
        $scope.courses.push("courses " + k);
    }


    $scope.returnHeightStyle = function () {
        return "height:" + window.innerHeight + "px;"
    };
    $scope.toggleLeft = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };
    $scope.noMoreItemsAvailable = false;
    $scope.loadMore = function () {
        var delegate = $ionicScrollDelegate.$getByHandle('list');
        //delegate.rememberScrollPosition('list-id');
        for (var k = 0; k < 10; k++) {
            $scope.courses.push("courses " + $scope.courses.length);
        }

        if ($scope.courses.length > 50) {

            $scope.noMoreItemsAvailable = true;
        }
        $scope.$broadcast('scroll.infiniteScrollComplete');
        $ionicScrollDelegate.resize();
    }

    var adjusting = false;
    var fromScroll = 0;
    $scope.runningHandle = null;

    $scope.scrollMirror = function (from, to1, to2) {

        //        if (adjusting) {
        //            adjusting = false;
        //        } else {
        if ($scope.runningHandle == null || $scope.runningHandle == from) {
            $scope.runningHandle = from;

            //move to the same places butif movement is vertical (column) don't move horizzontal and viceversa
            if (from == 'column') {
                $ionicScrollDelegate.$getByHandle(to1).scrollTo($ionicScrollDelegate.$getByHandle(to1).getScrollPosition().left, $ionicScrollDelegate.$getByHandle(from).getScrollPosition().top, false);
            } else if (from == 'head') {
                $ionicScrollDelegate.$getByHandle(to1).scrollTo($ionicScrollDelegate.$getByHandle(from).getScrollPosition().left, $ionicScrollDelegate.$getByHandle(to1).getScrollPosition().top, false);
            } else {
                $ionicScrollDelegate.$getByHandle(to1).scrollTo($ionicScrollDelegate.$getByHandle(from).getScrollPosition().left, $ionicScrollDelegate.$getByHandle(from).getScrollPosition().top, false);
            }
            if (to2) {
                $ionicScrollDelegate.$getByHandle(to2).scrollTo($ionicScrollDelegate.$getByHandle(from).getScrollPosition().left, $ionicScrollDelegate.$getByHandle(from).getScrollPosition().top, false);
            }
        }


        //            adjusting = true;
        //        }
    }
    $scope.releaseTouch = function () {
        $scope.runningHandle = null;
    }
});
