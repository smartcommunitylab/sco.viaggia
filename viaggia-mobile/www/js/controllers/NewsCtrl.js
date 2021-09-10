angular.module('viaggia.controllers.news', [])

/*
Controller that manages the news from the feeds URL, download them and store
*/

.controller('NewsCtrl', function ($scope, $state, $ionicLoading, $filter, feedService, Config, Toast) {
  $scope.news = null;

  var FEED_URL = Config.getRSSUrl();
  var APP_ID = Config.getAppId();
  $ionicLoading.show();

  //get the news elements
  feedService.load(FEED_URL, APP_ID).then(function (entries) {
    entries.forEach(function (entry) {
      entry.dateTime = new Date(entry.pubDate);
    });
    $scope.news = entries;
    $ionicLoading.hide();
  }, function (err) {
    //tmp
    $scope.news = [];
    $ionicLoading.hide();
    Toast.show($filter('translate')('toast_error_server_template'), "short", "bottom");
  });

  //refresh the list scrolling down the list element.
  $scope.doRefresh = function () {
    feedService.load(FEED_URL, APP_ID, true).then(function (entries) {
      entries.forEach(function (entry) {
        entry.dateTime = new Date(entry.pubDate);
      });
      $scope.news = entries;
      $scope.$broadcast('scroll.refreshComplete');
    }, function (err) {
      //tmp
      $scope.news = [];
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

/*
Controller that show the news details
*/
.controller('NewsItemCtrl', function ($scope, $stateParams, $rootScope, feedService, Config) {
  var FEED_URL = Config.getRSSUrl();
  var APP_ID = Config.getAppId();

  $scope.newsItem = null;
  $scope.idx = $stateParams.id;
  feedService.getByIdx($scope.idx, FEED_URL, APP_ID).then(function (data) {
    $scope.newsItem = data;
    $scope.newsItem.dateTime = new Date($scope.newsItem.pubDate);
  });

  //open the news in a new browser page
  $scope.clickLink = function (link) {
    cordova.InAppBrowser.open(link, '_system', 'location=yes')
  }
})
