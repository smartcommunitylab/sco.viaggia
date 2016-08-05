angular.module('viaggia.services.monitor', [])

.factory('monitoringService', function ($q, $rootScope, Config) {
    var monitorinService = {};
    var tempArrayMonitor = [{
        id: 'abc',
        from: '8:00',
        to: '10:00',
        days: [1, 3]
        }, {
        id: 'def',
        from: '10:00',
        to: '12:00',
        days: [2, 5]
        }]
    monitorinService.saveMonitor = function (ref, agencyId, groupId, routeId, monitor) {
        var deferred = $q.defer();
        //add new monitor to server
        return deferred.promise;
    }
    monitorinService.deleteMonitor = function (ref, agencyId, groupId, routeId, monitor) {
        var deferred = $q.defer();
        //add new monitor to server

        return deferred.promise;
    }
    monitorinService.getActiveMonitor = function (ref, agencyId, groupId, routeId) {
        var deferred = $q.defer();
        deferred.resolve(tempArrayMonitor);

        return deferred.promise;
    }
    return monitorinService;
})
