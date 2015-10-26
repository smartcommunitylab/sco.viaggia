angular.module('viaggia.services.plan', [])

.factory('planService', function () {

    var planService = {};
    var position = {};
    planService.setPositionFrom = function (latitude, longitude) {
        if (!position.positionFrom) {
            position.positionFrom = {};
        }
        position.positionFrom.latitude = latitude;
        position.positionFrom.longitude = longitude;
    }
    planService.getPositionFrom = function () {

    }
    return planService;
})
