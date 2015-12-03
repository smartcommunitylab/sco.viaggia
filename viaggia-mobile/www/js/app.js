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
    'viaggia.controllers.common',
    'viaggia.controllers.table1',
    'viaggia.controllers.table2',
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
    'viaggia.controllers.planlist',
    'viaggia.controllers.tripdetails',
    'viaggia.services.data',
    'viaggia.services.conf',
    'viaggia.services.map',
    'viaggia.services.plan',
    'viaggia.services.timetable',
    'viaggia.services.markets',
    'viaggia.services.info',
    'viaggia.directives',
    'viaggia.services.geo',
    'viaggia.filters'
])

.run(function ($ionicPlatform, $cordovaFile, $rootScope, $translate, DataManager, Config, GeoLocate) {

        $rootScope.locationWatchID = undefined;

        document.addEventListener("pause", function () {
            console.log('app paused');
            if (typeof $rootScope.locationWatchID != 'undefined') {
                navigator.geolocation.clearWatch($rootScope.locationWatchID);
                $rootScope.locationWatchID = undefined;
                GeoLocate.reset();
                console.log('geolocation reset');
            }
        }, false);

        document.addEventListener("resume", function () {
            console.log('app resumed');
            GeoLocate.locate();
        }, false);

        GeoLocate.locate().then(function (position) {
            $rootScope.myPosition = position;
            //console.log('first geolocation: ' + position);
        }, function () {
            console.log('CANNOT LOCATE!');
        });

        //        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
        //          console.log(toState);
        //        });

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
                } else {
                    DataManager.syncStopData();
                }
            });

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
        });
    })
    .config(function ($stateProvider, $urlRouterProvider, $translateProvider, $ionicConfigProvider) {
        $ionicConfigProvider.views.swipeBackEnabled(false);
        $stateProvider.state('app', {
            url: "/app",
            abstract: true,
            templateUrl: "templates/menu.html",
            controller: 'AppCtrl'
        })

        .state('app.home', {
                //                cache: false,
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
                //                cache: false,
                url: "/ttlist/:ref",
                views: {
                    'menuContent': {
                        templateUrl: "templates/ttroutelist.html",
                        controller: 'TTRouteListCtrl'
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
                url: "/ttstop",
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
                url: "/tt/:ref/:agencyId/:groupId/:routeId",
                views: {
                    'menuContent': {
                        templateUrl: "templates/table1.html",
                        controller: 'TTCtrl'
                    }
                }
            })

        .state('app.parking', {
                //                cache: false,
                url: "/parking/:agencyId",
                views: {
                    'menuContent': {
                        templateUrl: "templates/parking.html",
                        controller: 'ParkingCtrl'
                    }
                }
            })
            .state('app.bikesharing', {
                //                cache: false,
                url: "/bikesharing/:agencyId",
                views: {
                    'menuContent': {
                        templateUrl: "templates/bikesharing.html",
                        controller: 'BikeSharingCtrl'
                    }
                }
            }).state('app.markets', {
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
            plan_preferences: 'Preferenze',
            plan_preferences_fastest: 'Itinerario piu veloce',
            plan_preferences_leastChanges: 'Con meno cambi',
            plan_preferences_leastWalking: 'Minimo tragitto a piedi',
            plan_map_title: 'Seleziona l\' indirizzo',
            plan_insert_to_address: 'Inserisci l\'indirizzo di destinazione',
            plan_insert_from_address: 'Inserisci l\'indirizzo di partenza',
            add_favorites_template: 'Vuoi aggiungere l\'indirizzo ai tuoi preferiti?',
            add_favorites_title: 'Aggiungi a preferiti',
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
            journey_details_sustainable: 'Itinerario sostenibile ',
            journey_details_modify: 'Modifica',
            journey_details_delete: 'Cancella',
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
            btn_nav_to: 'Indicazioni stradali',
            btn_next_trips: 'Vedi prossimi orari',
            lbl_stop: 'Fermata',
            err_too_many_markers: 'Too many objects on the map. Please zoom in.',
            lbl_lines: 'Corse:',
            lbl_line: 'Linea',
            popup_delete_trip_message: 'Sicuro di voler cancellare il viaggio salvato?',
            popup_delete_trip_title: 'Cancella',
            tripdeleted_message_feedback: 'Il viaggio selezionato è stato cancellato',
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
            credits_sponsored: 'Con la collaborazione di:',
            credits_info: 'Per informazioni:',
            credits_licenses_button: 'VEDI LICENZE',
            favorites_title_list: 'Indirizzi preferiti',
            plan_title: 'Pianifica viaggio',
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
            action_move: 'Prosegui',
            parking_search_time: 'Trova parcheggio: ',
            error_select_type_feedback: 'Selezionare almeno un mezzo di trasporto',
            planlist_empty_list: 'La ricerca non ha prodotto risultati validi',
            no_tt: 'In questa giornata non ci sono corse disponibili per questa linea.'

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
            plan_preferences: 'Preferences',
            plan_preferences_fastest: 'Fastest',
            plan_preferences_leastChanges: 'Least changes',
            plan_preferences_leastWalking: 'Least walking',
            plan_map_title: 'Select the address',
            plan_insert_to_address: 'Insert destination address',
            plan_insert_from_address: 'Insert starting address',
            add_favorites_template: 'Do you wann add this address in your favorites?',
            add_favorites_title: 'Add to favorites',
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
            journey_details_sustainable: 'Sustainable journey ',
            journey_details_modify: 'Modify',
            journey_details_delete: 'Delete',
            journey_details_to: 'From ',
            journey_details_from: 'To ',
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
            save_trip_save_button: 'Salva',
            save_trip_close_button: 'Chiudi',
            save_trip_error_message: 'Inserire un nome valido',
            tripsaved_message_feedback: 'Journey correctly saved',
            btn_close: 'Close',
            btn_nav_to: 'Directions',
            btn_next_trips: 'See next trips',
            lbl_stop: 'Stop',
            err_too_many_markers: 'Too many objects on the map. Please zoom in.',
            lbl_lines: 'Lines:',
            lbl_line: 'Line',
            popup_delete_trip_message: 'Are you sure to delete the saved journey?',
            popup_delete_trip_title: 'Delete',
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
            credits_sponsored: 'In collaboration with:',
            credits_info: 'Further information:',
            credits_licenses_button: 'READ LICENSES',
            favorites_title_list: 'Favorite places',
            plan_title: 'Plan journey',
            journey_detail: 'Journey detail',
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
            action_park: 'Leave the car to ',
            action_move: 'Move ',
            parking_search_time: 'Time to park: ',
            error_select_type_feedback: 'Select at least one mean of transport ',
            planlist_empty_list: 'Your search did not match any journey',
            no_tt: 'No trips available for this line on this date.'

        });


        $translateProvider.preferredLanguage("it");
        $translateProvider.fallbackLanguage("it");
    });
