angular.module('viaggia.controllers.news', [])

.controller('NewsCtrl', function ($scope, $state, $ionicLoading, $filter, Toast, feedService, Config) {
  $scope.news = null;

  var FEED_URL = Config.getRSSUrl();
  var APP_ID = Config.getAppId();
  //get the news elements
  $ionicLoading.show();
  feedService.load(FEED_URL, APP_ID).then(function (entries) {
    entries.forEach(function (entry) {
      entry.dateTime = new Date(entry.pubDate);
    });
    $scope.news = entries;
    $ionicLoading.hide();
  }, function (err) {
    $ionicLoading.hide();
    Toast.show($filter('translate')('toast_error_server_template'), "short", "bottom");
  });

  $scope.doRefresh = function () {
    feedService.load(FEED_URL, APP_ID, true).then(function (entries) {
      entries.forEach(function (entry) {
        entry.dateTime = new Date(entry.pubDate);
      });
      $scope.news = entries;
      $scope.$broadcast('scroll.refreshComplete');
    }, function (err) {
      $scope.$broadcast('scroll.refreshComplete');
      Toast.show($filter('translate')('toast_error_server_template'), "short", "bottom");
    });
  };
  //go to news details
  $scope.showNews = function (idx) {
    $state.go("app.newsitem", {
      id: idx
    });
  }

})

.controller('NewsItemCtrl', function ($scope, $stateParams, $rootScope, feedService, Config) {
  var FEED_URL = Config.getRSSUrl();
  var APP_ID = Config.getAppId();

  $scope.newsItem = null;
  $scope.idx = $stateParams.id;
  feedService.getByIdx($scope.idx, FEED_URL, APP_ID).then(function (data) {
    $scope.newsItem = data;
    $scope.newsItem.dateTime = new Date($scope.newsItem.pubDate);
  });

  $scope.clickLink = function (link) {
    window.open(link, '_system', 'location=yes')
  }
})
