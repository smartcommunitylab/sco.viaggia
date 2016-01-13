angular.module('viaggia.controllers.bookmarks', [])

.controller('BookmarksCtrl', function ($scope, $location, $ionicHistory, $timeout, $ionicListDelegate, Config, bookmarkService) {

  $scope.showReorder = false;

  var init = function() {
    Config.init().then(function () {
      bookmarkService.getBookmarks().then(function(list) {
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

  $scope.delete = function(idx) {
    Config.loading();
    bookmarkService.removeBookmark(idx).then(function(list){
      $scope.bookmarks = list;
      $ionicHistory.clearCache();
      $ionicListDelegate.closeOptionButtons();
      Config.loaded();
    });
  };
  $scope.toggleHome = function(idx) {
    Config.loading();
    bookmarkService.toggleHome(idx).then(function(list){
      $scope.bookmarks = list;
      $ionicHistory.clearCache();
      Config.loaded();
    });
  };
  $scope.reorder = function(from, to) {
    Config.loading();
    bookmarkService.reorderBookmark(from, to).then(function(list){
      $scope.bookmarks = list;
      $ionicHistory.clearCache();
      Config.loaded();
    });
  };

  $scope.toggleReorder = function() {
    $scope.showReorder = !$scope.showReorder;
  }

  $scope.go = function (state) {
      $location.path(state);
  }


  init();
})
