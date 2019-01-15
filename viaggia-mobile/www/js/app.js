var app = {

  // Application Constructor
  initialize: function () {
    this.bindEvents();
  },

  // Bind any events that are required.
  // Usually you should subscribe on 'deviceready' event to know, when you can start calling cordova modules
  bindEvents: function () {
    document.addEventListener('deviceready', this.onDeviceReady, false);
    document.addEventListener('onUpdateReady', this.onUpdateReady, false);
    document.addEventListener('nothingToUpdate', this.nothingToUpdate, false);
    document.addEventListener('hideLoad', this.hideLoad, false);
  },

  // deviceready Event Handler
  onDeviceReady: function () {
    console.log('Device is ready for work');
  },
  onUpdateReady: function () {
    console.log('Update is ready for installation');
    //loading
  },
  // chcp_updateIsReadyToInstall Event Handler
  nothingToUpdate: function () {
    console.log('Nothing to update');
  },
  hideLoad: function () {
    console.log('hide loading');
  }
};

app.initialize();

angular.module('ngIOS9UIWebViewPatch', ['ng']).config(['$provide', function ($provide) {
  'use strict';

  $provide.decorator('$browser', ['$delegate', '$window', function ($delegate, $window) {

    if (isIOS9UIWebView($window.navigator.userAgent)) {
      return applyIOS9Shim($delegate);
    }

    return $delegate;

    function isIOS9UIWebView(userAgent) {
      return /(iPhone|iPad|iPod).* OS 9_\d/.test(userAgent) && !/Version\/9\./.test(userAgent);
    }

    function applyIOS9Shim(browser) {
      var pendingLocationUrl = null;
      var originalUrlFn = browser.url;

      browser.url = function () {
        if (arguments.length) {
          pendingLocationUrl = arguments[0];
          return originalUrlFn.apply(browser, arguments);
        }

        return pendingLocationUrl || originalUrlFn.apply(browser, arguments);
      };

      window.addEventListener('popstate', clearPendingLocationUrl, false);
      window.addEventListener('hashchange', clearPendingLocationUrl, false);

      function clearPendingLocationUrl() {
        pendingLocationUrl = null;
      }

      return browser;
    }
  }]);
}]);

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('viaggia', [
  'ionic',
  'ngIOS9UIWebViewPatch',
  'ionic-material',
  'ng-mfb',
  'ionic-datepicker',
  'ionic-timepicker',
  'ngCordova',
  'ngSanitize',
  'ngcTableDirective',
  'nemLogging',
  'leaflet-directive',
  'pascalprecht.translate',
  //    'ng-walkthrough',
  'viaggia.controllers.common',
  'viaggia.controllers.timetable',
  'viaggia.controllers.markets',
  'viaggia.controllers.bookmarks',
  'viaggia.controllers.home',
  'viaggia.controllers.info',
  'viaggia.controllers.mytrips',
  'viaggia.controllers.monitoring',
  'viaggia.controllers.news',
  'viaggia.controllers.notifications',
  'viaggia.controllers.plan',
  'viaggia.controllers.taxi',
  'viaggia.controllers.planlist',
  'viaggia.controllers.tripdetails',
  'viaggia.controllers.game',
  'viaggia.controllers.mapTracking',
  'viaggia.controllers.login',
  'viaggia.controllers.registration',
  'viaggia.controllers.profile',
  'viaggia.services.data',
  'viaggia.services.conf',
  'viaggia.services.map',
  'viaggia.services.plan',
  'viaggia.services.timetable',
  'viaggia.services.markets',
  'viaggia.services.info',
  'viaggia.services.taxi',
  'viaggia.services.notification',
  'viaggia.directives',
  'viaggia.services.geo',
  'viaggia.services.bookmarks',
  'viaggia.services.tracking',
  'viaggia.services.registration',
  'viaggia.services.game',
  'viaggia.services.tutorial',
  'viaggia.services.diaryDb',
  'viaggia.filters',
  'viaggia.services.profile',
  'smartcommunitylab.services.login'
])

  .run(function ($ionicPlatform, $ionicLoading, $ionicPopup, $filter, $ionicHistory, $state, $cordovaFile, $q, $rootScope, $translate, trackService, DataManager, DiaryDbSrv, Config, GeoLocate, notificationService, LoginService) {

    $rootScope.locationWatchID = undefined;

    var geolocate = function () {
      var defer = $q.defer();
      GeoLocate.locate().then(
        function (position) {
          $rootScope.myPosition = position;
          defer.resolve();
        },
        function () {
          console.log('Geolocation not possible');
          defer.reject();
        }
      );
      return defer.promise;
    };

    var initAppUpdate = function () {
      document.addEventListener('chcp_updateIsReadyToInstall', onUpdateReady, false);
      document.addEventListener('chcp_nothingToUpdate', nothingToUpdate, false);
      document.addEventListener('chcp_updateInstalled', hideLoad, false);
      document.addEventListener('chcp_updateInstallFailed', hideLoad, false);
    }

    // chcp_updateIsReadyToInstall Event Handler
    var onUpdateReady = function () {
      console.log('Update is ready for installation');
      //loading
      // $ionicLoading.show();
    }
    // chcp_updateIsReadyToInstall Event Handler
    var nothingToUpdate = function () {
      console.log('Nothing to update');
    }
    var hideLoad = function () {
      console.log('hide loading');
      $ionicLoading.hide();
    }
    var resetCache = function () {
      localStorage.removeItem(Config.getAppId() + "_diaryRefresh") ;
      localStorage.removeItem(Config.getAppId() + "_challengesRefresh") ;
      localStorage.removeItem(Config.getAppId() + "_homeRefresh") ;
      localStorage.removeItem(Config.getAppId() + "_rankingRefresh") ;
    }
    $ionicPlatform.ready(function () { // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      document.addEventListener('chcp_updateLoadFailed', function () { console.log('chcp_updateLoadFailed') });
      document.addEventListener('chcp_updateInstallFailed', function () { console.log('chcp_updateInstallFailed') });
      document.addEventListener('chcp_assetsInstallationError', function () { console.log('chcp_assetsInstallationError') });
      document.addEventListener('chcp_updateIsReadyToInstall', onUpdateReady, false);
      document.addEventListener('chcp_nothingToUpdate', nothingToUpdate, false);
      document.addEventListener('chcp_updateInstalled', hideLoad, false);
      document.addEventListener('chcp_updateInstallFailed', hideLoad, false);
      function onUpdateReady() {
        console.log('Update is ready for installation');
        //loading
        //$ionicLoading.show();
      }
      // chcp_updateIsReadyToInstall Event Handler
      function nothingToUpdate() {
        console.log('Nothing to update');
      }
      function hideLoad() {
        console.log('hide loading');
        $ionicLoading.hide();
      }
      initAppUpdate();

      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }
      if (window.StatusBar) {
        StatusBar.overlaysWebView(true);            
        StatusBar.styleDefault();
      }
      //        GeoLocate.initLocalization().then(function () {
      Config.init().then(function () {
        LoginService.init({
          loginType: LoginService.LOGIN_TYPE.AAC,
          googleWebClientId: Config.getWebClientId(),
          clientId: Config.getClientId(),
          clientSecret: Config.getClientSecKey(),
          aacUrl: Config.getAACURL()
        });
        //reset cache
        resetCache();
        cordova.plugins.diagnostic.registerLocationStateChangeHandler(function (state) {
          if ((ionic.Platform.isAndroid() && state !== cordova.plugins.diagnostic.locationMode.LOCATION_OFF)
            || ionic.Platform.isIOS() && (state === cordova.plugins.diagnostic.permissionStatus.GRANTED
            )) {
            // alert("Perfetto");
          }
          else {
            var popup = document.getElementsByClassName("popup-container");
            if (popup.length == 0) {
              $ionicPopup.show({
                title: $filter('translate')("pop_up_always_GPS"),
                template: $filter('translate')("pop_up_always_GPS_template"),
                buttons: [
                  {
                    text: $filter('translate')("btn_close"),
                    type: 'button-cancel'
                  },
                  {
                    text: $filter('translate')("pop_up_always_GPS_go_on"),
                    type: 'button-custom',
                    onTap: function () {
                      if (device.platform == "iOS") {
                        cordova.plugins.diagnostic.switchToSettings();
                      }
                      else {
                        if (device.platform == "iOS") {
                          cordova.plugins.diagnostic.switchToSettings();
                        }
                        else {
                          cordova.plugins.diagnostic.switchToLocationSettings();
                        }
                      }
                    }
                  }
                ]
              });
            }
          }
        });
        if (ionic.Platform.isWebView()) {
          //we are on a phone so synch the database
          DataManager.dbSetup();
        } else {
          //we are on a website so synch only the stops
          DataManager.syncStopData();
        }
        notificationService.register();
      });
      //        }, function (err) {
      //            $rootScope.GPSAllow = false;
      //        });

      if (typeof navigator.globalization !== "undefined") {
        navigator.globalization.getPreferredLanguage(function (language) {
          $translate.use((language.value).split("-")[0]).then(function (data) {
            console.log("SUCCESS -> " + data);
          }, function (error) {
            console.log("ERROR -> " + error);
          });
        }, null);
      }
      $rootScope.platform = ionic.Platform;
      setTimeout(function () {
        if (!!navigator.splashscreen) {
          navigator.splashscreen.hide();
        }
      }, 1500);
      /* Geolocation init */
      $ionicPlatform.on('pause', function () {
        console.log('=== PAUSE ===');
        if (typeof $rootScope.locationWatchID != 'undefined') {
          GeoLocate.clearWatch();
          console.log('watchPosition cleared');
          GeoLocate.reset();
          console.log('geolocation reset');
        }
      });
      //   var localizationAlwaysAllowed = function () {
      //     var deferred = $q.defer();
      //     cordova.plugins.diagnostic.getLocationAuthorizationStatus(function (status) {
      //         switch (status) {
      //             case cordova.plugins.diagnostic.permissionStatus.NOT_REQUESTED:
      //                 console.log("Permission not requested");
      //                 deferred.resolve(true);
      //                 break;
      //             case cordova.plugins.diagnostic.permissionStatus.DENIED:
      //                 console.log("Permission denied");
      //                 deferred.resolve(false);

      //                 break;
      //             case cordova.plugins.diagnostic.permissionStatus.GRANTED:
      //                 console.log("Permission granted always");
      //                 deferred.resolve(true);

      //                 break;
      //             case cordova.plugins.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE:
      //                 console.log("Permission granted only when in use");
      //                 deferred.resolve(false);

      //                 break;
      //             case cordova.plugins.diagnostic.permissionStatus.DENIED_ALWAYS:
      //                 console.log("Permission permanently denied");
      //                 deferred.resolve(false);

      //                 break;
      //         }
      //     }, function (error) {
      //         console.error("The following error occurred: " + error);
      //         deferred.reject();

      //     });
      //     return deferred.promise;
      // }

      // var showWarningPopUp = function () {
      //     //show popup and
      //     $ionicPopup.show({
      //         title: $filter('translate')("pop_up_always_GPS"),
      //         template: $filter('translate')("pop_up_always_GPS_template"),
      //         buttons: [
      //             {
      //                 text: $filter('translate')("pop_up_always_GPS_go_on"),
      //                 type: 'button-custom',
      //                 onTap: function () {
      //                      cordova.plugins.diagnostic.switchToLocationSettings();
      //                 }
      //             }
      //         ]
      //     });

      // }

      $ionicPlatform.registerBackButtonAction(function () {
        if ($state.current.name === "app.home.leaderboards" || $state.current.name === "app.home.diary" || $state.current.name === "app.home.mobility") {
          $ionicHistory.nextViewOptions({
            disableBack: true,
            historyRoot: true
          });
          $state.go('app.home.home');
        }
        else if ($state.current.name === "app.home.hometrack") {
          navigator.app.exitApp();
        }
        else {

          $ionicHistory.goBack();
          //navigator.app.goBack();
        }
      }, 100);
      $ionicPlatform.on('resume', function () {
        console.log('+++ RESUME +++');
        // localizationAlwaysAllowed().then(function (loc){
        //   if (!loc) {
        //       showWarningPopUp();
        //   }})
        geolocate().then(function () {
          if (trackService.trackingIsGoingOn() && trackService.trackingIsFinished()) {
            trackService.stop();
          } else if (trackService.trackingIsGoingOn() && trackService.trackingIsFinished()) {

          }
        });
      });
    });
  })

  .config(function ($stateProvider, $compileProvider, $urlRouterProvider, $translateProvider, $ionicConfigProvider) {
    $ionicConfigProvider.views.swipeBackEnabled(false);
    $ionicConfigProvider.tabs.position('bottom');

    $stateProvider.state('app', {
      url: "/app",
      abstract: true,
      templateUrl: "templates/menu.html",
      controller: 'AppCtrl'
    })

      .state('app.login', {
        cache: false,
        url: "/login",
        views: {
          'menuContent': {
            templateUrl: "templates/login.html",
            controller: 'LoginCtrl'
          }
        }
      })

      .state('app.registration', {
        cache: false,
        url: "/registration",
        views: {
          'menuContent': {
            templateUrl: "templates/registrationForm.html",
            controller: 'RegistrationCtrl'
          }
        }
      })

      // .state('app.home', {
      //   cache: false,
      //   url: "/home",
      //   views: {
      //     'menuContent': {
      //       templateUrl: "templates/home.html",
      //       controller: 'HomeCtrl'
      //     }
      //   }
      // })
      .state('app.home', {
        cache: false,
        url: "/home",
        views: {
          'menuContent': {
            templateUrl: "templates/homeContainer.html",
            controller: 'HomeContainerCtrl'
          }
        }
      })

      // Each tab has its own nav history stack:

      .state('app.home.home', {
        cache: true,
        url: '/hometrack',
        views: {
          'tab-home': {
            templateUrl: 'templates/home.html',
            controller: 'HomeCtrl'
          }
        }
      })

      .state('app.home.diary', {
        cache: false,
        url: '/diary',
        params: {
          challengeEnd: null
        },
        views: {
          'tab-diary': {
            templateUrl: "templates/game/diary.html",
            controller: 'DiaryCtrl'
          }
        }
      })

      .state('app.home.leaderboards', {
        cache: true,
        url: '/leaderboards',
        views: {
          'tab-leaderboards': {
            templateUrl: 'templates/game/rankings.html',
            controller: 'RankingsCtrl'
          }
        }
      })
      .state('app.home.challenges', {
        cache: true,
        url: "/challenges",
        params: {
          challengeEnd: null,
          challengeStart:null,
          unlock:false
        },
        views: {
          'tab-challenges': {
            templateUrl: 'templates/game/challenges.html',
            controller: 'ChallengesCtrl'
          }
        }
      })
      .state('app.home.mobility', {
        cache: true,
        url: '/mobility',
        views: {
          'tab-mobility': {
            templateUrl: "templates/mobility.html",
            controller: 'MobilityCtrl'
          }
        }
      })
      .state('app.profile', {
        cache: false,
        url: "/profile",
        views: {
          'menuContent': {
            templateUrl: "templates/game/profile.html",
            controller: 'ProfileCtrl'
          }
        }
      })
      .state('app.profile.points', {
        cache: false,
        url: "/points",
        views: {
          'tab-points': {
            templateUrl: 'templates/game/points.html',
            controller: 'PointsCtrl'
          }
        }
      })

      .state('app.profile.blacklist', {
        cache: false,
        url: "/blacklist",
        views: {
          'tab-blacklist': {
            templateUrl: "templates/game/blacklist.html",
            controller: 'BlacklistCtrl'
          }
        }
      })
      .state('app.profile.statistics', {
        cache: false,
        url: "/statistics",
        views: {
          'tab-statistics': {
            templateUrl: "templates/game/statistics.html",
            controller: 'StatisticsCtrl'
          }
        }
      })
      .state('app.profileOthers', {
        cache: false,
        url: "/other",
        params: {
          profileId: null
        },
        views: {
          'menuContent': {
            templateUrl: "templates/game/profileOthersContainer.html",
            controller: 'ProfileOthersContainerCtrl'
          }
        }
      }).state('app.profileOthers.points', {
        cache: false,
        url: "/other-points",
        views: {
          'tab-other-points': {
            templateUrl: 'templates/game/profileOthers.html',
            controller: 'ProfileOthersCtrl'
          }
        }
      })
      .state('app.profileOthers.challenges', {
        cache: false,
        url: "/other-challenges",
        views: {
          'tab-other-challenges': {
            templateUrl: "templates/game/profileOthersChallenges.html",
            controller: 'ProfileOthersChallengesCtrl'
          }
        }
      })
      .state('app.profileOthers.statistics', {
        cache: false,
        url: "/other-stat",
        views: {
          'tab-other-stat': {
            templateUrl: "templates/game/profileOthersStatistics.html",
            controller: 'ProfileOthersStatisticsCtrl'
          }
        }
      })
      .state('app.plan', {
        cache: false,
        url: "/plan",
        params: {
          replan: false,
          tripId: null
        },
        views: {
          'menuContent': {
            templateUrl: "templates/plan.html",
            controller: 'PlanCtrl'
          }
        }
      })

      .state('app.planlist', {
        cache: false,
        url: "/planlist",
        params: {
          tripId: null
        },
        views: {
          'menuContent': {
            templateUrl: "templates/planlist.html",
            controller: 'PlanlistCtrl'
          }
        }
      })

      .state('app.monitoring', {
        cache: false,
        url: "/monitoring",
        views: {
          'menuContent': {
            templateUrl: "templates/monitoring.html",
            controller: 'MonitoringCtrl'
          }
        }
      })

      .state('app.mytrips', {
        cache: false,
        url: "/mytrips",
        views: {
          'menuContent': {
            templateUrl: "templates/mytrips.html",
            controller: 'MyTripsCtrl'
          }
        }
      })

      .state('app.tripdetails', {
        cache: false,
        url: "/tripdetails/:tripId",
        params: {
          tripId: null,
          replan: false,
          lastStep: false
        },
        views: {
          'menuContent': {
            templateUrl: "templates/tripdetails.html",
            controller: 'TripDetailsCtrl'
          }
        }
      })

      .state('app.newtripdetails', {
        cache: false,
        url: "/tripdetails",
        params: {
          tripId: null,
          replan: false,
          lastStep: false
        },
        views: {
          'menuContent': {
            templateUrl: "templates/tripdetails.html",
            controller: 'TripDetailsCtrl'
          }
        }
      })

      .state('app.news', {
        cache: true,
        url: "/news",
        views: {
          'menuContent': {
            templateUrl: "templates/news.html",
            controller: 'NewsCtrl'
          }
        }
      })

      .state('app.newsitem', {
        cache: false,
        url: "/newsitem/:id",
        views: {
          'menuContent': {
            templateUrl: "templates/newsitem.html",
            controller: 'NewsItemCtrl'
          }
        }
      })

      .state('app.info', {
        cache: false,
        url: "/info",
        views: {
          'menuContent': {
            templateUrl: "templates/info.html",
            controller: 'InfoCtrl'
          }
        }
      })

      .state('app.bookmarks', {
        cache: false,
        url: "/bookmarks",
        views: {
          'menuContent': {
            templateUrl: "templates/bookmarks.html",
            controller: 'BookmarksCtrl'
          }
        }
      })

      .state('app.ttlist', {
        cache: false,
        url: "/ttlist/:ref",
        views: {
          'menuContent': {
            templateUrl: "templates/ttroutelist.html",
            controller: 'TTRouteListCtrl'
          }
        }
      })
      .state('app.notifications', {
        cache: true,
        url: "/notifications",
        views: {
          'menuContent': {
            templateUrl: "templates/notifications.html",
            controller: 'NotificationsCtrl'
          }
        }
      })

      .state('app.notificationdetail', {
        cache: false,
        url: "/notificationdetail",
        params: {
          notification: null
        },
        views: {
          'menuContent': {
            templateUrl: "templates/notification.html",
            controller: 'NotificationDetailCtrl'
          }
        }
      })

      .state('app.ttmap', {
        url: "/ttmap",
        views: {
          'menuContent': {
            templateUrl: "templates/ttmap.html",
            controller: 'TTMapCtrl'
          }
        }
      })

      .state('app.ttstop', {
        url: "/ttstop/:ref/:agencyId/:stopId",
        views: {
          'menuContent': {
            templateUrl: "templates/ttstop.html",
            controller: 'TTStopCtrl'
          }
        }
      })

      .state('app.ttgroup', {
        //                cache: false,
        url: "/ttgroup/:ref/:agencyId/:groupId",
        views: {
          'menuContent': {
            templateUrl: "templates/ttroutelist.html",
            controller: 'TTRouteListCtrl'
          }
        }
      })

      .state('app.tt', {
        cache: false,
        url: "/tt/:ref/:agencyId/:groupId/:routeId/:routeSymId",
        views: {
          'menuContent': {
            templateUrl: "templates/table1.html",
            controller: 'TTCtrl'
          }
        }
      })

      .state('app.parking', {
        //                cache: false,
        url: "/parking?agencyId",
        views: {
          'menuContent': {
            templateUrl: "templates/parking.html",
            controller: 'ParkingCtrl'
          }
        }
      })

      .state('app.parkingstation', {
        //                cache: false,
        url: "/parking/:agencyId/:id",
        views: {
          'menuContent': {
            templateUrl: "templates/parking.html",
            controller: 'ParkingCtrl'
          }
        }
      })
      .state('app.parkingMeters', {
        url: "/parkingMeters",
        // cache: false,
        views: {
          'menuContent': {
            templateUrl: "templates/mapParkingMeters.html",
            controller: 'ParkingMetersCtrl'
          }
        }
      })
      .state('app.bikesharing', {
        //                cache: false,
        url: "/bikesharing?agencyId",
        views: {
          'menuContent': {
            templateUrl: "templates/bikesharing.html",
            controller: 'BikeSharingCtrl'
          }
        }
      })

      .state('app.bikestation', {
        //                cache: false,
        url: "/bikesharing/:agencyId/:id",
        views: {
          'menuContent': {
            templateUrl: "templates/bikesharing.html",
            controller: 'BikeSharingCtrl'
          }
        }
      })

      .state('app.taxi', {
        //                cache: false,
        url: "/taxi",
        views: {
          'menuContent': {
            templateUrl: "templates/taxi.html",
            controller: 'TaxiCtrl'
          }
        }
      })

      .state('app.markets', {
        cache: false,
        url: "/markets",
        views: {
          'menuContent': {
            templateUrl: "templates/markets.html",
            controller: 'MarketsCtrl'
          }
        }
      })

      .state('app.table1', {
        cache: false,
        url: "/table1",
        views: {
          'menuContent': {
            templateUrl: "templates/table1.html",
            controller: 'Table1Ctrl'
          }
        }
      })

      .state('app.table2', {
        cache: false,
        url: "/table2",
        views: {
          'menuContent': {
            templateUrl: "templates/table2.html",
            controller: 'Table2Ctrl'
          }
        }
      })

      .state('app.table3', {
        cache: false,
        url: "/table3",
        views: {
          'menuContent': {
            templateUrl: "templates/table3.html",
            controller: 'TTTable3Ctrl'
          }
        }
      })

      .state('app.signup', {
        url: '/signup',
        views: {
          'menuContent': {
            templateUrl: 'templates/signup.html',
            controller: 'RegisterCtrl'
          }
        }
      })

      .state('app.signupsuccess', {
        url: '/signupsuccess',
        views: {
          'menuContent': {
            templateUrl: 'templates/signupsuccess.html',
            controller: 'RegisterCtrl'
          }
        }
      })
      // setup an abstract state for the tabs directive
      .state('app.gamemenu', {
        cache: true,
        url: "/gamemenu",
        views: {
          'menuContent': {
            templateUrl: "templates/game/gamemenu.html",
            controller: 'GameMenuCtrl'
          }
        }
      })
      .state('app.diary', {
        cache: false,
        url: "/diary",
        views: {
          'menuContent': {
            templateUrl: "templates/game/diary.html",
            controller: 'DiaryCtrl'
          }
        }
      })
      .state('app.tripDiary', {
        cache: false,
        url: "/tripDiary",
        params: {
          message: null
        },
        views: {
          'menuContent': {
            templateUrl: "templates/game/eventTripDetail.html",
            controller: 'TripDiaryCtrl'
          }
        }
      })
      .state('app.statistics', {
        cache: false,
        url: "/statistics",
        views: {
          'menuContent': {
            templateUrl: "templates/game/statistics.html",
            controller: 'StatisticsCtrl'
          }
        }
      })
      // setup an abstract state for the tabs directive
      .state('app.game', {
        cache: false,
        url: "/game",
        views: {
          'menuContent': {
            templateUrl: "templates/game/game.html",
            controller: 'GameCtrl'
          }
        }
      })

      // Each tab has its own nav history stack:

      .state('app.game.points', {
        cache: false,
        url: '/points',
        views: {
          'tab-points': {
            templateUrl: 'templates/game/points.html',
            controller: 'PointsCtrl'
          }
        }
      })
      .state('app.configureChallenge', {
        cache: false,
        url: "/configure",
        params: {
          challenge: null,
        },
        views: {
          'menuContent': {
            templateUrl: "templates/game/configureChallenge.html",
            controller: 'ConfigureChallengeCtrl'
          }
        }
      })
      .state('app.game.rankings', {
        cache: true,
        url: '/rankings',
        views: {
          'tab-rankings': {
            templateUrl: 'templates/game/rankings.html',
            controller: 'RankingsCtrl'
          }
        }
      })
      .state('app.mapTracking', {
        cache: false,
        url: '/mapTracking',
        views: {
          'menuContent': {
            templateUrl: 'templates/game/mapTrack.html',
            controller: 'MapTrackingCtrl'
          }
        }
      });

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/login');


    $translateProvider.translations('it', {
      menu_home: 'Home',
      menu_plan: 'Pianifica viaggio',
      menu_mytrip: 'I miei viaggi',
      menu_news: 'News',
      menu_rules: 'Regole & Privacy',
      menu_info: 'Info e tariffe',
      menu_bookmarks: 'Preferiti',
      menu_notifications: 'Avvisi',
      menu_info_real_time: 'Info in tempo reale',
      menu_monitoring: 'Monitoring',
      menu_real_time_bus: 'Autobus',
      menu_real_time_bus_urban: 'Autobus Urbani',
      menu_real_time_bus_suburban: 'Autobus Extraurbani',
      menu_real_time_train: 'Treni',
      menu_real_time_bike: 'Biciclette condivise',
      menu_real_time_park: 'Parcheggi',
      menu_taxi: 'Taxi',
      menu_credits: "Credits",
      menu_parking_meters: "Parchimetri",
      menu_login: "Login",
      menu_logout: "Logout",
      plan_from: 'Da',
      plan_to: 'A',
      plan_day: 'Giorno',
      plan_time: 'Ora',
      plan_preferences: 'Preferenze',
      plan_preferences_fastest: 'Itinerario più veloce',
      plan_preferences_leastChanges: 'Con meno cambi',
      plan_preferences_leastWalking: 'Minimo tragitto a piedi',
      plan_map_title: 'Seleziona l\'indirizzo',
      plan_insert_to_address: 'Inserisci l\'indirizzo di destinazione',
      plan_insert_from_address: 'Inserisci l\'indirizzo di partenza',
      add_favorites_template: 'Vuoi aggiungere l\'indirizzo ai tuoi preferiti?',
      add_favorites_title: 'Aggiungi a preferiti',
      pop_up_loading: 'Caricamento...',
      pop_up_cancel: 'Annulla',
      pop_up_ok: 'OK',
      pop_up_close: 'Chiudi',
      pop_up_no_connection_title: 'Errore',
      pop_up__no_connection_template: 'Nessuna connessione',
      popup_address: 'Indirizzo',
      popup_lat: 'Lat: ',
      popup_long: 'Long: ',
      popup_no_address: 'Nessun indirizzo',
      popup_timepicker_title: 'Selezionare l\'ora',
      popup_timepicker_cancel: 'Annulla',
      popup_timepicker_select: 'Ok',
      popup_datepicker_title: 'Selezionare il giorno',
      popup_datepicker_today: 'Oggi',
      popup_datepicker_close: 'Annulla',
      popup_datepicker_set: 'Ok',
      popup_datepicker_jan: 'Gen',
      popup_datepicker_feb: 'Feb',
      popup_datepicker_mar: 'Mar',
      popup_datepicker_apr: 'Apr',
      popup_datepicker_may: 'Mag',
      popup_datepicker_jun: 'Giu',
      popup_datepicker_jul: 'Lug',
      popup_datepicker_ago: 'Ago',
      popup_datepicker_sep: 'Set',
      popup_datepicker_oct: 'Ott',
      popup_datepicker_nov: 'Nov',
      popup_datepicker_dic: 'Dic',
      popup_datepicker_mon: 'L',
      popup_datepicker_tue: 'M',
      popup_datepicker_wed: 'M',
      popup_datepicker_thu: 'G',
      popup_datepicker_fri: 'V',
      popup_datepicker_sat: 'S',
      popup_datepicker_sun: 'D',
      weekdays_MO_period: 'LU',
      weekdays_TU_period: 'MA',
      weekdays_WE_period: 'ME',
      weekdays_TH_period: 'GI',
      weekdays_FR_period: 'VE',
      weekdays_SA_period: 'SA',
      weekdays_SU_period: 'DO',
      journey_details_sustainable: 'Itinerario sostenibile ',
      journey_details_modify: 'Modifica',
      journey_details_delete: 'Elimina',
      journey_details_to: 'A ',
      journey_details_from: 'Da ',
      journey_details_from_bike: 'Prendi una bicicletta alla stazione di bike sharing ',
      journey_details_to_bike: 'Lascia la bicicletta alla stazione di bike sharing',
      lbl_delays: 'RITARDI',
      lbl_trips: 'TIPO',
      no_data: 'Nessun risultato trovato.',
      map_detail_title: 'Dettaglio percorso',
      lbl_places: 'posti totali',
      lbl_parking: 'Parcheggio',
      lbl_bike_station: 'Stazione bici',
      popup_delete_favorite: 'Sicuro di cancellare il preferito?',
      save_trip_title: 'Salva viaggio',
      save_trip_text: 'Dai un nome al tuo viaggio',
      save_trip_save_button: 'Salva',
      save_trip_close_button: 'Chiudi',
      save_trip_error_message: 'Inserire un nome valido',
      tripsaved_message_feedback: 'Viaggio salvato correttamente',
      btn_close: 'Chiudi',
      btn_conferma: 'Conferma',
      btn_nav_to: 'Indicazioni stradali',
      btn_next_trips: 'Vedi prossimi orari',
      lbl_stop: 'Fermata',
      err_too_many_markers: 'Too many objects on the map. Please zoom in.',
      lbl_lines: 'Corse:',
      lbl_line: 'Linea',
      popup_delete_trip_message: 'Sicuro di voler eliminare il viaggio salvato?',
      popup_delete_trip_title: 'Elimina',
      popup_start_trip_message: "L'orario previsto per la partenza del viaggio non corrisponde a quello corrente. Confermi di voler iniziare?",
      popup_start_trip_title: 'Attenzione',
      tripdeleted_message_feedback: 'Il viaggio selezionato è stato eliminato',
      my_trip_empty_list: 'Non ci sono viaggi salvati',
      my_trip_from: 'Da',
      my_trip_to: 'A',
      my_trip_time: 'Partenza',
      favorites_empty_list: 'Non ci sono favoriti memorizzati',
      pop_up_error_server_title: 'Errore',
      pop_up_error_server_template: 'Errore di comunicazione con il server',
      error_from_message_feedback: 'Luogo di partenza non valido',
      error_to_message_feedback: 'Luogo di destinazione non valido',
      error_time_message_feedback: 'Selezionare un\'ora recente',
      credits_project: 'Un progetto di:',
      credits_collaboration: 'In collaborazione con:',
      credits_participation: 'Con la partecipazione di:',
      credits_info: 'Per informazioni:',
      credits_licenses_button: 'VEDI LICENZE',
      credits_paid: "Finanziato da :",
      favorites_title_list: 'Indirizzi preferiti',
      plan_title: 'Pianifica viaggio',
      plan_home: 'Pianifica',
      journey_detail: 'Dettagli viaggio',
      planlist_sustanainable: 'Itinerari sostenibili',
      popup_step_number: 'Passo ',
      pop_up_arrival: 'Arrivo',
      my_trip_title: 'I miei viaggi',
      parking_on: 'posti liberi su ',
      bikesharings_bikes: 'biciclette',
      bikesharings_free_slots: 'posti liberi',
      dow_1_s: 'Lun',
      dow_2_s: 'Mar',
      dow_3_s: 'Mer',
      dow_4_s: 'Gio',
      dow_5_s: 'Ven',
      dow_6_s: 'Sab',
      dow_7_s: 'Dom',
      home_markets: 'MERCATINI DI ROVERETO',
      markets_title: 'Mercatini di Natale',
      markets_subtitle: 'Parcheggia fuori, entra nel Natale!',
      markets_text1: 'Vivi il Natale con uno sguardo eco-sostenibile, riducendo le emissioni di CO2 e il traffico: pianifica i tuoi spostamenti con ViaggiaRovereto e scopri gli itinerari più smart',
      markets_text2: 'Il sevizio navetta è disponibile dallo stadio Quercia a piazza Rosmini e rientro, tutti i sabati e le domeniche fino a Natale e nel ponte dell\'Immacolata, dalle 10 alle 19, ogni 15 minuti.',
      markets_text3: 'Per coloro che fruiranno del servizio e compileranno il questionario, presso la casetta infopoint dei Mercatini potranno ricevere un omaggio a scelta tra i gadget disponibili o un biglietto per il trenino di Natale',
      markets_text4: 'Questa iniziativa è promossa dal Comune di Rovereto, con Fondazione Bruno Kessler e CAIRE Urbanistica, in collaborazione con Consorzio In Centro e l\'APT Rovereto e Vallagarina, e fa parte del progetto di ricerca STREETLIFE che ha come obiettivo la mobilità sostenibile',
      markets_button_to_market: 'PORTAMI AI MERCATINI',
      markets_button_to_park1: 'RIPORTAMI AL PARCHEGGIO',
      markets_button_to_park2: 'STADIO QUERCIA',
      journey_details_save: 'SALVA ITINERARIO',
      action_walk: 'Cammina ',
      action_bicycle: 'Pedala ',
      action_car: 'Guida ',
      action_bus: 'Prendi l\'autobus ',
      action_train: 'Prendi il treno ',
      action_park: 'Lascia la macchina a ',
      action_cablecar: 'Prendi la funivia ',
      action_move: 'Prosegui',
      parking_search_time: ' per trovare parcheggio',
      error_select_type_feedback: 'Selezionare almeno un mezzo di trasporto',
      planlist_empty_list: 'La ricerca non ha prodotto risultati validi',
      no_tt: 'In questa giornata non ci sono corse disponibili per questa linea.',
      lbl_no_trips: 'Non sono previste corse nelle prossime 24 ore.',
      notifications_empty_list: 'Non ci sono avvisi in questo momento',
      notifications_title: 'Avvisi',
      notifications_detail_title: 'Dettagli avviso',
      bikesharings_distance: 'Distanza: ',
      parking_cost: 'Costo di parcheggio: ',
      parking_time: 'Tempo stimato per parcheggiare: ',
      tutorial_next: 'AVANTI',
      tutorial_end: 'FINE',
      tutorial_skip: 'SALTA',
      tutorial: 'Tutorial',
      empty_home_label_1: 'Ops... hai nascosto tutte le schede della pagina principale',
      empty_home_label_2: 'Vai nei PREFERITI per ripristinare i contenuti che ti interessano',
      menu_betatesting_bug: 'Segnala un problema',
      news_empty_list: 'Non ci sono notizie in questo momento',
      news_title: 'News',
      pop_up_no_start_title: "Problema di connessione",
      pop_up_no_start_template: "Per iniziare a tracciare il viaggio è necessaria una connessione internet. Verificare le impostazioni del telefono",
      popup_modify_trip_title: 'Modifica',
      popup_modify_trip_message: 'Sicuro di voler modificare il viaggio salvato?',
      plan_preferences_fastest: 'Itinerario più veloce',
      plan_preferences_leastChanges: 'Con meno cambi',
      plan_preferences_leastWalking: 'Minimo tragitto a piedi',
      lbl_taxi_station: 'Stazione Taxi',
      taxi_label_your_position: 'La tua posizione attuale, rilevata dal dispositivo, è: ',
      taxi_label_check_it: 'Verificala prima di comunicarla al taxi.',
      taxi_label_no_accuracy: 'Non è stato possibile determinare la tua posizione con sufficiente accuratezza per permetterti di comunicarla al tassista. Prova ad accendere un sistema di localizzazione sul tuo dispositivo (GPS, WiFi, ...).',
      menu_gamification: 'Play&Go',
      home_gamification: 'Play&Go',
      login_title: 'Play&Go',
      login_subtitle: 'Viaggia',
      login_warning: 'Attenzione! Per accedere al gioco devi essere registrato al sistema',
      login_facebook: 'Accedi con Facebook',
      login_google: 'Accedi con Google',
      login_register: 'Registrati',
      labl_start_tracking: 'INIZIA',
      btn_start_tracking: 'INIZIA VIAGGIO',
      labl_stop_tracking: 'TERMINA VIAGGIO',
      dow_monday: 'Lunedì',
      dow_tuesday: 'Martedì',
      dow_wednesday: 'Mercoledì',
      dow_thursday: 'Giovedì',
      dow_friday: 'Venerdì',
      dow_saturday: 'Sabato',
      dow_sunday: 'Domenica',
      dow_monday_short: 'L',
      dow_tuesday_short: 'M',
      dow_wednesday_short: 'M',
      dow_thursday_short: 'G',
      dow_friday_short: 'V',
      dow_saturday_short: 'S',
      dow_sunday_short: 'D',
      save_trip_recurrent: 'Ricorrente',
      save_trip_alldays: 'Tutti',
      notification_tracking_title: 'Play&Go',
      notification_tracking_text: 'Il tuo viaggio sta per iniziare',
      toast_after_time: 'È troppo tardi per tracciare il viaggio',
      toast_before_time: 'È troppo presto per tracciare il viaggio',
      title_validateuser: 'Attenzione',
      lbl_validateuser: 'Procedi con la registrazione al gioco e inizia a giocare!',
      btn_validate_user: 'Registrati',
      toast_already_monitoring: 'Stai già registrando un percorso',
      toast_already_monitored: 'Viaggio già tracciato.',
      sure_delete_title: 'Termina viaggio',
      sure_delete_text: 'Confermi di essere arrivato a destinazione per il viaggio corrente?',
      tracking_notification_title: 'Viaggia Trento',
      tracking_notification_text: 'Monitoraggio di viaggio attivato',
      toast_not_deletable: 'Impossibile cancellare un viaggio in corso',
      toast_deleted: 'Viaggio cancellato',
      toast_not_modifiable: 'Impossibile modificare un viaggio in corso',
      lbl_welcome_title: 'Play&Go',
      lbl_welcome_text: '<ul class="list-welcome"><li>Pianifica i tuoi viaggi</li><li>Salva il tuo itinerario</li><li>Ricordati di tracciare il tuo percorso quando esegui il viaggio!</li></ul>',
      btn_rules: 'REGOLE',
      btn_score: 'PUNTEGGIO',
      user_check: 'Verifica utente...',
      credits_main_sponsors: 'Sponsor premi finali:',
      registration_title: 'Benvenuto',
      registration_answer: 'Rispondi a queste veloci e semplici domande per registrarti al gioco. Questo permetterà al sistema di recuperare informazioni utili per offrire un servizio piu\' personalizzato e adatto alle tue abitudini.',
      registration_read: 'Ho letto e accettato il regolamento di gioco e l\'informativa sulla privacy:',
      registration_link_rule: 'Regolamento di gioco',
      registration_privacy: 'Informativa privacy',
      registration_prizes: 'Premi',
      registration_nick: 'Nick name:*',
      registration_nick_placeholder: 'Inserisci un nickname che ti rappresenti nel gioco',
      registration_mail: 'Email:*',
      registration_mail_placeholder: 'Inserisci un email da usare per le communicazioni',
      registration_age: 'Età:*',
      registration_km: 'Km medi percorsi giornalmente:*',
      registration_km_placeholder: 'Inserisci il numero di Km medi percorsi giornalmente',
      registration_public_transport: 'Utilizzi quotidianamente i mezzi pubblici? ',
      registration_true: 'Si',
      registration_false: 'No',
      registration_which_public_transport: 'Mezzi usati abitualmente per gli spostamenti: ',
      registration_invite: 'Chi ti ha invitato a questo gioco? (nickname)',
      registration_invite_placeholder: 'Inserisci il nickname di chi ti ha invitato al gioco',
      registration_transport_train: 'treno',
      registration_transport_bus: 'autobus',
      registration_transport_carsharing: 'auto condivisa',
      registration_transport_bikesharing: 'bici condivisa',
      registration_transport_car: 'auto privata',
      registration_transport_bike: 'bici privata',
      registration_transport_foot: 'a piedi',
      registration_must_accept: 'Devi accettare il regolamento per procedere con la registrazione',
      registration_empty_nick: 'Nickname è obbligatorio',
      registration_empty_mail: 'Email è obbligatorio',
      registration_empty_age: 'Età è obbligatoria',
      registration_empty_km: 'Inserisci un numero di kilometri valido',
      registration_empty_transport: 'Selezionare almeno un mezzo di trasporto',
      age_placeholder: 'Seleziona una fascia età',
      age_option1: '< 20 anni',
      age_option2: '20-40 anni',
      age_option3: '40-60 anni',
      age_option4: '> 60 anni',
      nickname_inuse: 'Nickname è già usato',
      more_rules: 'Espandi regolamento',
      less_rules: 'Riduci regolamento',
      sponsor_week: 'QUESTA SETTIMANA I PREMI SONO OFFERTI DA ',
      login_signin: 'ENTRA',
      login_signup: 'REGISTRATI',
      signin_title: 'Accedi con le tue credenziali',
      signin_pwd_reset: 'Password dimenticata?',
      text_login_use: 'oppure accedi con',
      error_popup_title: 'Errore',
      error_generic: 'La registrazione non è andata a buon fine. Riprova più tardi.',
      error_email_inuse: 'L\'indirizzo email è già in uso.',
      signup_name: 'Nome',
      signup_surname: 'Cognome',
      signup_email: 'Email',
      signup_pwd: 'Password',
      error_required_fields: 'Tutti i campi sono obbligatori',
      error_password_short: 'La lunghezza della password deve essere di almeno 6 caratteri',
      signup_success_title: 'Registrazione completata!',
      signup_success_text: 'Completa la registrazione cliccando sul link che trovi nella email che ti abbiamo inviato.',
      signup_resend: 'Re-inviare l\'email di conferma',
      error_signin: 'Username/password non validi',
      signup_signup: 'Registrati',
      signup_title: 'Registrati con',
      game_tab_points_label: 'PUNTI',
      game_tab_challenges_label: 'SFIDE',
      game_tab_rankings_label: 'CLASSIFICA',
      no_saved_tracks_to_track: 'Nessun viaggio salvato. Pianifica un itinerario e salvalo per iniziare a giocare!',
      play_now: 'GIOCA ORA!',
      play_now_sub: 'Inizia a tracciare un percorso',
      track_walk: 'A piedi',
      track_bike: 'In bici',
      track_saved: 'Pianificati',
      play_is_on: 'GIOCO IN CORSO',
      play_is_on_for: 'Stai {{transport}} da {{time}} ore',
      stop_tracking: 'Termina viaggio',
      track_walk_action: 'camminando',
      track_bike_action: 'pedalando',
      track_other_action: 'viaggiando',
      game_tab_challenges_filter_active: "Attive",
      game_tab_challenges_filter_old: "Passate",
      game_tab_challenges_info: "Info sfida",
      gps_disabled_title: "Permessi di Geolocalizzazione",
      gps_disabled_template: "La geolocalizzazione risulta disabilitata. Il tracciamento del viaggio in corso è stato interrotto. Prima di tracciare nuovi viaggi è necessario abilitare la geolocalizzazione.",
      pop_up_no_geo_title: 'Errore di geolocalizzazione',
      pop_up_no_geo_template: 'Attenzione! Non è stato possibile rilevare la tua posizione. Accedi alle impostazioni del tuo dispositivo e controlla che il servizio di localizzazione sia attivo',
      pop_up_low_accuracy_title: 'Attenzione',
      pop_up_low_accuracy_template: 'La posizione rilevata non è precisa, il viaggio potrebbe non essere valido. Vuoi continuare a tracciare il percorso?',
      pop_up_low_accuracy_button_go_on: 'Continua',
      pop_up_points_title: 'Complimenti!',
      pop_up_points_template: 'Viaggio terminato! Il tuo punteggio sarà aggiornato a breve.',
      pop_up_points_btn: 'Vedi punti',
      no_points_title: 'Attenzione',
      no_points: 'Nessun punto assegnato, la distanza percorsa è troppo breve per guadagnare dei punti.',
      game_tab_challenges_filter_active: "Attive",
      game_tab_challenges_filter_old: "Passate",
      game_tab_challenges_info: "Info sfida",
      game_tab_challenges_daysToEnd: "Hai ancora {{days}} giorni per completare la sfida!",
      game_tab_challenges_daysToEnd_1: "Hai ancora {{days}} giorno per completare la sfida!",
      game_tab_challenge_success_true: "Hai vinto!",
      game_tab_challenge_success_false: "Hai perso!",
      game_tab_challenges_status: "Stato completamento",
      game_tab_challenges_status_final: "Punteggio finale",
      game_tab_ranking_filter_now: "Settimana corrente",
      game_tab_ranking_filter_last: "Settimana scorsa",
      game_tab_ranking_filter_global: "Globale",
      game_tab_ranking_listheader_price: "Premio della settimana",
      game_tab_ranking_listheader_position: "Posizione",
      game_tab_ranking_listheader_player: "Giocatore",
      game_tab_ranking_listheader_points: "Punti",
      game_tab_ranking_listheader_level: "Livello",
      game_tab_diary_filter_badge: "Badge",
      game_tab_diary_filter_challenge: "Sfide",
      game_tab_diary_filter_trip: "Viaggi",
      game_tab_diary_filter_raccomandation: "Raccomandazioni",
      game_tab_diary_filter_allnotifications: "Tutte le notifiche",
      game_tab_statistics_filter_Daily: "Giornaliero",
      game_tab_statistics_filter_Weekly: "Settimanale",
      game_tab_statistics_filter_Monthly: "Mensile",
      game_tab_statistics_filter_Total: "Totale",
      green_leaves_points: "Punti Green Leaves",
      ranking_reload: "Ricarica",
      diary_title: "Diario di gioco",
      statistics_title: "Statistiche di gioco",
      "green leaves": "Green Leaves",
      "bike aficionado": "Bike Trip Badge",
      "sustainable life": "Zero Impact Badge",
      "public transport aficionado": "Public Transport Badge",
      "park and ride pioneer": "Park And Ride Badge",
      "bike sharing pioneer": "Bike Sharing Badge",
      "recommendations": "User Recommendation Badge",
      "leaderboard top 3": "Leaderboard Top 3 Badge",
      "no_challenges": "Al momento non ci sono sfide",
      "no_challengables": "Al momento non ci sono giocatori disponibili",
      "no_badges": "Al momento non ci sono badges",
      "no_challenges_old": "Nessuna sfida trovata",
      no_ranking:"Nessuna classifica trovata",
      no_statistics: "Nessuna statistica trovata",
      pop_up_invalid_tracking_title: "Viaggio non valido",
      pop_up_invalid_tracking_template: "Le caratteristiche del viaggio fatto non corrispondono al mezzo di trasporto specificato. I punti non saranno assegnati.",
      pop_up_plan: "Pianifica",
      wait_synch_running: "Attendere, sincronizzazione in corso",
      no_status: "Errore di comunicazione con il server, nessun dato disponibile",
      toast_error_server_template: 'Errore di comunicazione con il server',
      lbl_game_diary: 'Diario di gioco',
      lbl_game_statistics: 'Statistiche di gioco',
      lbl_parking_meter: 'Parchimetro',
      lbl_parking_meter_price: 'Tariffa oraria:',
      lbl_parking_meter_orario: 'Orario:',
      lbl_parking_meter_giorni: 'Giorni:',
      lbl_first_time_parking_meter_title: 'Attenzione',
      lbl_first_time_parking_meter_gps: 'Per utilizzare al meglio questa funzionalità si consiglia di impostare sul dispositivo il rilevamento della posizione sulla modalità di precisione più elevata.',
      lbl_first_time_parking_meter_compass: 'L’accuratezza della direzione indicata dalla app per raggiungere il parchimetro più vicino dipende anche dall’esatta calibrazione della bussola del tuo dispositivo. (Per sapere come migliorarla, consulta le istruzioni del tuo dispositivo)',
      btn_undertood: 'Ho capito',
      lbl_no_gps_title: 'Attenzione',
      lbl_no_gps_content: 'Per utilizzare al meglio questa funzionalità si consiglia di impostare sul dispositivo il rilevamento della posizione sulla modalità di precisione più elevata.',
      btn_drive_me: 'Portami là',
      lbl_calibration: 'Calibrazione bussola',
      lbl_calibration_content: 'Muovi il dispositivo formando un 8 partendo dal punto centrale verso destra, come mostra la figura, finché la bussola non è calibrata. Dovrebbe essere sufficiente eseguire l\'operazione un paio di volte.',
      lbl_distance: 'Distanza:',
      lbl_parking_meter_payment_card: 'moneta e carte',
      lbl_parking_meter_payment_cash: 'moneta',
      lbl_parking_meter_payment: 'Metodo di pagamento: ',
      msg_won_badge: ' Hai guadagnato un nuovo badge "{{badgeText}}"',
      msg_new_friend: 'Il tuo amico {{recommendedNickname}} partecipa al gioco. Hai guadagnato 20 green leaves!',
      msg_new_challenge: 'Ti è stata assegnata una nuova sfida "{{challengeName}}"',
      msg_won_challenge: 'HAI VINTO la sfida "{{challengeName}}"',
      msg_pub_ranking: 'Pubblicata la classifica dei vincitori di questa settimana',
      msg_trip_walk: 'Ore {{time}}.<br> {{travelValidity}}, {{points}} punti.',
      msg_trip_bike: 'Ore {{time}}.<br> {{travelValidity}}, {{points}} punti.',
      msg_trip_bus: 'Ore {{time}}.<br> {{travelValidity}}, {{points}} punti.',
      msg_trip_train: 'Ore {{time}}.<br> {{travelValidity}}, {{points}} punti.',
      msg_trip_multimodal: 'Ore {{time}}.<br> {{travelValidity}}, {{points}} punti.',
      msg_new_level: 'Hai raggiunto il livello {{levelName}}',
      travel_pending_state: 'Viaggio in attesa di validazione',
      no_diary: 'Nessun elemento trovato nel diario',
      no_stats: 'Nessuna statistica trovata',
      statistic_total_label: "Total",
      VALID: 'Valido',
      INVALID: 'Non valido',
      PENDING: 'In validazione',
      label_not_valid: 'Non valido',
      label_valid: 'Valido',
      label_event_trip_detail_time: 'Ora: ',
      label_event_trip_detail_from: 'Da: ',
      label_event_trip_detail_to: 'A:',
      label_event_trip_detail_distance_walk: 'Distanza piedi: ',
      label_event_trip_detail_distance_bike: 'Distanza bici: ',
      label_event_trip_detail_distance_bus: 'Distanza bus: ',
      label_event_trip_detail_distance_car: 'Distanza auto: ',
      not_acc_label: 'Questa linea non è accessibile',
      btn_faq: 'FAQ',
      error_trip_no_data: "Il tracciamento del viaggio non è andato a buon fine: l’assenza di dati non permette la validazione del viaggio",
      error_trip_out_of_area: "Il viaggio non è valido poichè è stato effettuato fuori dall'area di gioco",
      error_trip_too_short: "Il viaggio non è valido: lunghezza inferiore ai 250 metri",
      error_trip_free_tracking_no: "Il viaggio non è valido: il viaggio tracciato non corrisponde al mezzo di trasporto dichiarato",
      error_trip_planned_no: "Il viaggio non è valido: il percorso del viaggio tracciato non corrisponde a quello del viaggio pianificato",
      error_valid_0: "Non sono stati assegnati punti Green Leaves a causa del superamento dei limiti giornalieri (10 Km a piedi, 30 Km in bici, 8 viaggi con trasporto pubblico al giorno)",
      label_points: "Green Leaves guadagnate: ",
      pop_up_bt_title: "Bluetooth disabilitato",
      pop_up_bt: "Per garantire una validazione corretta dei viaggi in autobus/treno è richiesta l’attivazione del Bluetooth sul dispositivo.",
      pop_up_bt_button_enable: "Attivare",
      registration_wrong_chars: "Nickname non valido. Sono consentiti solo lettere e numeri",
      pop_up_always_GPS: "Attenzione",
      pop_up_always_GPS_template: "Per utilizzare l'applicazione è necessario impostare 'Consenti di accedere alla posizione' su 'Sempre'",
      pop_up_always_GPS_go_on: "Imposta",
      pop_up_battery_save: "Risparmio energetico attivo",
      pop_up_battery_save_template: "La modalità \"Risparmio energetico\" potrebbe influire negativamente sulla precisione con cui viene tracciato il viaggio che potrebbe quindi risultare non valido. Per un tracciato preciso, disattivare la modalità \"Risparmio energetico\"",
      home_footerbar_home: "HOME",
      home_footerbar_diary: "DIARIO",
      home_footerbar_leaderboards: "CLASSIFICA",
      home_footerbar_real: "MOBILITÀ",
      mobility_title: "Mobilità",
      profile_title: "Profilo",
      home_your_challenges: "Sfide della settimana",
      home_no_challenges: "Nessuna sfida in corso",
      profile_footerbar_points: "Punteggio",
      profile_footerbar_challenges: "Sfide",
      profile_footerbar_statistics: "Statistiche",
      pop_up_change_free_track_title: "Tracciamento libero",
      pop_up_change_free_track_template: "Ai fini della validazione e assegnazione dei punti ogni cambio mezzo comporta una singola validazione anche se utilizzato all'interno dello stesso tracciamento.",
      pop_up_change_free_track_go_on: "Continua",
      user_level_label: "Livello",
      user_points_label: "Punti Green Leaves",
      user_stat_walk_label: "Km a piedi",
      user_stat_bike_label: "Km in bici",
      user_stat_bus_label: "Km in autobus",
      user_stat_train_label: "Km in treno",
      change_image_template: "Sei sicuro di voler cambiare l'immagine di profilo?",
      change_image_title: "Immagine profilo",
      change_image_confirm: "Cambia",
      registration_profile_image: "Scegli l'immagine del tuo profilo",
      change_image_title: "Immagine di profilo",
      menu_info_transports: "Mobilità",
      diary_multimodal: "Multimodale",
      diary_single: "Viaggio singolo",
      challenge_future: "Future",
      challenge_past: "Passate",
      challenge_unlock: "Tipologie",
      warning_unlock_challenge: "Sblocca una nuova tipologia di sfida che potrai utilizzare nella prossima scelta!",
      warning_choose_challenge: "Programma la sfida per la prossima settimana. Se non avrai scelto una sfida, alle 12.00 di venerdì il sistema ti assegnerà in automatico una sfida individuale",
      read_more: "altro",
      challenge_popup_title: "Sblocca sfida",
      challenge_detail_popup_title: "Dettaglio sfida",
      challenge_popup_template_groupCompetitiveTime: "Confermando sbloccherai la tipologia di sfida competitiva a tempo e potrai sfidare altri giocatori",
      challenge_popup_template_groupCompetitivePerformance: "Confermando sbloccherai la tipologia di sfida competitiva a performance e potrai sfidare altri giocatori",
      challenge_popup_template_groupCooperative: "Confermando sbloccherai la tipologia di sfida cooperativa e potrai sfidare altri giocatori",
      btn_got_it: "Ho capito",
      btn_challenge_accept: "Accetto",
      btn_challenge_reject: "Rifiuto",
      btn_challenge_choose: "Scegli chi sfidare",
      lbl_challenge_configure_type: "Come preferisci affrontare la sfida?",
      lbl_challenge_configure_opponent: "Scegli il tuo avversario",
      lbl_challenge_configure_friend:"Scegli il tuo compagno",
      home_configure_challenge: "Configura la sfida",
      lbl_challenge_choose_from_list: "Seleziona da lista",
      ph_challenge_nick: "Cerca per nickname",
      lbl_challenge_calculate: "Calcola obiettivo",
      lbl_chall_choose_player_blacklist: "Giocatori non disponibili",
      title_select_player: "Seleziona il tuo avversario",
      button_select_player_done: "Fatto",
      lbl_challenge_request: "Invia richiesta di sfida",
      lbl_challenge_target: "Obiettivo: ",
      lbl_challenge_leaves_player: "Green Leaves per te: ",
      lbl_challenge_leaves_opponent: "Green Leaves per ",
      toast_error_configure: "Scegli la modalità di sfida",
      btn_challenge_reject_sent: "annulla invito",
      lbl_sent_from: "Inviato da ",
      lbl_sent_to: "Inviato a ",
      challenge_comp_time: "Sfida di coppia competitiva a tempo",
      challenge_cooperative: "Sfida di coppia cooperativa",
      challenge_comp_perf: "Sfida di coppia competitiva a performance",
      challenge_single_player: "Sfida singola",
      home_next_challenge: "Programma la prossima sfida",
      challenge_accept_popup_title: "Conferma la sfida",
      challenge_accept_popup_template: "Confermando la sfida verranno eliminate automaticamente le altre opzioni",
      lbl_challenge_unlock_next: "Raggiungi il prossimo livello per sbloccare la sfida",
      user_next_level_label: " Green Leaves al prossimo livello",
      at_clock: " alle ",
      at_day_opponent: " ha vinto il giorno ",
      at_day: "il giorno ",
      you_win: "HAI VINTO il ",
      you_lose: "HAI PERSO ",
      user_chall_status: "Stato completamento sfida:  ",
      challenge_days_to_end: 'Hai ancora {{challenge.daysToEnd}} giorni per completare la sfida.',
      payload_large: "Immagine troppo grande",
      payload_unsupported: "Immagine non sopportata",
      toast_type_unlocked: "Tipologia di sfida sbloccata!",
      groupCompetitivePerformance_desc_short:"Chi la dura la vince",
      groupCompetitivePerformance_desc_long:"Sfida un altro giocatore su un obiettivo a scelta. Chi, al termine della settimana avrà ottenuto un risultato migliore vince.",
      groupCompetitiveTime_desc_short:"Vinca il più veloce",
      groupCompetitiveTime_desc_long:"Sfida un altro giocatore in una gara a tempo. Vince chi raggiunge per primo l'obiettivo.",
      groupCooperative_desc_short:"L'unione fa la forza",
      groupCooperative_desc_long:"Invita un altro utente a giocare con te su un obiettivo comune. Vincerete se, al termine della settimana, la somma dei vostri risultati raggiungerà l'obiettivo.",
      Walk_Km:" Km",
      Bike_Km:" Km",
      Green_Leaves:"Green Leaves",
      lbl_chall_blacklist:"Il giocatore che hai cercato non e’ sfidabile. Questo succede quando si verifica una o più delle seguenti condizioni: il giocatore ha un livello troppo alto (o basso) rispetto al tuo, il giocatore ha già ricevuto tre richieste, il giocatore ha già programmato la sfida per la prossima settimana, il giocatore ti ha inserito nella sua blacklist o tu hai inserito il giocatore nella tua blacklist.",
      lbl_insert_nickname:"Inserisci il nickname del giocatore",
      lbl_challenge_percentage:"Percentuale:",
      lbl_challenge_threshold:"Threshold:",
      home_unlock_challenge:"Sblocca una nuova sfida",
      lbl__challenge_cant_see_player:"Perche’ non riesco a trovare un giocatore?",
      no_blacklist:"Nessuna blacklist trovata",
      lbl_chall_user_not_available_title:"Utente non disponibile",
      lbl_chall_user_not_available:"L'utente selezionato non e’ più disponibile. Selezionare un altro giocatore"      
    });

    $translateProvider.translations('en', {
      menu_home: 'Home',
      menu_plan: 'Plan journey',
      menu_mytrip: 'My journeys',
      menu_news: 'News',
      menu_rules: 'Rules & Privacy',
      menu_info: 'Info and rates',
      menu_bookmarks: 'Bookmarks',
      menu_notifications: 'Notifications',
      menu_info_real_time: 'Real Time information',
      menu_monitoring: 'Monitoring',
      menu_real_time_bus: 'Bus',
      menu_real_time_bus_urban: 'Urban Bus',
      menu_real_time_bus_suburban: 'Suburban Bus',
      menu_real_time_train: 'Trains',
      menu_real_time_bike: 'Shared bikes',
      menu_real_time_park: 'Parking lots',
      menu_taxi: 'Taxi',
      menu_credits: "Credits",
      menu_parking_meters: "Parking Meters",
      menu_login: "Login",
      menu_logout: "Logout",
      plan_from: 'From',
      plan_to: 'To',
      plan_day: 'Day',
      plan_time: 'Time',
      plan_preferences: 'Preferences',
      plan_preferences_fastest: 'Fastest',
      plan_preferences_leastChanges: 'Least changes',
      plan_preferences_leastWalking: 'Least walking',
      plan_map_title: 'Select the address',
      plan_insert_to_address: 'Insert destination address',
      plan_insert_from_address: 'Insert starting address',
      add_favorites_template: 'Add this address to favorites?',
      add_favorites_title: 'Add to favorites',
      pop_up_loading: 'Loading...',
      pop_up_cancel: 'Cancel',
      pop_up_ok: 'OK',
      pop_up_close: 'Close',
      pop_up_no_connection_title: 'Error',
      pop_up__no_connection_template: 'No connection',
      popup_address: 'Address',
      popup_lat: 'Lat: ',
      popup_long: 'Long: ',
      popup_no_address: 'No address',
      popup_timepicker_title: 'Select time',
      popup_timepicker_cancel: 'Cancel',
      popup_timepicker_select: 'Ok',
      popup_datepicker_title: 'Select the day',
      popup_datepicker_today: 'Today',
      popup_datepicker_close: 'Cancel',
      popup_datepicker_set: 'Ok',
      popup_datepicker_jan: 'Jan',
      popup_datepicker_feb: 'Feb',
      popup_datepicker_mar: 'Mar',
      popup_datepicker_apr: 'Apr',
      popup_datepicker_may: 'May',
      popup_datepicker_jun: 'Jun',
      popup_datepicker_jul: 'Jul',
      popup_datepicker_ago: 'Ago',
      popup_datepicker_sep: 'Sep',
      popup_datepicker_oct: 'Oct',
      popup_datepicker_nov: 'Nov',
      popup_datepicker_dic: 'Dec',
      popup_datepicker_mon: 'M',
      popup_datepicker_tue: 'T',
      popup_datepicker_wed: 'W',
      popup_datepicker_thu: 'T',
      popup_datepicker_fri: 'F',
      popup_datepicker_sat: 'S',
      popup_datepicker_sun: 'S',
      weekdays_MO_period: 'MO',
      weekdays_TU_period: 'TU',
      weekdays_WE_period: 'WE',
      weekdays_TH_period: 'TH',
      weekdays_FR_period: 'FR',
      weekdays_SA_period: 'SA',
      weekdays_SU_period: 'SU',
      journey_details_sustainable: 'Sustainable journey ',
      journey_details_modify: 'Modify',
      journey_details_delete: 'Delete',
      journey_details_to: 'To ',
      journey_details_from: 'From ',
      journey_details_from_bike: 'Take a bike at the bike sharing station ',
      journey_details_to_bike: 'Leave the bike at the bike sharing station ',
      lbl_delays: 'DELAYS',
      lbl_trips: 'TYPE',
      no_data: 'No data found.',
      map_detail_title: 'Journey details',
      lbl_places: 'total places',
      lbl_parking: 'Parking',
      lbl_bike_station: 'Bike station',
      popup_delete_favorite: 'Are you sure to delete the favorite?',
      save_trip_title: 'Save journey',
      save_trip_text: 'Give a name to your journey',
      save_trip_save_button: 'Save',
      save_trip_close_button: 'Close',
      save_trip_error_message: 'Please, insert a valid name',
      tripsaved_message_feedback: 'Journey correctly saved',
      btn_close: 'Close',
      btn_conferma: 'Confirm',
      btn_nav_to: 'Directions',
      btn_next_trips: 'See next trips',
      lbl_stop: 'Stop',
      err_too_many_markers: 'Too many objects on the map. Please zoom in.',
      lbl_lines: 'Lines:',
      lbl_line: 'Line',
      popup_delete_trip_message: 'Are you sure to delete the saved journey?',
      popup_delete_trip_title: 'Delete',
      popup_start_trip_message: 'The journey departure time does not correspond to the current one. Are you sure to start anyway?',
      popup_start_trip_title: 'Attention',
      tripdeleted_message_feedback: 'The selected journey has been deleted',
      my_trip_empty_list: 'No saved journeys',
      my_trip_from: 'From',
      my_trip_to: 'To',
      my_trip_time: 'Start',
      favorites_empty_list: 'No saved favorites',
      pop_up_error_server_title: 'Error',
      pop_up_error_server_template: 'We had some communication problems',
      error_from_message_feedback: 'Starting point is not valid',
      error_to_message_feedback: 'Destination point is not valid',
      error_time_message_feedback: 'Choose a recent hour',
      credits_project: 'A project by:',
      credits_collaboration: 'In collaboration with:',
      credits_participation: 'With participation of:',
      credits_info: 'Further information:',
      credits_licenses_button: 'READ LICENSES',
      credits_paid: "Supported by:",
      favorites_title_list: 'Favorite places',
      plan_title: 'Plan journey',
      plan_home: 'Plan',
      journey_detail: 'Journey\'s details',
      planlist_sustanainable: 'Sustainable Itineraries',
      popup_step_number: 'Step ',
      pop_up_arrival: 'Arrive',
      my_trip_title: 'My journeys',
      parking_on: 'free parks out of',
      bikesharings_bikes: 'bikes',
      bikesharings_free_slots: 'free slots',
      dow_1_s: 'Mon',
      dow_2_s: 'Tue',
      dow_3_s: 'Wed',
      dow_4_s: 'Thu',
      dow_5_s: 'Fri',
      dow_6_s: 'Sat',
      dow_7_s: 'Sun',
      home_markets: 'ROVERETO\'S MARKET',
      markets_title: 'Mercatini di Natale',
      markets_subtitle: 'Park and Ride to Christmas!',
      markets_text1: 'Live the Christmas spirit in a sustainable way, reduce Co12 emissions and avoid traffic: plan your journey with ViaggiaRovereto and discover the smartest itineraries',
      markets_text2: 'The shuttle bus service is available from Quercia Stadium to Piazza Rosmini and back, every 15 minutes in between 10 and 19, every Saturday and Sunday until Christmas, plus throughtout the Immacolata holidays',
      markets_text3: 'Everyone who uses the shuttle service and completes a questionnaire will receive a gadget  or a ticket for the Christmas train at the "Infopoint" cabin of the Markets',
      markets_text4: 'This initiative is promoted by the City of Rovereto, together with Fondazione Bruno Kessler and CAIRE Urbanistica, and with the collaboration of "Consorzio in Centro" and the  Rovereto and Vallagarina APT; it is part of the European research project STREETLIFE, which has the objective of smarter and more sustainable urban mobility.',
      markets_button_to_market: 'TAKE ME TO THE MARKETS',
      markets_button_to_park1: 'TAKE ME BACK TO THE PARKING',
      markets_button_to_park2: 'QUERCIA STADIUM',
      journey_details_save: 'SAVE JOURNEY',
      action_walk: 'Walk ',
      action_bicycle: 'Ride ',
      action_car: 'Drive ',
      action_bus: 'Take the bus ',
      action_train: 'Take the train ',
      action_park: 'Leave the car in ',
      action_cablecar: 'Take the cable car ',
      action_move: 'Move ',
      parking_search_time: ' searching time',
      error_select_type_feedback: 'Select at least one mean of transport ',
      planlist_empty_list: 'Your search did not match any journey',
      no_tt: 'No trips available for this line on this date.',
      lbl_no_trips: 'No lines due in the next 24 hours.',
      notifications_empty_list: 'There are no notification at the moment',
      notifications_title: 'Notifications',
      notifications_detail_title: 'Notification details',
      bikesharings_distance: 'Distance: ',
      parking_cost: 'Parking cost: ',
      parking_time: 'Parking average time: ',
      tutorial_next: 'NEXT',
      tutorial_end: 'END',
      tutorial_skip: 'SKIP',
      tutorial: 'Tutorial',
      empty_home_label_1: 'Oops... you removed all the tabs from the main page',
      empty_home_label_2: 'Go to BOOKMARKS to restore the contents you are interested in',
      menu_betatesting_bug: 'Report an issue',
      news_empty_list: 'There are no news at the moment',
      news_title: 'News',
      pop_up_no_start_title: "Connection problem",
      pop_up_no_start_template: "Internet connection is required to start tracking a trip. Check your phone settings",
      popup_modify_trip_title: 'Modify',
      popup_modify_trip_message: 'Are you sure to modify the saved journey?',
      plan_preferences_fastest: 'Fastest',
      plan_preferences_leastChanges: 'Least changes',
      plan_preferences_leastWalking: 'Least walking',
      lbl_taxi_station: 'Taxi Station',
      taxi_label_your_position: 'You current position, as detected by the device, is:',
      taxi_label_check_it: 'Check it before communicating it to the taxi driver.',
      taxi_label_no_accuracy: 'It has not been possible to determine with sufficient accuracy your position to let you communicate it to the taxi driver. Try to switch on a tracking system on your device (GPS, WiFi, ...)',
      home_gamification: 'Play&Go',
      menu_gamification: 'Play&Go',
      login_title: 'Play&Go',
      login_subtitle: 'Viaggia',
      login_warning: 'Warning! You must register to the system in order to log into the game',
      login_facebook: 'Login with Facebook',
      login_google: 'Login with Google',
      login_register: 'Register',
      labl_start_tracking: 'START',
      btn_start_tracking: 'START JOURNEY',
      labl_stop_tracking: 'STOP JOURNEY',
      dow_monday: 'Monday',
      dow_tuesday: 'Tuesday',
      dow_wednesday: 'Wednsday',
      dow_thursday: 'Thursday',
      dow_friday: 'Friday',
      dow_saturday: 'Saturday',
      dow_sunday: 'Sunday',
      dow_monday_short: 'M',
      dow_tuesday_short: 'T',
      dow_wednesday_short: 'W',
      dow_thursday_short: 'T',
      dow_friday_short: 'F',
      dow_saturday_short: 'S',
      dow_sunday_short: 'S',
      save_trip_recurrent: 'Recurrent',
      save_trip_alldays: 'All',
      notification_tracking_title: 'Play&Go',
      notification_tracking_text: 'Your journey is going to start',
      toast_after_time: 'It is too late for tracking the journey',
      toast_before_time: 'It is too early for tracking the journey',
      title_validateuser: 'Warning',
      lbl_validateuser: 'Register to the game and start playing!',
      btn_validate_user: 'Register',
      toast_already_monitoring: 'You are already tracking a journey',
      toast_already_monitored: 'The journey has already been tracked',
      sure_delete_title: 'Stop journey',
      sure_delete_text: 'Do you confirm you reached your destination?',
      tracking_notification_title: 'Viaggia Trento Play&Go',
      tracking_notification_text: 'Journey monitoring activated',
      toast_not_deletable: 'Impossible to delete a running journey',
      toast_deleted: 'Journey deleted',
      toast_not_modifiable: 'Impossible to modify a running journey',
      lbl_welcome_title: 'Play&Go',
      lbl_welcome_text: '<ul class="list-welcome"><li>Plan your journey</li><li>Save your journey</li><li>Remember to track your route when you do the journey!</li></ul>',
      btn_rules: 'RULES',
      btn_score: 'SCORE',
      user_check: 'Checking user...',
      credits_main_sponsors: 'Sponsors of final prizes:',
      registration_title: 'Welcome',
      registration_answer: 'Answer to these quick and easy questions in order to register to the game. The information you give will let the app better fit your needs and preferences.',
      registration_read: 'I have read and agreed the game\'s rules and the privacy terms:',
      registration_link_rule: 'Game\'s rules',
      registration_privacy: 'Privacy terms',
      registration_prizes: 'Prizes',
      registration_nick: 'Nickname:*',
      registration_nick_placeholder: 'Insert a nickname that will represent you in the game',
      registration_mail: 'Email:*',
      registration_mail_placeholder: 'Insert an email that will be used for communications',
      registration_age: 'Age:*',
      registration_km: 'Km travelled daily:*',
      registration_km_placeholder: 'Insert average km travelled daily',
      registration_public_transport: 'Do you use public transportation every day? ',
      registration_true: 'Yes',
      registration_false: 'No',
      registration_which_public_transport: 'Transport means usually used: ',
      registration_invite: 'Who has invited you to the game? (nickname)',
      registration_invite_placeholder: 'Insert the nickname of the person who has invited you',
      registration_transport_train: 'train',
      registration_transport_bus: 'bus',
      registration_transport_carsharing: 'shared car',
      registration_transport_bikesharing: 'shared bike',
      registration_transport_car: 'private car',
      registration_transport_bike: 'private bike',
      registration_transport_foot: 'walk',
      registration_must_accept: 'You must accept the game rules and privacy terms if you want to proceed with the registration',
      registration_empty_nick: 'The nickname is mandatory',
      registration_empty_email: 'The email is mandatory',
      registration_empty_age: 'The age is mandatory',
      registration_empty_km: 'Specify a valid distance value',
      registration_empty_transport: 'Choose at least one mean of transport',
      age_placeholder: 'Select the age range',
      age_option1: '< 20 years',
      age_option2: '20-40 years',
      age_option3: '40-60 years',
      age_option4: '> 60 years',
      nickname_inuse: 'This nickname is already in use',
      more_rules: 'Expand rules',
      less_rules: 'Collapse Rules',
      sponsor_week: 'THIS WEEK THE PRIZES ARE KINDLY OFFERED BY ',
      login_signup: 'REGISTER',
      login_signin: 'SIGN IN',
      signin_title: 'Sign in with your credentials',
      signin_pwd_reset: 'Forgot password?',
      text_login_use: 'or sign in with',
      error_popup_title: 'Error',
      error_generic: 'Registration failed. Please try again later.',
      error_email_inuse: 'Email address is already in use.',
      signup_name: 'Name',
      signup_surname: 'Surname',
      signup_email: 'Email',
      signup_pwd: 'Password',
      error_required_fields: 'All the fields are required',
      error_password_short: 'Password length should have at least 6 digits',
      signup_success_title: 'Registration completed!',
      signup_success_text: 'Complete the registration by clicking the link you can find in the email we have just sent you.',
      signup_resend: 'Send the verification mail again',
      error_signin: 'Invalid username/password',
      signup_signup: 'Register',
      signup_title: 'Register with',
      game_tab_points_label: 'POINTS',
      game_tab_challenges_label: 'CHALLENGES',
      game_tab_rankings_label: 'RANKING',
      no_saved_tracks_to_track: 'No saved trips found. Plan a trip and save it in order to start playing!',
      play_now: 'PLAY NOW!',
      play_now_sub: 'Start tracking a trip',
      track_walk: 'Walk',
      track_bike: 'Bike',
      track_saved: 'Planned',
      play_is_on: 'TRACKING IS ON',
      play_is_on_for: 'You are {{transport}} since {{time}} hours',
      stop_tracking: 'Stop tracking',
      track_walk_action: 'Walking',
      track_bike_action: 'Riding',
      track_other_action: 'Travelling',
      game_tab_challenges_filter_active: "Active",
      game_tab_challenges_filter_old: "Old",
      game_tab_challenges_info: "Challenge Info",
      gps_disabled_title: "Permission denied",
      gps_disabled_template: "Geolocation permission is disabled. The tracking of the current trip has been interrupted. Enable geolocation before starting a new trip.",
      pop_up_no_geo_title: 'Geolocation error',
      pop_up_no_geo_template: 'Warning! Your location cannot be retrieved. Enable location information in the device/app settings.',
      pop_up_low_accuracy_title: 'Warning',
      pop_up_low_accuracy_template: 'The acquired position is not accurate enough. This trip may become invalid. Do you want to keep tracking this trip?',
      pop_up_low_accuracy_button_go_on: 'Go on',
      pop_up_points_title: 'Congratulations!',
      pop_up_points_template: 'The journey has finished! Your score will be updated shortly.',
      pop_up_points_btn: 'See points',
      no_points_title: 'Warning',
      no_points: 'No points earned for this trip. The travelled distance is too short to award any points.',
      game_tab_challenges_filter_active: "Active",
      game_tab_challenges_filter_old: "Old",
      game_tab_challenges_info: "Challenge Info",
      game_tab_challenges_daysToEnd: "You have {{days}} days to complete the challenge!",
      game_tab_challenges_daysToEnd_1: "You have {{days}} day to complete the challenge!",
      game_tab_challenge_success_true: "You won!",
      game_tab_challenge_success_false: "You lost!",
      game_tab_challenges_status: "Completion",
      game_tab_challenges_status_final: "Final score",
      game_tab_ranking_filter_now: "Current week",
      game_tab_ranking_filter_last: "Last week",
      game_tab_ranking_filter_global: "Overall",
      game_tab_ranking_listheader_price: "Prize of the week",
      game_tab_ranking_listheader_position: "Position",
      game_tab_ranking_listheader_player: "Player",
      game_tab_ranking_listheader_points: "Points",
      game_tab_ranking_listheader_level: "Level",
      game_tab_diary_filter_badge: "Badge",
      game_tab_diary_filter_challenge: "Challenges",
      game_tab_diary_filter_trip: "Trips",
      game_tab_diary_filter_raccomandation: "Recommendation",
      game_tab_diary_filter_allnotifications: "All notifications",
      game_tab_statistics_filter_Daily: "Daily",
      game_tab_statistics_filter_Weekly: "Weekly",
      game_tab_statistics_filter_Monthly: "Monthly",
      game_tab_statistics_filter_Total: "Total",
      green_leaves_points: "Green Leaves Points",
      ranking_reload: "Reload",
      diary_title: "Game diary",
      statistics_title: "Game statistics",
      "green leaves": "Green Leaves",
      "bike aficionado": "Bike Trip Badge",
      "sustainable life": "Zero Impact Badge",
      "public transport aficionado": "Public Transport Badge",
      "park and ride pioneer": "Park And Ride Badge",
      "bike sharing pioneer": "Bike Sharing Badge",
      "recommendations": "User Recommendation Badge",
      "leaderboard top 3": "Leaderboard Top 3 Badge",
      "no_challenges": "No challenges at this moment",
      "no_challengables": "No players available",
      "no_badges": "No badges at the moment",
      "no_challenges_old": "No challenges found",
      "no_statistics": "No data found",
      no_ranking:"No ranking found",
      pop_up_invalid_tracking_title: "The trip is not valid",
      pop_up_invalid_tracking_template: "Trip details are not compatible with the type of transport chosen to track the trip. No Green Leaves Points will be awarded for this trip.",
      pop_up_plan: "Plan",
      wait_synch_running: "Wait, synchronization is ongoing",
      no_status: "Server communication error, no data available",
      toast_error_server_template: 'Server communication error',
      lbl_game_diary: 'Game diary',
      lbl_game_statistics: 'Game statistics',
      lbl_parking_meter: 'Parking Meter',
      lbl_parking_meter_price: 'Price:',
      lbl_parking_meter_orario: 'Time:',
      lbl_parking_meter_giorni: 'Days:',
      lbl_first_time_parking_meter_title: 'Warning',
      lbl_first_time_parking_meter_gps: 'To take full advantage of this feature, please enable the highest precision mode for location detection on your device.',
      lbl_first_time_parking_meter_compass: 'The accuracy of the directions for reaching the nearest parking meter depends also on the calibration of the compass on your device. (To find out how to improve it, please see your device\'s instructions).',
      btn_undertood: 'I got it',
      lbl_no_gps_title: 'Warning',
      lbl_no_gps_content: 'To take full advantage of this feature, please enable the highest precision mode for location detection on your device.',
      btn_drive_me: 'Take me there',
      lbl_calibration: 'Compass Calibration',
      lbl_calibration_content: 'Draw an “8” moving the device rightwards from a central point, as shown in the picture, until the compass is calibrated. After a couple of iteration of this movement the calibration should be completed.',
      lbl_distance: 'Distance:',
      lbl_parking_meter_payment_card: 'cash and card',
      lbl_parking_meter_payment_cash: 'cash',
      lbl_parking_meter_payment: 'Payment methods: ',
      msg_won_badge: ' You earned a new badge "{{badgeText}}"',
      msg_new_friend: 'Your friend {{recommendedNickname}} joined the game. You earned 20 Green Leaves!',
      msg_new_challenge: 'You have been assigned a new challenge "{{challengeName}}"',
      msg_won_challenge: 'YOU WON the challenge "{{challengeName}}"',
      msg_pub_ranking: 'This week\'s winners ranking is now available',
      msg_trip_walk: 'At {{time}}.<br> {{travelValidity}}, {{points}} points.',
      msg_trip_bike: 'At {{time}}.<br> {{travelValidity}}, {{points}} points.',
      msg_trip_bus: 'At {{time}}.<br> {{travelValidity}}, {{points}} points.',
      msg_trip_train: 'At {{time}}.<br> {{travelValidity}}, {{points}} points.',
      msg_trip_multimodal: 'At {{time}}.<br> {{travelValidity}}, {{points}} points.',
      msg_new_level: 'You reached the {{levelName}} level',
      travel_pending_state: 'Travel in validation',
      no_diary: 'No diary available',
      no_stats: 'No data found',
      statistic_total_label: "Total",
      VALID: 'Valid',
      INVALID: 'Not valid',
      PENDING: 'Validation in progress',
      label_not_valid: 'Not valid',
      label_valid: 'Valid',
      label_event_trip_detail_time: 'Time: ',
      label_event_trip_detail_from: 'From: ',
      label_event_trip_detail_to: 'To:',
      label_event_trip_detail_distance_walk: 'Walking distance: ',
      label_event_trip_detail_distance_bike: 'Bike dtsance: ',
      label_event_trip_detail_distance_bus: 'Bus distance: ',
      label_event_trip_detail_distance_car: 'Car distance: ',
      not_acc_label: 'This line is not accessible',
      btn_faq: 'FAQ',
      error_trip_no_data: "Trip validation is not possible: no data have been recorded for this trip",
      error_trip_out_of_area: "The trip is not valid since it is outside the Game area",
      error_trip_too_short: "The trip is not valid: the tracked distance is shorter than 250 meters",
      error_trip_free_tracking_no: "The trip is not valid: tracking mode does not correspond to declared transport mode",
      error_trip_planned_no: "The trip is not valid: tracked itinerary does not correspond to planned itinerary",
      error_valid_0: "No Green Leaves gained for this trips: daily limits have been reached (10 Km walking, 30 Km by bike, 8 public transport trips per day)",
      label_points: "Earned Green Leaves: ",
      pop_up_bt_title: "Bluetooth disabled",
      pop_up_bt: "To ensure a proper validation of bus and train trips we recommend activating Bluetooth on the device.",
      pop_up_bt_button_enable: "Activate",
      registration_wrong_chars: "Nickname not valid. Only letters or numbers are allowed",
      pop_up_always_GPS: "Warning",
      pop_up_always_GPS_template: "In order to use the application you have to set 'Allow Location Access' to 'Always'",
      pop_up_always_GPS_go_on: "Setting",
      pop_up_battery_save: "Battery Saver Mode Active",
      pop_up_battery_save_template: "Battery Saver Mode may cause inaccurate tracking and the validation may fail. In order to improve tracking precision, turn off \"Battery Saver Mode\"",
      home_footerbar_home: "HOME",
      home_footerbar_diary: "DIARY",
      home_footerbar_leaderboards: "LEADERBOARD",
      home_footerbar_real: "PUBLIC TRANSPORT`",
      mobility_title: "Mobility",
      profile_title: "Profile",
      home_your_challenges: "Weekly challenges",
      home_no_challenges: "No active challenges at the moment",
      profile_footerbar_points: "Points",
      profile_footerbar_challenges: "Challenges",
      profile_footerbar_statistics: "Statistics",
      pop_up_change_free_track_title: "Free tracking",
      pop_up_change_free_track_template: "Each part of multimodal journey will be validated individually and the score will be awarded based on the information tracked for each single part of the journey.",
      pop_up_change_free_track_go_on: "Confirm",
      user_level_label: "Level",
      user_points_label: "Green Leaves Points",
      user_stat_walk_label: "Km on foot",
      user_stat_bike_label: "Km by bike",
      user_stat_bus_label: "Km by bus",
      user_stat_train_label: "Km by train",
      change_image_template: "Do you want to change the profile picture?",
      change_image_title: "Profile Picture",
      change_image_confirm: "Change",
      registration_profile_image: "Choose your profile picture",
      menu_info_transports: "Mobility",
      diary_multimodal: "Multimodal",
      diary_single: "Single journey",
      challenge_future: "Future",
      challenge_past: "Old",
      challenge_unlock: "Types",
      warning_unlock_challenge: "Unlock a new type of challenge! You will be able to use it form your next challenge planning",
      warning_choose_challenge: "Plan next week's challenge. If you don't choose a challenge before Friday at 12.00 the system will automatically assign a single-player challenge",
      read_more: "read more",
      challenge_popup_title: "Unlock challenge",
      challenge_detail_popup_title: "Challenge detail",
      challenge_popup_template_groupCompetitiveTime: "Confirm to unlock competitive \"time based\" challenge and challenge other palyers.",
      challenge_popup_template_groupCompetitivePerformance: "Confirm to unlock competitive \"performance based\" challenge and challenge other palyers.",
      challenge_popup_template_groupCooperative: "Confirm to unlock collaborative challenge and challenge other palyers.",
      btn_got_it: "I got it",
      btn_challenge_accept: "Accept",
      btn_challenge_reject: "Reject",
      btn_challenge_choose: "Choose your opponent ",
      lbl_challenge_configure_type: "Come preferisci affrontare la sfida?",
      lbl_challenge_configure_opponent: "Choose your partner",
      lbl_challenge_configure_friend:"Choose your opponent",
      home_configure_challenge: "Challenge settings",
      lbl_challenge_choose_from_list: "Select form the list",
      ph_challenge_nick: "Insert nickname",
      lbl_challenge_calculate: "Calculate target",
      lbl_chall_choose_player_blacklist: "No available users",
      title_select_player: "Choose your opponent",
      button_select_player_done: "Done",
      lbl_challenge_request: "Send challenge invitation",
      lbl_challenge_target: "Goal: ",
      lbl_challenge_leaves_player: "Your Green Leaves: ",
      lbl_challenge_leaves_opponent: " ...  Green Leaves",
      toast_error_configure: "Choose the kind of challenge",
      btn_challenge_reject_sent: "delete invitation",
      lbl_sent_from: "Sent by ",
      lbl_sent_to: "Sent to ",
      challenge_comp_time: "Competitive time based challenge",
      challenge_cooperative: "Collaborative chellenge",
      challenge_comp_perf: "Competitive performance based challenge",
      challenge_single_player: "Single-user challenge",
      home_next_challenge: "Plan the next challenge",
      challenge_accept_popup_title: "Confirm the challenge",
      challenge_accept_popup_template: "If you confirm this challenge, all other options will be automatically deleted",
      lbl_challenge_unlock_next: "Reach the next level to unlock the challenge",
      user_next_level_label: " Green Leaves to next level",
      at_clock: " at ",
      at_day_opponent: " won on ",
      at_day: " on ",
      you_win: "YOU WON on ",
      you_lose: "YOU LOST ",
      user_chall_status: "Challenge completion status:  ",
      challenge_days_to_end: 'You still have {{challenge.daysToEnd}} days to complete the challenge.',
      payload_large: "Payload too large",
      payload_unsupported: "Unsupported media type",
      toast_type_unlocked: "Type of challenge unlocked!",
      groupCompetitivePerformance_desc_short:" Who endures wins",
      groupCompetitivePerformance_desc_long:"Choose the goal and challenge another player. At the end of the week, the one giving the best performance will be the winner.",
      groupCompetitiveTime_desc_short:" May the fastest win",
      groupCompetitiveTime_desc_long:" Challenge another player in a speed competition. The one that reaches the goal first wins.",
      groupCooperative_desc_short:"Unity is strength",
      groupCooperative_desc_long:"Invite another user to play with you on a common goal. To win, the sum of what you do individually during the week has to be at least equal to the target of the challenge.",
      Walk_Km:" Km",
      Bike_Km:" Km",
      Green_Leaves:"Green Leaves",
      lbl_chall_blacklist:"You cannot invite the player to a challenge. This happens when one or more of the following applies: the player has a too much higher (or lower) level in comparison to yours, the player has already received three requests, the player has already programmed the challenge for the next week, the player blacklisted you, or you blacklisted the player.",
      lbl_insert_nickname:"Insert the player's nickname",
      lbl_challenge_percentage:"Percentage:",
      lbl_challenge_threshold:"Threshold:",
      home_unlock_challenge:"Unlock a new challenge",
      lbl__challenge_cant_see_player:"Why can't I find a player?",
      no_blacklist:"No blacklist found",
      lbl_chall_user_not_available_title:"User not available",
      lbl_chall_user_not_available:"Selected user is not available anymore. Please, select a different one"  

   

    });

    $translateProvider.preferredLanguage(DEFAULT_LANG);
    $translateProvider.fallbackLanguage(DEFAULT_LANG);
    $compileProvider.aHrefSanitizationWhitelist(/.*/);
  });
