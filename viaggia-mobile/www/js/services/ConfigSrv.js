angular.module('viaggia.services.conf', [])

.factory('Config', function ($q, $http, $window, $filter, $rootScope, $ionicLoading) {
    var DEVELOPMENT = true;


    var isDarkColor = function(color) {
      var c = color.substring(1);      // strip #
      var rgb = parseInt(c, 16);   // convert rrggbb to decimal
      var r = (rgb >> 16) & 0xff;  // extract red
      var g = (rgb >>  8) & 0xff;  // extract green
      var b = (rgb >>  0) & 0xff;  // extract blue

      var luma = (r + g + b)/3;//0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

      return luma < 128;
    };


    $rootScope.textColor = function(color) {
      if (isDarkColor(color)) return '#fff';
      return '#000';
    };



    var DISTANCE_AUTOCOMPLETE = '6';
    var HTTP_CONFIG = {
        timeout: 5000
    };

    var mapJsonConfig = null;
    var ttJsonConfig = null;

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

    ];
    var COLORS_TRIP = [
        {
            type: 'TRAIN',
            color: '#e84539',
            icon: 'img/ic_train.png'

        },
        {
            type: 'CAR',
            color: '#f39619',
            icon: 'img/ic_car.png'

        },
        {
            type: 'BUS',
            color: '#009587',
            icon: 'img/ic_urbanBus.png'

        },
        {
            type: 'BUSSUBURBAN',
            color: '#4052a0',
            icon: 'img/ic_extraurbanBus.png'

        },
        {
            type: 'BICYCLE',
            color: '#8cc04c',
            icon: 'img/ic_bike.png'

        },
        {
            type: 'WALK',
            color: '#823d8f',
            icon: 'img/ic_walk.png'

        },
        {
            type: 'PARKWALK',
            color: '#823d8f',
            icon: 'img/ic_park_walk.png'

        }

        ]
    return {
        init: function () {
            var deferred = $q.defer();
            if (mapJsonConfig != null) deferred.resolve(true);
            else $http.get('data/config.json').success(function (response) {
                mapJsonConfig = response;
                $http.get('data/tt.json').success(function (ttResponse) {
                    ttJsonConfig = ttResponse;
                    deferred.resolve(true);
                });
            });
            return deferred.promise;
        },
        getHTTPConfig: function () {
            return HTTP_CONFIG;
        },
        getDistanceForAutocomplete: function () {
            return DISTANCE_AUTOCOMPLETE;
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
        getColorsTypes: function () {
            return COLORS_TRIP;
        },
        getPlanPreferences: function () {
            return PLAN_PREFERENCES;
        },
        getAppId: function () {
            return mapJsonConfig["appid"];
        },
        getAppName: function () {
            return mapJsonConfig["appname"];
        },
        getAppAgencies: function () {
            return mapJsonConfig["agencies"];
        },
        getVersion: function () {
            return 'v ' + mapJsonConfig["appversion"] + (APP_BUILD && APP_BUILD != '' ? '<br/>(' + APP_BUILD + ')' : '');
        },
        getPlanDefaultOptions: function () {
            return mapJsonConfig["plan_default_options"];
        },
        getExtraurbanAgencies: function () {
            return mapJsonConfig["extraurban_agencies"];
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
        loading: function () {
            $ionicLoading.show();
        },
        loaded: function () {
            $ionicLoading.hide();
        },
        getInfoMenu: function () {
            return mapJsonConfig.visualization.infomenu;
        },
        getPrimaryLinks: function () {
            return mapJsonConfig.visualization.primaryLinks;
        },
        getTTData: function (ref, agencyId, groupId, routeId) {
            var res = ttJsonConfig;
            if (!!ref) {
                res = res.elements[ref];
            }
            if (!!agencyId) {
                for (var i = 0; i < res.elements.length; i++) {
                    if (res.elements[i].agencyId == agencyId) {
                        res = res.elements[i];
                        break;
                    }
                }
            }

            var searchRec = function(res, groupIds, idx) {
                if (idx >= groupIds.length) return res;
                for (var i = 0; i < res.groups.length; i++) {
                    if (res.groups[i].label == groupIds[idx]) {
                        res = searchRec(res.groups[i], groupIds, idx+1);
                        break;
                    }
                }
                return res;
            };

            if (!!groupId) {
                var groupIds = groupId.split(',');
                res = searchRec(res, groupIds, 0);
            }
            if (!!routeId) {
                for (var i = 0; i < res.routes.length; i++) {
                    if (res.routes[i].routeId == routeId) {
                        res = res.routes[i];
                        break;
                    }
                }
            }
            return res;
        },
        getStopVisualization: function (agencyId) {
            if (!ttJsonConfig || !ttJsonConfig.stopVisualization || !ttJsonConfig.stopVisualization[agencyId]) return {};
            return ttJsonConfig.stopVisualization[agencyId];
        },
        isDarkColor: isDarkColor
    }
})
