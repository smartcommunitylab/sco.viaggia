angular.module('viaggia.controllers.tripdetails', [])

.controller('TripDetailsCtrl', function ($scope, planService) {
    $scope.requestedFrom = planService.getName("from");
    $scope.requestedTo = planService.getName("to");
    var trip = planService.getSelectedJourney();
    planService.process(trip, $scope.requestFrom, trip.to);
    $scope.currentItinerary = trip;


    $scope.toTime = function (millis) {
        return planService.getTimeStr(new Date(millis));
    };

})
