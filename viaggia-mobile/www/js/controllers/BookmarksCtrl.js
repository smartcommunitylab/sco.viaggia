angular.module('viaggia.controllers.bookmarks', [])

    .controller('BookmarksCtrl', function ($scope, $location, $filter, $ionicHistory, $timeout, $ionicModal, $ionicListDelegate, Config, bookmarkService, tutorial) {

        var init = function () {
            Config.init().then(function () {
                bookmarkService.getBookmarks().then(function (list) {
                    $scope.bookmarks = list;
                });
            });
        };

        $scope.$on('ngLastRepeat.bookmarks', function (e) {
            $timeout(function () {
                ionicMaterialMotion.ripple();
                ionicMaterialInk.displayEffect()
            }); // No timeout delay necessary.
        });

        $scope.delete = function (idx, $event) {
            $scope.deleting = true;
            Config.loading();
            $event.preventDefault();
            bookmarkService.removeBookmark(idx).then(function (list) {
                $scope.bookmarks = list;
                $ionicHistory.clearCache();
                $ionicListDelegate.closeOptionButtons();
                Config.loaded();
            });
        };
        $scope.toggleHome = function (idx) {
            Config.loading();
            bookmarkService.toggleHome(idx).then(function (list) {
                $scope.bookmarks = list;
                $ionicHistory.clearCache();
                Config.loaded();
            });
        };
        $scope.reorder = function (from, to) {
            Config.loading();
            bookmarkService.reorderBookmark(from, to).then(function (list) {
                $scope.bookmarks = list;
                $ionicHistory.clearCache();
                Config.loaded();
            });
        };

        $scope.toggleReorder = function () {
            $scope.showReorder = !$scope.showReorder;
        }

        $scope.go = function (state) {
            if ($scope.deleting) {
                $scope.deleting = false;
            } else {
                if (state.startsWith("/app/")) {
                    $location.path(state);
                }
                else {
                    //get name
                    var name = state.substr(0, state.indexOf('('));
                    //getArguments
                    var arguments = [];
                    if (state.lastIndexOf("(") + 1 != state.lastIndexOf(")")) {
                        arguments=state.split(/[()]/)[1];
                        arguments = arguments.split(',');
                    }
                    ($scope[name])(arguments);
                }
            }
        }

        $scope.forceTutorial = function () {
            tutorial.showTutorial('bookmarks', 'bookmarks', 2, $scope, true);
        }
        $scope.showTutorial = function () {
            tutorial.showTutorial('bookmarks', 'bookmarks', 2, $scope);
        }

        init();
    })
