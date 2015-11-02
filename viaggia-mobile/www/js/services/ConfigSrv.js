angular.module('viaggia.services.conf', [])

.factory('Config', function ($q, $http, $window, $filter, $ionicLoading) {
    var DEVELOPMENT = true;

    var HTTP_CONFIG = {timeout: 5000};
    var mapJsonConfig = null;
    var GEOCODER_URL = 'https://os.smartcommunitylab.it/core.geocoder/spring';
    var APP_BUILD = '';
    var PLAN_TYPES = ['WALK', 'TRANSIT', 'CAR', 'BICYCLE', 'SHAREDCAR', 'SHAREDBIKE'];
    var PLAN_PREFERENCES = [
        {
            label: $filter('translate')('plan_preferences_fastest'),
            value: "fastest"
        }, {
            label: $filter('translate')('plan_preferences_leastChanges'),
            value: "leastChanges"
        }, {
            label: $filter('translate')('plan_preferences_leastWalking'),
            value: "leastWalking"
        }

    ]

    return {
        init : function() {
          var deferred = $q.defer();
          $http.get('data/config.json').success(function (response) {
            mapJsonConfig = response;
            deferred.resolve(true);
          });
          return deferred.promise;
        },
        getHTTPConfig: function () {
            return HTTP_CONFIG;
        },
        getServerURL: function () {
            return mapJsonConfig['serverURL'];
        },
        getMapPosition: function () {
            return {
                lat: mapJsonConfig['center_map'][0],
                long: mapJsonConfig['center_map'][1],
                zoom: mapJsonConfig['zoom_map']
            };
        },
        getGeocoderURL: function () {
            return GEOCODER_URL;
        },
        getPlanTypes: function () {
            return PLAN_TYPES;
        },
        getPlanPreferences: function () {
            return PLAN_PREFERENCES;
        },
        getAppId: function () {
            return mapJsonConfig["appid"];
        },
        getVersion: function () {
            return 'v ' + mapJsonConfig["appversion"] + (APP_BUILD && APP_BUILD != '' ? '<br/>(' + APP_BUILD + ')' : '');
        },
        getPlanDefaultOptions: function () {
            return mapJsonConfig["plan-default-options"];
        },
        getExtraurbanAgencies: function () {
            return mapJsonConfig["extraurban-agencies"];
        },
        getLang: function () {
            var browserLanguage = '';
            // works for earlier version of Android (2.3.x)
            var androidLang;
            if ($window.navigator && $window.navigator.userAgent && (androidLang = $window.navigator.userAgent.match(/android.*\W(\w\w)-(\w\w)\W/i))) {
                browserLanguage = androidLang[1];
            } else {
                // works for iOS, Android 4.x and other devices
                browserLanguage = $window.navigator.userLanguage || $window.navigator.language;
            }
            var lang = browserLanguage.substring(0, 2);
            if (lang != 'it' && lang != 'en' && lang != 'de') lang = 'en';
            return lang;
        },
        getLanguage: function () {

            navigator.globalization.getLocaleName(
                function (locale) {
                    alert('locale: ' + locale.value + '\n');
                },
                function () {
                    alert('Error getting locale\n');
                }
            );

        },
        loading : function() {
          $ionicLoading.show();
        },
        loaded: function() {
          $ionicLoading.hide();
        }
    }
})
