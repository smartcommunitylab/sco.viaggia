angular.module('viaggia.filters', [])

  .filter('dowDate', function ($rootScope, $filter) {

    var DATES = ['dow_7_s', 'dow_1_s', 'dow_2_s', 'dow_3_s', 'dow_4_s', 'dow_5_s', 'dow_6_s'];

    return function (input) {
      if (!input) {
        return '';
      } else {
        var d = input;
        if (!input instanceof Date) {
          var d = new Date(input);
        }
        return $filter('translate')(DATES[d.getDay()]);
      }
    };
  })
  .filter('split', function () {
    return function (input, splitChar, splitIndex) {
      // do some bounds checking here to ensure it has that index
      return input.split(splitChar)[splitIndex];
    }
  })
  .filter('capitalize', function() {
    return function(input) {
      return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    }
});