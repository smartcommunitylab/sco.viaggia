angular.module('viaggia.services.timetable', [])

.factory('ttService', function ($http, $q, Config) {

  return {
    /**
     * timetable for specified timestamp: converted to date start/end timestamps
     */
    getTT : function(agency, route, date) {
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

      return deferred.promise;
    }
  }
})
