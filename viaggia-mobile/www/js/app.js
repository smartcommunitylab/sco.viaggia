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
  'viaggia.controllers.timetable',
  'viaggia.controllers.bookmarks',
  'viaggia.controllers.home',
  'viaggia.controllers.info',
  'viaggia.controllers.mytrips',
  'viaggia.controllers.news',
  'viaggia.controllers.notifications',
  'viaggia.controllers.plan',
  'viaggia.controllers.taxi',
  'viaggia.controllers.pois',
  'viaggia.controllers.planlist',
  'viaggia.controllers.tripdetails',
  'viaggia.services.data',
  'viaggia.services.conf',
  'viaggia.services.map',
  'viaggia.services.plan',
  'viaggia.services.timetable',
  'viaggia.services.info',
  'viaggia.services.taxi',
  'viaggia.services.pois',
  'viaggia.services.notification',
  'viaggia.directives',
  'viaggia.services.geo',
  'viaggia.services.bookmarks',
  'viaggia.filters',
  'viaggia.services.profile'
])

  .run(function ($ionicPlatform, $cordovaFile, $rootScope, $translate, DataManager, Config, GeoLocate, notificationService) {

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
      localStorage.removeItem(Config.getAppId() + "_diaryRefresh");
      localStorage.removeItem(Config.getAppId() + "_challengesRefresh");
      localStorage.removeItem(Config.getAppId() + "_homeRefresh");
      localStorage.removeItem(Config.getAppId() + "_rankingRefresh");
    }

    $ionicPlatform.ready(function () {
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
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }
      // if (window.StatusBar) {
      //   StatusBar.styleDefault();
      // }
      Config.init().then(function () {
        notificationService.register();
        if (ionic.Platform.isWebView()) {
          //we are on a phone so synch the database
          DataManager.dbSetup();
        } else {
          //we are on a website so synch only the stops
          DataManager.syncStopData();
        }
      });
      if (window.ga) {
        window.ga.startTrackerWithId('UA-93674885-1', 30);
      }
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
        url: "/parking/:agencyId",
        views: {
          'menuContent': {
            templateUrl: "templates/parking.html",
            controller: 'ParkingCtrl'
          }
        }
      })
      .state('app.parkingMeters', {
        url: "/parkingMeters",
        cache: false,
        views: {
          'menuContent': {
            templateUrl: "templates/mapParkingMeters.html",
            controller: 'ParkingMetersCtrl'
          }
        }
      })
      .state('app.parkingstation', {
        url: "/parking/:agencyId/:id",
        views: {
          'menuContent': {
            templateUrl: "templates/parking.html",
            controller: 'ParkingCtrl'
          }
        }
      })
      .state('app.bikesharing', {
        url: "/bikesharing/:agencyId",
        views: {
          'menuContent': {
            templateUrl: "templates/bikesharing.html",
            controller: 'BikeSharingCtrl'
          }
        }
      })

      .state('app.bikestation', {
        url: "/bikesharing/:agencyId/:id",
        views: {
          'menuContent': {
            templateUrl: "templates/bikesharing.html",
            controller: 'BikeSharingCtrl'
          }
        }
      })
      .state('app.taxi', {
        //cache: false,
        url: "/taxi",
        views: {
          'menuContent': {
            templateUrl: "templates/taxi.html",
            controller: 'TaxiCtrl'
          }
        }
      })
      .state('app.pois', {
        //cache: false,
        url: "/pois",
        views: {
          'menuContent': {
            templateUrl: "templates/pois.html",
            controller: 'POIsCtrl'
          }
        }
      })
      .state('app.poi', {
        //cache: false,
        url: "/poi/:poiId",
        views: {
          'menuContent': {
            templateUrl: "templates/poi.html",
            controller: 'POICtrl'
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
      menu_info_transports: 'Info trasporti',
      menu_monitoring: 'Monitoring',
      menu_real_time_bus_urban: 'Autobus Urbani',
      menu_real_time_bus_extraurban: 'Autobus Extraurbani',
      menu_real_time_bus_suburban: 'Autobus Suburbani',
      menu_real_time_transport_local: 'Trasporti locali',
      menu_real_time_train: 'Treni',
      menu_real_time_bike: 'Biciclette condivise',
      menu_real_time_park: 'Parcheggi',
      menu_taxi: 'Taxi',
      menu_ncc: 'Noleggio con conducente',
      menu_credits: "Credits",
      menu_quest: "Questionario",
      menu_pois: "Punti di interesse",
      menu_login: "Login",
      menu_logout: "Logout",
      menu_parking_meters: "Parcometri",
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
      tripdeleted_message_feedback: 'Il viaggio selezionato è stato eliminato',
      my_trip_empty_list: 'Non ci sono viaggi salvati',
      my_trip_from: 'Da',
      my_trip_to: 'A',
      my_trip_time: 'Partenza',
      favorites_empty_list: 'Non ci sono favoriti memorizzati',
      pop_up_error_server_title: 'Errore',
      pop_up_error_server_template: 'Errore di comunicazione con il server',
      toast_error_server_template: 'Errore di comunicazione con il server',
      error_from_message_feedback: 'Luogo di partenza non valido',
      error_to_message_feedback: 'Luogo di destinazione non valido',
      error_time_message_feedback: 'Selezionare un\'ora recente',
      credits_project: 'Un progetto di:',
      credits_sponsored: 'In collaborazione con:',
      credits_participation: 'Con la participazione di:',
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
      lbl_NCC_station: 'Stazione NCC',
      taxi_label_your_position: 'La tua posizione attuale, rilevata dal dispositivo, è: ',
      taxi_label_check_it: 'Verificala prima di comunicarla al taxi.',
      NCC_label_check_it: 'Verificala prima di comunicarla all\'operatore.',
      taxi_label_ncc_check_it: 'Verificala prima di comunicarla al taxi.',
      taxi_label_price: 'La tariffa viene di volta in volta concordata tra operatore e cliente.',
      taxi_label_no_accuracy: 'Non è stato possibile determinare la tua posizione con sufficiente accuratezza per permetterti di comunicarla al tassista. Prova ad accendere un sistema di localizzazione sul tuo dispositivo (GPS, WiFi, ...).',
      error_select_type_accessibility_feedback: 'Per visualizzare un percorso accessibile è necessario selezionare i mezzi pubblici o a piedi',
      not_acc_label: 'Questa linea non è accessibile',
      alert_delay: 'Ritardo di {{mins}} minuti',
      parking_pickup_alert_car: 'Solo {{num}} auto disponibili',
      parking_pickup_alert_bike: 'Solo {{num}} bici disponibili',
      parking_alert: 'Solo {{num}} posti disponibili',
      lbl_parking_meter: 'Parchimetro',
      lbl_parking_meter_price: 'Tariffa oraria:',
      lbl_parking_meter_orario: 'Orario:',
      lbl_parking_meter_giorni: 'Giorni:',
      lbl_first_time_parking_meter_title: 'Attenzione',
      lbl_first_time_parking_meter_gps: 'Per utilizzare al meglio questa funzionalità si consiglia di impostare sul dispositivo il rilevamento della posizione sulla modalità di precisione più elevata.',
      lbl_first_time_parking_meter_compass: 'L’accuratezza della direzione indicata dalla app per raggiungere il parcometro più vicino dipende anche dall’esatta calibrazione della bussola del tuo dispositivo. (Per sapere come migliorarla, consulta le istruzioni del tuo dispositivo)',
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
      home_guest_card: 'Servizi Guest Card',
      pop_up_expired_title: 'Versione scaduta',
      pop_up__expired_template: 'Ci scusiamo ma non è più possibile utilizzare questa versione dell\'applicazione in quanto il periodo di prova è terminata',
      pop_up_not_expired_title: 'Versione di prova',
      pop_up_not_expired_template: 'Questa  è una versione di prova e terminerà il ',
      label_warning_corona_title: 'ATTENZIONE: nuove disposizioni in vigore dal 31 maggio 2020',
      label_warning_corona_message: 'Viene ripristinato il servizio festivo. Tocca per ulteriori INFO',
      message_popup_first: 'Viene ripristinato il servizio festivo, con orario ridotto, per i Servizi Urbani di ',
      message_popup_second: ' e ',
      message_popup_third: 'e la ',
      message_popup_forth: ' Funivia Trento - Sardagna',
      message_popup_fifth: 'Rimane disponibile il servizio Elastibus. Per consultare le disposizioni in vigore clicca ',
      message_popup_sixth: 'QUI' 


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
      menu_info_transports: 'Transport information',
      menu_monitoring: 'Monitoring',
      menu_real_time_bus_urban: 'Urban Bus',
      menu_real_time_bus_extraurban: 'Extraurban Bus',
      menu_real_time_bus_suburban: 'Suburban Bus',
      menu_real_time_transport_local: 'Local transport',
      menu_real_time_train: 'Trains',
      menu_real_time_bike: 'Shared bikes',
      menu_real_time_park: 'Parking lots',
      menu_taxi: 'Taxi',
      menu_ncc: 'Rent with driver',
      menu_credits: "Credits",
      menu_quest: "Survey",
      menu_pois: "Points of Interest",
      menu_login: "Login",
      menu_logout: "Logout",
      menu_parking_meters: "Parking meters",
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
      tripdeleted_message_feedback: 'The selected journey has been deleted',
      my_trip_empty_list: 'No saved journeys',
      my_trip_from: 'From',
      my_trip_to: 'To',
      my_trip_time: 'Start',
      favorites_empty_list: 'No saved favorites',
      pop_up_error_server_title: 'Error',
      pop_up_error_server_template: 'We had some communication problems',
      toast_error_server_template: 'We had some communication problems',
      error_from_message_feedback: 'Starting point is not valid',
      error_to_message_feedback: 'Destination point is not valid',
      error_time_message_feedback: 'Choose a recent hour',
      credits_project: 'A project by:',
      credits_sponsored: 'In collaboration with:',
      credits_participation: 'With participation of:',
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
      lbl_ncc_station: 'Rent With Driver Station',
      taxi_label_your_position: 'You current position, as detected by the device, is:',
      taxi_label_check_it: 'Check it before communicating it to the taxi driver.',
      taxi_label_price: 'The fare must be agreed with the operator.',
      taxi_label_no_accuracy: 'It has not been possible to determine with sufficient accuracy your position to let you communicate it to the taxi driver. Try to switch on a tracking system on your device (GPS, WiFi, ...)',
      error_select_type_accessibility_feedback: 'In order to get an accessible route, you must select public transport or foot',
      not_acc_label: 'This line is not accessible',
      alert_delay: 'Delay of {{mins}} minutes',
      parking_pickup_alert_car: 'Only {{num}} cars available',
      parking_pickup_alert_bike: 'Only {{num}} bikes available',
      parking_alert: 'Only {{num}} slots available',
      lbl_parking_meter: 'Parking Meter',
      lbl_parking_meter_price: 'Price:',
      lbl_parking_meter_orario: 'Time:',
      lbl_parking_meter_giorni: 'Days:',
      lbl_first_time_parking_meter_title: 'Warning',
      lbl_first_time_parking_meter_gps: 'In order to use your position allow the device to activate the geolocation.',
      lbl_first_time_parking_meter_compass: 'The accuracy of the directions for reaching the nearest parking meter depends also on the calibration of the compass on your device. (To find out how to improve it, please see your device\'s instructions).',
      btn_undertood: 'I got it',
      lbl_no_gps_title: 'Attenzione',
      lbl_no_gps_content: 'To take full advantage of this feature, please enable the highest precision mode for location detection on your device.',
      btn_drive_me: 'Take me there',
      lbl_calibration: 'Compass Calibration',
      lbl_calibration_content: 'Drawing an “8” moving the device rightwards from a central point, as shown in the picture, until the compass is calibrated. After a couple of iteration of this movement the calibration should be completed.',
      lbl_distance: 'Distance:',
      lbl_parking_meter_payment_card: 'cash and card',
      lbl_parking_meter_payment_cash: 'cash',
      lbl_parking_meter_payment: 'Payment methods: ',
      home_guest_card: 'Guest Card Services',
      pop_up_expired_title: 'Version expired',
      pop_up__expired_template: 'The actual version of the app has expired',
      pop_up_not_expired_title: 'Trial version',
      pop_up_not_expired_template: 'The actual version of the app end on ',
      label_warning_corona_title: 'WARNING: new containment measures starting from 31 May 2020',
      label_warning_corona_message: 'The holiday service is restored.<br> Touch for further INFO',
      message_popup_first: 'The holiday service is restored, with limited timetable, for urban services of  ',
      message_popup_second: ' and ',
      message_popup_third: ' and the ',
      message_popup_forth: ' Cablecar Trento - Sardagna',
      message_popup_fifth: 'Elastibus service is still available. For further information click ',
      message_popup_sixth: 'HERE' 
    });


    $translateProvider.preferredLanguage(DEFAULT_LANG);
    $translateProvider.fallbackLanguage(DEFAULT_LANG);
    $compileProvider.aHrefSanitizationWhitelist(/.*/);
  });
