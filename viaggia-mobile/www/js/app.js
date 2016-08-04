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
    'viaggia.controllers.taxi',
    'viaggia.controllers.planlist',
    'viaggia.controllers.tripdetails',
    'viaggia.controllers.login',
    'viaggia.controllers.registration',
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
    'viaggia.services.login',
    'viaggia.services.registration',
    'viaggia.filters'
])

.run(function ($ionicPlatform, $cordovaFile, $rootScope, $translate, DataManager, Config, GeoLocate, loginService, $q, notificationService) {

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
            notificationService.register();

        });
    })
    .config(function ($stateProvider, $compileProvider, $urlRouterProvider, $translateProvider, $ionicConfigProvider) {
        $ionicConfigProvider.views.swipeBackEnabled(false);
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
                params: {
                    'replan': false
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
                url: "/tripdetails/:tripId",
                views: {
                    'menuContent': {
                        templateUrl: "templates/tripdetails.html",
                        controller: 'TripDetailsCtrl'
                    }
                }
            }).state('app.newtripdetails', {
                cache: false,
                url: "/tripdetails",
                views: {
                    'menuContent': {
                        templateUrl: "templates/tripdetails.html",
                        controller: 'TripDetailsCtrl'
                    }
                }
            }).state('app.news', {
                cache: true,
                url: "/news",
                views: {
                    'menuContent': {
                        templateUrl: "templates/news.html",
                        controller: 'NewsCtrl'
                    }
                }
            }).state('app.newsitem', {
                cache: false,
                url: "/newsitem/:id",
                views: {
                    'menuContent': {
                        templateUrl: "templates/newsitem.html",
                        controller: 'NewsItemCtrl'
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
            }).state('app.notifications', {
                cache: true,
                url: "/notifications",
                views: {
                    'menuContent': {
                        templateUrl: "templates/notifications.html",
                        controller: 'NotificationsCtrl'
                    }
                }
            }).state('app.notificationdetail', {
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
            .state('app.bikesharing', {
                //                cache: false,
                url: "/bikesharing/:agencyId",
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
            .state('app.signup', {
                cache: false,
                url: "/registration",
                views: {
                    'menuContent': {
                        templateUrl: "templates/registration.html",
                        controller: 'RegistrationCtrl'
                    }
                }
            });


        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/app/home');

        $translateProvider.translations('it', {
            menu_home: 'Home',
            menu_plan: 'Pianifica viaggio',
            menu_mytrip: 'I miei viaggi',
            menu_news: 'News',
            menu_info: 'Info e tariffe',
            menu_bookmarks: 'Preferiti',
            menu_notifications: 'Avvisi',
            menu_info_real_time: 'Info in tempo reale',
            menu_monitoring: 'Monitoring',
            menu_real_time_bus_urban: 'Autobus Urbani',
            menu_real_time_bus_suburban: 'Autobus Extraurbani',
            menu_real_time_train: 'Treni',
            menu_real_time_bike: 'Biciclette condivise',
            menu_real_time_park: 'Parcheggi',
            menu_taxi: 'Taxi',
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
            plan_map_title: 'Seleziona l\'indirizzo',
            plan_insert_to_address: 'Inserisci l\'indirizzo di destinazione',
            plan_insert_from_address: 'Inserisci l\'indirizzo di partenza',
            add_favorites_template: 'Vuoi aggiungere l\'indirizzo ai tuoi preferiti?',
            add_favorites_title: 'Aggiungi a preferiti',
            pop_up_loading: 'Caricamento...',
            pop_up_cancel: 'Annulla',
            pop_up_ok: 'Ok',
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
            popup_delete_trip_message: 'Sicuro di voler eleminare il viaggio salvato?',
            popup_delete_trip_title: 'Elimina',
            tripdeleted_message_feedback: 'Il viaggio selezionato è stato eliminato',
            my_trip_empty_list: 'Non ci sono viaggi salvati',
            my_trip_from: 'Da',
            my_trip_to: 'A',
            my_trip_time: 'Partenza',
            my_trip_endtime: 'Arrivo',
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
            empty_home_label_1: 'Ops... hai nascosto tutte le schede della pagina principale',
            empty_home_label_2: 'Vai nei PREFERITI per ripristinare i contenuti che ti interessano',
            menu_betatesting_bug: 'Segnala un problema',
            news_empty_list: 'Non ci sono notizie in questo momento',
            news_title: 'News',
            popup_modify_trip_title: 'Modifica',
            popup_modify_trip_message: 'Sicuro di voler modificare il viaggio salvato?',
            plan_preferences_fastest: 'Itinerario piu veloce',
            plan_preferences_leastChanges: 'Con meno cambi',
            plan_preferences_leastWalking: 'Minimo tragitto a piedi',
            lbl_taxi_station: 'Stazione Taxi',
            taxi_label_your_position: 'La tua posizione attuale, rilevata dal dispositivo, è: ',
            taxi_label_check_it: 'Verificala prima di comunicarla al taxi.',
            taxi_label_no_accuracy: 'Non è stato possibile determinare la tua posizione con sufficiente accuratezza per permetterti di comunicarla al tassista. Prova ad accendere un sistema di localizzazione sul tuo dispositivo (GPS, WiFi, ...).',
            error_select_type_accessibility_feedback: 'Per visualizzare un percorso accessibile è necessario selezionare i mezzi pubblici o a piedi',
            not_acc_label: 'Questa linea non è accessibile',
            login_warning: 'Attenzione! Per accedere alle funzionalia devi essere registrato al sistema',
            login_facebook: 'Accedi con Facebook',
            login_google: 'Accedi con Google',
            login_register: 'Registrati',
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
            login_popup_title: 'Login',
            login_popup_template: 'Per accedere a questa funzionalità devi effettuare il login',
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
            sign_in_success: 'Accesso effettuato con successo',
            user_check: 'Verifica utente',
            sign_out_success: 'Logout effettuato con successo'



        });


        $translateProvider.translations('en', {
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
            menu_taxi: 'Taxi',
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
            add_favorites_template: 'Add this address to favorites?',
            add_favorites_title: 'Add to favorites',
            pop_up_loading: 'Loading...',
            pop_up_cancel: 'Cancel',
            pop_up_ok: 'Ok',
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
            tripdeleted_message_feedback: 'The selected journey has been deleted',
            my_trip_empty_list: 'No saved journeys',
            my_trip_from: 'From',
            my_trip_to: 'To',
            my_trip_time: 'Start',
            my_trip_endtime: 'Stop',
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
            action_cablecar: 'Take the cableway ',
            action_move: 'Move ',
            parking_search_time: ' searching time',
            error_select_type_feedback: 'Select at least one mean of transport ',
            planlist_empty_list: 'Your search did not match any journey',
            no_tt: 'No trips available for this line on this date.',
            lbl_no_trips: 'No lines due in the next 24 hours.',
            notifications_empty_list: 'There are no notification at the moment',
            notifications_title: 'Notifications',
            notifications_detail_title: 'Notification detail',
            bikesharings_distance: 'Distance: ',
            parking_cost: 'Parking cost: ',
            parking_time: 'Parking average time: ',
            tutorial_next: 'NEXT',
            tutorial_end: 'END',
            tutorial_skip: 'SKIP',
            empty_home_label_1: 'Oops... you removed all the tabs from the main page',
            empty_home_label_2: 'Go to BOOKMARKS to restore the contents you are interested in',
            menu_betatesting_bug: 'Report an issue',
            news_empty_list: 'There are no news at the moment',
            news_title: 'News',
            popup_modify_trip_title: 'Modify',
            popup_modify_trip_message: 'Are you sure to modify the saved journey?',
            plan_preferences_fastest: 'Fastest',
            plan_preferences_leastChanges: 'Least changes',
            plan_preferences_leastWalking: 'Least walking',
            lbl_taxi_station: 'Taxi Station',
            taxi_label_your_position: 'You current position, as detected by the device, is:',
            taxi_label_check_it: 'Check it before communicating it to the taxi driver.',
            taxi_label_no_accuracy: 'It has not been possible to determine with sufficient accuracy your position to let you communicate it to the taxi driver. Try to switch on a tracking system on your device (GPS, WiFi, ...)',
            error_select_type_accessibility_feedback: 'In order to get an accessible route, you must select public transport or foot',
            not_acc_label: 'This line is not accessible',
            login_warning: 'Warning! To access these functionallities you have to be registered to the system',
            login_facebook: 'Login with Facebook',
            login_google: 'Login with Google',
            login_register: 'Register',
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
            error_password_short: 'Password length should be at least 6 symbols',
            signup_success_title: 'Registration complete!',
            signup_success_text: 'Complete the registration by clicking the link you can find in the mail we have just sent you.',
            signup_resend: 'Re-send the verification mail',
            error_signin: 'Username/password invalid',
            signup_signup: 'Register',
            signup_title: 'Register with',
            login_popup_title: 'Login',
            login_popup_template: 'In orer to access to this functionality you must login',
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
            sign_in_success: 'Login succeeded',
            user_check: 'Check user',
            sign_out_success: 'Logout succeeded'
        });


        $translateProvider.preferredLanguage(DEFAULT_LANG);
        $translateProvider.fallbackLanguage(DEFAULT_LANG);
        $compileProvider.aHrefSanitizationWhitelist(/.*/);
    });
