angular.module('viaggia.services.conf', [])

.factory('Config', function ($q, $http, $window, $filter) {
    var DEVELOPMENT = true;

    $http.get('data/config.json').success(function (response) {
        mapJsonConfig = response;
    });

    var URL = 'https://' + (DEVELOPMENT ? 'dev' : 'tn') + '.smartcommunitylab.it';
    var GEOCODER_URL = 'https://os.smartcommunitylab.it/core.geocoder/spring';
    var PLAN_URL = 'https://os.smartcommunitylab.it/core.mobility/plansinglejourney';

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
    var MAP_POSITION = {
        lat: 46.067332,
        long: 11.121393,
        zoom: 12
    }

    return {
        getMapPosition: function () {
            return MAP_POSITION;
        },
        getGeocoderURL: function () {
            return GEOCODER_URL;
        },
        getPlanURL: function () {
            return PLAN_URL;
        },
        getPlanTypes: function () {
            return PLAN_TYPES;
        },
        getPlanPreferences: function () {
            return PLAN_PREFERENCES;
        },
        getAppId: function () {
            return mapJsonConfig["app-id"];
        },
        getVersion: function () {
            return 'v ' + mapJsonConfig["app-version"] + (APP_BUILD && APP_BUILD != '' ? '<br/>(' + APP_BUILD + ')' : '');
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

        }
    }
})
