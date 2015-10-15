// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('viaggia', [
    'ionic',
    'ngCordova',
    'ngSanitize',
    'pascalprecht.translate',
    'viaggia.controllers.common',
    'viaggia.controllers.home',
    'viaggia.services.data',
    'viaggia.services.conf'
])

.run(function ($ionicPlatform, DataManager, $cordovaFile) {

        $ionicPlatform.ready(function () { // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }

            DataManager.dbSetup();
        });
    })
    .config(function ($stateProvider, $urlRouterProvider, $translateProvider) {
        $stateProvider.state('app', {
            url: "/app",
            abstract: true,
            templateUrl: "templates/menu.html",
            controller: 'AppCtrl'
        })

        .state('app.home', {
            cache: false,
            url: "/home",
            views: {
                'menuContent': {
                    templateUrl: "templates/home.html",
                    controller: 'HomeCtrl'
                }
            }
        });


        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/app/home');

        $translateProvider.translations('it', {
            menu_home: 'Home',
            appName: 'Viaggia Trento'
        });


        $translateProvider.translations('en', {
            menu_home: 'Home',
            appName: 'Viaggia Trento'
        });


        $translateProvider.preferredLanguage("it");
        $translateProvider.fallbackLanguage("it");
    });
