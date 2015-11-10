angular.module('viaggia.services.timetable', [])

/**
 * A SERVICE TO WORK WITH TIMETABLE DATA BOTH FROM DB AND FROM SERVER
 */
.factory('ttService', function ($http, $q, $filter, Config, DataManager) {
  var calendarCache = {};

  var toTrimmedList = function(str) {
    if (!str) return [];
    var arr = str.split(',');
    var res = [];
    arr.forEach(function(e) {res.push(e.trim());});
    return res;
  }

  var getDelays = function(agency, route, date) {
    var deferred = $q.defer();
    var d = new Date(date);
    d.setHours(0);
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(0);
    var from = d.getTime();
    d.setHours(23);
    d.setMinutes(59);
    var to = d.getTime();
    route = encodeURIComponent(route);
    $http.get(Config.getServerURL()+'/gettransitdelays/'+agency+'/'+route+'/'+from+'/'+to,
              Config.getHTTPConfig())
      .success(function(data) {
        if (data && data.delays) deferred.resolve(data.delays[0]);
      })
      .error(function(err) {
        deferred.reject(err);
      });


    return deferred.promise;
  }

  /**
   * transform compressed string to matrix of times. string is a sequence of all trip times separated with '|'. Each time (if presented) has 4 chars.
   */
  var uncompressTime = function(str, rowsCount) {
    if (!str) return [];
    var res = [];
    var column = [];
    var counter = 0;
    for (var i = 0; i < str.length; i++) {
      var c = str.charAt(i);
      if (c == ' ') continue;
      if (c == '|') column.push("");
      else {
        column.push(str.substr(i,2)+":"+str.substr(i+2,2));
        i += 3;
      }
      counter++;
      if (counter == rowsCount) {
        res.push(column);
        column = [];
        counter = 0;
      }
    }
    return res;
  }

  /**
   * Read TT from DB: given a agency/route/date, get a hash and then read stopIds, name,s tripIds, and times from DB.
   * Due to the problem with the plugin (does not escape JSON strings), it is necessary to do 5 DB calls in a row.
   * Parallel calls seems to end up in DB lock sometimes.
   */
  var dataFromHash = function(agency, route, date, deferred, readRoutes) {
    var cal = calendarCache[agency][route];
    dateStr = $filter('date')(date,'yyyyMMdd');
    var hash = route+'_'+cal.mapping[cal.entries[dateStr]];
    var errCB = function(err){
      deferred.reject(err);
    };
    var result = {stops:[],tripIds:[],times:[],stopIds:[], routeIds: []};
    DataManager.doQuery("SELECT stopsIDs FROM route WHERE agencyID = '"+agency+"' AND linehash = '"+hash+"'",[])
    .then(function(data) {
      result.stopIds = toTrimmedList(data);
      DataManager.doQuery("SELECT stopsNames FROM route WHERE agencyID = '"+agency+"' AND linehash = '"+hash+"'",[])
      .then(function(data) {
        result.stops = toTrimmedList(data);
        DataManager.doQuery("SELECT tripIds FROM route WHERE agencyID = '"+agency+"' AND linehash = '"+hash+"'",[])
        .then(function(data) {
          result.tripIds = toTrimmedList(data);
          DataManager.doQuery("SELECT times FROM route WHERE agencyID = '"+agency+"' AND linehash = '"+hash+"'",[])
          .then(function(data) {
            result.times = uncompressTime(data,result.stopIds.length);
            getDelays(agency, route, date).then(function(delays){
              result.delays = delays;
              deferred.resolve(result);
            }, function() {
              deferred.resolve(result);
            });
          }, errCB);
        }, errCB);
      }, errCB);
    }, errCB);
  };

  return {
    /**
     * timetable for specified timestamp: converted to date start/end timestamps
     */
    getTT : function(agency, route, date) {
      var deferred = $q.defer();
      if (ionic.Platform.isWebView()) {
        // use cache of calendar hashes
        if (calendarCache[agency] == null) {
          calendarCache[agency] = {};
        }
        if (calendarCache[agency][route] == null) {
          DataManager.doQuery("SELECT calendar FROM calendar WHERE agencyID = '"+agency+"' AND route = '"+route+"'",[])
          .then(function(data) {
            calendarCache[agency][route] = JSON.parse(data);
            dataFromHash(agency, route, date, deferred);
          },function(err) {
            deferred.reject(err);
          });
        } else {
            dataFromHash(agency, route, date, deferred);
        }
      } else {
        // use remote call for timetable
        var d = new Date(date);
        d.setHours(0);
        d.setMinutes(0);
        d.setSeconds(0);
        d.setMilliseconds(0);
        var from = d.getTime();
        d.setHours(23);
        d.setMinutes(59);
        var to = d.getTime();
        route = encodeURIComponent(route);
        $http.get(Config.getServerURL()+'/gettransittimes/'+agency+'/'+route+'/'+from+'/'+to,
                  Config.getHTTPConfig())
          .success(function(data) {
            if (data.times) data.times = data.times[0];
            if (data.tripIds) data.tripIds = data.tripIds[0];
            if (data.delays) data.delays = data.delays[0];
            deferred.resolve(data);
          })
          .error(function(err) {
            deferred.reject(err);
          });
      }


      return deferred.promise;
    },
    /**
     * Find a column that corresponds to the current time
     */
    locateTablePosition: function(data, time) {
      if (!data) return;
      time = $filter('date')(time,'HH:mm');
      for (var i = 0; i < data.tripIds.length; i++) {
        if (!data.times[i]) continue;
        for (var j = 0; j < data.times[i].length; j++) {
          if (!!data.times[i][j]) {
            if (data.times[i][j].localeCompare(time)>=0) {
              return i;
            }
            break;
          }
        }
      }
      return data.tripIds.length - 1;
    }
  }
})
