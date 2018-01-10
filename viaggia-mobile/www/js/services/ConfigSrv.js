angular.module('viaggia.services.conf', [])
  /*
  Configuration service. Here Are stored most of the constants and variables.
  This service works combined with the config.json file and many methods defined get the json value from it
  */
  .factory('Config', function ($q, $http, $window, $filter, $timeout, $rootScope, $ionicLoading) {

    var isDarkColor = function (color) {
      if (!color) return true;
      var c = color.substring(1); // strip #
      var rgb = parseInt(c, 16); // convert rrggbb to decimal
      var r = (rgb >> 16) & 0xff; // extract red
      var g = (rgb >> 8) & 0xff; // extract green
      var b = (rgb >> 0) & 0xff; // extract blue

      var luma = (r + g + b) / 3; //0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

      return luma < 128;
    };


    $rootScope.textColor = function (color) {
      if (isDarkColor(color)) return '#fff';
      return '#000';
    };



    var DISTANCE_AUTOCOMPLETE = '25';
    var PARKING_METERS_RADIUS = '5';
    var PARKING_METERS_MAX_NUMBER = 52;
    var HTTP_CONFIG = {
      timeout: 5000
    };

    var mapJsonConfig = null;
    var ttJsonConfig = null;

    var GEOCODER_URL = 'https://dev.smartcommunitylab.it/core.geocoder';
    var APP_BUILD = '';
    var PLAN_TYPES = ['WALK', 'TRANSIT', 'CAR', 'BICYCLE', 'SHAREDCAR', 'SHAREDBIKE'];

    //convert the UI pianification's choices to the server requests
    var convertMeans = function (means) {
      res = [];
      if (means.indexOf('TRANSIT') >= 0) {
        res.push('TRANSIT');
      }
      if (means.indexOf('CAR') >= 0) {
        res.push('CAR');
        res.push('CARWITHPARKING');
      }
      if (means.indexOf('SHAREDCAR') >= 0) {
        res.push('SHAREDCAR_WITHOUT_STATION');
      }
      if (means.indexOf('WALK') >= 0) {
        res.push('WALK');
      }
      if (means.indexOf('BICYCLE') >= 0) {
        res.push('BICYCLE');
      }
      if (means.indexOf('SHAREDBIKE') >= 0) {
        res.push('SHAREDBIKE');
        res.push('SHAREDBIKE_WITHOUT_STATION');
      }
      return res;
    };

    //different kind of color for different means used by bookmarks
    var COLORS_TRIP = {
      TRAIN: {
        color: '#cd251c',
        listIcon: 'img/ic_mt_train.png',
        icon: 'img/ic_train.png'

      },
      CAR: {
        color: '#757575',
        listIcon: 'img/ic_mt_car.png',
        icon: 'img/ic_car.png'

      },
      BUS: {
        color: '#eb8919',
        listIcon: 'img/ic_mt_bus.png',
        icon: 'img/ic_urbanBus.png'

      },
      TRANSIT: {
        color: '#016a6a',
        listIcon: 'img/ic_mt_funivia.png',
        icon: 'img/ic_funivia.png'

      },
      BUSSUBURBAN: {
        color: '#00588e',
        listIcon: 'img/ic_mt_extraurbano.png',
        icon: 'img/ic_extraurbanBus.png'

      },
      BICYCLE: {
        color: '#922d66',
        listIcon: 'img/ic_mt_bicycle.png',
        icon: 'img/ic_bike.png'

      },
      WALK: {
        color: '#8cc04c',
        listIcon: 'img/ic_mt_foot.png',
        icon: 'img/ic_walk.png'

      },
      PARKWALK: {
        color: '#8cc04c',
        listIcon: 'img/ic_mt_walk.png',
        icon: 'img/ic_park_walk.png'

      },
      TRIP: {
        color: '#3bbacf'
      },
      PARKING: {
        color: '#164286'
      },
      BIKESHARING: {
        color: '#922d66'
      }
    };

    var PARKING_METERS_AGENCY_IDS = ['tn_mob_091516'];

    var flattenElement = function (e, res, ref, agencyId) {
      var localAgency = agencyId;
      if (e.agencyId != null) localAgency = e.agencyId;
      if (e.groups != null) {
        for (var j = 0; j < e.groups.length; j++) {
          res.push({
            ref: ref,
            agencyId: localAgency,
            group: e.groups[j],
            color: e.groups[j].color,
            label: e.groups[j].label,
            title: e.groups[j].title ? e.groups[j].title : e.groups[j].label,
            gridCode: e.groups[j].gridCode
          });
        }
      }
      if (e.routes != null) {
        for (var j = 0; j < e.routes.length; j++) {
          res.push({
            ref: ref,
            agencyId: localAgency,
            route: e.routes[j],
            color: e.color,
            label: e.routes[j].label ? e.routes[j].label : e.label,
            title: e.routes[j].title ? e.routes[j].title : e.title
          });
        }
      }
    }
    var flattenData = function (data, ref, agencyId) {
      var res = [];
      if (data.elements) {
        for (var i = 0; i < data.elements.length; i++) {
          var e = data.elements[i];
          flattenElement(e, res, ref, agencyId);
        }
      } else {
        flattenElement(data, res, ref, agencyId);
      }
      return res;
    }

    return {
      //init the application with configuration and timetables from configuration's file
      init: function () {
        var deferred = $q.defer();
        if (mapJsonConfig != null) deferred.resolve(true);
        else $http.get('data/config.json').success(function (response) {
          mapJsonConfig = response;
          $http.defaults.headers.common.appId = mapJsonConfig["appid"];


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
      getMetroparcoServerURL: function () {
        return mapJsonConfig['metroparco'];
      },
      getParkingMetersRadius: function () {
        return PARKING_METERS_RADIUS;
      },
      getParkingMetersMaxNumber: function () {
        return PARKING_METERS_MAX_NUMBER;
      },
      getParkingMetersAgencyIds: function () {
        return PARKING_METERS_AGENCY_IDS;
      },
      getMapPosition: function () {
        return {
          lat: mapJsonConfig['center_map'][0],
          long: mapJsonConfig['center_map'][1],
          zoom: mapJsonConfig['zoom_map']
        };
      },
      getZoomParkingMeter: function () {
        return 17;
      },
      getPlanPolicy: function () {
        return mapJsonConfig['plan_policy'];
      },
      getGeocoderURL: function () {
        return GEOCODER_URL;
      },
      getGeocoderConf: function () {
        return {
          timeout: 5000,
          headers: {
            appId: undefined
          }
        };
      },
      getPlanTypes: function () {
        return PLAN_TYPES;
      },
      convertPlanTypes: convertMeans,
      getColorsTypes: function () {
        return COLORS_TRIP;
      },
      getColorType: function (transportType, agencyId) {
        if (transportType == 'BUS') {
          if (this.getExtraurbanAgencies() && this.getExtraurbanAgencies().indexOf(parseInt(agencyId)) != -1)
            return COLORS_TRIP['BUSSUBURBAN'];
        }
        return COLORS_TRIP[transportType];
      },
      getPlanPreferences: function () {
        return [
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
      },

      getAppId: function () {
        return mapJsonConfig["appid"];
      },
      getMessagingAppId: function () {
        return mapJsonConfig["messagingAppId"];
      },
      getTaxiId: function () {
        return mapJsonConfig["taxi_id"];
      },
      getTaxiAccuracy: function () {
        return mapJsonConfig["taxi_accuracy"];

      },
      getAccessibility: function () {
        return mapJsonConfig['accessibility'];
      },
      getMessagingServerURL: function () {
        return mapJsonConfig["messagingServerURL"];
      },
      getSenderID: function () {
        return mapJsonConfig["senderID"];
      },
      getAppName: function () {
        return mapJsonConfig["appname"];
      },
      getAppAgencies: function () {
        return mapJsonConfig["agencies"];
      },
      getRSSUrl: function () {
        return mapJsonConfig["newsRSS"];
      },
      getPOIURL: function () {
        return mapJsonConfig["POIURL"];
      },
      getQuestURL: function () {
        return mapJsonConfig["QuestURL"];
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
        $timeout($ionicLoading.hide());
      },
      getInfoMenu: function () {
        return mapJsonConfig.visualization.infomenu;
      },
      getPrimaryLinks: function () {
        return mapJsonConfig.visualization.primaryLinks;
      },
      getContactLink: function () {
        return mapJsonConfig["contact_link"];
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

        var searchRec = function (res, groupIds, idx) {
          if (idx >= groupIds.length) return res;
          for (var i = 0; i < res.groups.length; i++) {
            if (res.groups[i].label == groupIds[idx]) {
              res = searchRec(res.groups[i], groupIds, idx + 1);
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
      flattenData: flattenData,
      getStopVisualization: function (agencyId) {
        if (!ttJsonConfig || !ttJsonConfig.stopVisualization || !ttJsonConfig.stopVisualization[agencyId]) return {};
        return ttJsonConfig.stopVisualization[agencyId];
      },
      isDarkColor: isDarkColor
    }
  })
