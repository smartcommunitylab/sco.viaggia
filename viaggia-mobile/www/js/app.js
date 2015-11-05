// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('viaggia', [
    'ionic',
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
    'viaggia.controllers.common',
    'viaggia.controllers.table1',
    'viaggia.controllers.table2',
    'viaggia.controllers.timetable',
    'viaggia.controllers.bookmarks',
    'viaggia.controllers.home',
    'viaggia.controllers.info',
    'viaggia.controllers.mytrips',
    'viaggia.controllers.monitoring',
    'viaggia.controllers.news',
    'viaggia.controllers.notifications',
    'viaggia.controllers.plan',
    'viaggia.controllers.planlist',
    'viaggia.controllers.tripdetails',
    'viaggia.services.data',
    'viaggia.services.conf',
    'viaggia.services.map',
    'viaggia.services.plan',
    'viaggia.services.timetable',
    'viaggia.services.info',
    'viaggia.directives',

])

.run(function ($ionicPlatform, DataManager, $cordovaFile, Config) {

        $ionicPlatform.ready(function () { // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }
            Config.init().then(function () {
                if (ionic.Platform.isWebView()) {
                    DataManager.dbSetup();
                }
            });
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
            })
            .state('app.plan', {
                cache: false,
                url: "/plan",
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
            }).state('app.tripdetails', {
                cache: false,
                url: "/tripdetails",
                views: {
                    'menuContent': {
                        templateUrl: "templates/tripdetails.html",
                        controller: 'TripDetailsCtrl'
                    }
                }
            }).state('app.news', {
                cache: false,
                url: "/news",
                views: {
                    'menuContent': {
                        templateUrl: "templates/news.html",
                        controller: 'NewsCtrl'
                    }
                }
            }).state('app.info', {
                cache: false,
                url: "/info",
                views: {
                    'menuContent': {
                        templateUrl: "templates/info.html",
                        controller: 'InfoCtrl'
                    }
                }
            }).state('app.bookmarks', {
                cache: false,
                url: "/bookmarks",
                views: {
                    'menuContent': {
                        templateUrl: "templates/bookmarks.html",
                        controller: 'BookmarksCtrl'
                    }
                }
            }).state('app.notfications', {
                cache: false,
                url: "/notfications",
                views: {
                    'menuContent': {
                        templateUrl: "templates/notifications.html",
                        controller: 'NotficationsCtrl'
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
            .state('app.ttgroup', {
                cache: false,
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
                url: "/tt/:ref/:agencyId/:groupId/:routeId",
                views: {
                    'menuContent': {
                        templateUrl: "templates/table1.html",
                        controller: 'TTCtrl'
                    }
                }
            })

            .state('app.parking', {
                cache: false,
                url: "/parking/:agencyId",
                views: {
                    'menuContent': {
                        templateUrl: "templates/parking.html",
                        controller: 'ParkingCtrl'
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
            });


        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/app/home');

        $translateProvider.translations('it', {
            appName: 'Viaggia Trento',
            menu_home: 'Home',
            menu_plan: 'Pianifica viaggio',
            menu_mytrip: 'I miei viaggi',
            menu_news: 'News e avvisi',
            menu_info: 'Info e tariffe',
            menu_bookmarks: 'Preferiti',
            menu_notifications: 'Notifiche',
            menu_info_real_time: 'Info in tempo reale',
            menu_monitoring: 'Monitoring',
            menu_real_time_bus_urban: 'Autobus Urbani',
            menu_real_time_bus_suburban: 'Autobus Extraurbani',
            menu_real_time_train: 'Treni',
            menu_real_time_bike: 'Biciclette condivise',
            menu_real_time_park: 'Parcheggi',
            menu_credits: "Credits",
            menu_login: "Login",
            menu_logout: "Logout",
            plan_from: 'Da',
            plan_to: 'A',
            plan_day: 'Giorno',
            plan_time: 'Ora',
            plan_preferences: 'PREFERENZE',
            plan_preferences_fastest: 'Itinerario piu veloce',
            plan_preferences_leastChanges: 'Con meno cambi',
            plan_preferences_leastWalking: 'Minimo tragitto a piedi',
            plan_map_title: 'Seleziona l\' indirizzo',
            pop_up_loading: 'Caricamento...',
            pop_up_cancel: 'Cancella',
            pop_up_ok: 'Ok',
            pop_up_no_connection_title: 'Errore',
            pop_up__no_connection_template: 'Nessuna Connessione',
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
            popup_datepicker_jfeb: 'Feb',
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
            journey_details_to: 'A ',
            journey_details_from: 'Da ',
            journey_details_from_bike: 'Prendi una bicicletta alla stazione di bike sharing ',
            journey_details_to_bike: 'Lascia la bicicletta alla stazione di bike sharing',
            lbl_delays: 'DELAYS',
            lbl_trips: 'TYPE',
            no_data: 'Nessun risultato trovato.',
            map_detail_title: 'Dettaglio percorso'

        });


        $translateProvider.translations('en', {
            appName: 'Viaggia Trento',
            menu_home: 'Home',
            menu_plan: 'Plan journey',
            menu_mytrip: 'My journeys',
            menu_news: 'News',
            menu_info: 'Info and rates',
            menu_bookmarks: 'Bookmarks',
            menu_notifications: 'Notifications',
            menu_info_real_time: 'Real Time information',
            menu_monitoring: 'Monitoring',
            menu_real_time_bus_urban: 'Urban Bus',
            menu_real_time_bus_suburban: 'Suburban Bus',
            menu_real_time_train: 'Trains',
            menu_real_time_bike: 'Shared bikes',
            menu_real_time_park: 'Parking lots',
            menu_credits: "Credits",
            menu_login: "Login",
            menu_logout: "Logout",
            plan_from: 'From',
            plan_to: 'To',
            plan_day: 'Day',
            plan_time: 'Time',
            plan_preferences: 'PREFERENCES',
            plan_preferences_fastest: 'Fastest',
            plan_preferences_leastChanges: 'Least changes',
            plan_preferences_leastWalking: 'Least walking',
            plan_map_title: 'Select the address',
            pop_up_loading: 'Loading...',
            pop_up_cancel: 'Cancel',
            pop_up_ok: 'Ok',
            pop_up_no_connection_title: 'Error',
            pop_up__no_connection_template: 'No Connection',
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
            popup_datepicker_jfeb: 'Feb',
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
            journey_details_to: 'From ',
            journey_details_from: 'To ',
            journey_details_from_bike: 'Take a bike at the bike sharing station ',
            journey_details_to_bike: 'Leave the bike at the bike sharing station ',
            lbl_delays: 'DELAYS',
            lbl_trips: 'TYPE',
            no_data: 'No data found.',
            map_detail_title: 'Dettaglio percorso'

        });


        $translateProvider.preferredLanguage("it");
        $translateProvider.fallbackLanguage("it");
    });
