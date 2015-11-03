angular.module('viaggia.controllers.table1', ['ionic', 'ngcTableDirective'])

.controller('Table1Ctrl', function ($scope, $stateParams, $ionicPosition, $timeout, ttService, Config) {
  $scope.data = [];

  var headerHeight = 44;
  var cellWidthBase = 50;
  var firstColWidth = 100;
  var cellHeightBase = 28;
  var firstRowHeight = 28;

  $scope.column_number = Math.floor((window.innerWidth - firstColWidth) / cellWidthBase);
  $scope.column_width = (window.innerWidth - firstColWidth) / Math.floor($scope.column_number);
  $scope.row_number = Math.floor((window.innerHeight - firstRowHeight - headerHeight) / cellHeightBase);
  $scope.row_height = (window.innerHeight - firstRowHeight - headerHeight) / Math.floor($scope.row_number);
  $scope.scrollLeftPosition = 0;

  $scope.tt = null;
  $scope.getTT = function (date) {
    Config.loading();
    ttService.getTT('12', '05A', date).then(function (data) {
      constructTable(data);
      Config.loaded();
    }, function (err) {
      $scope.tt = null;
      Config.loaded();
    });
  };
  var constructTable = function (data) {
    var rows = [];
    for (var row = 0; row < data.stops.length; row++) {
      var rowContent = [];
      for (var col = 0; col < data.tripIds.length; col++) {
        if (col == 0 && row == 0) {
          rowContent.push("stops");
        } else if (col == 0) {
          rowContent.push(data.stops[row]);
        } else if (row == 0) {
          rowContent.push('');
        } else {
          rowContent.push(data.times[col - 1][row - 1]);
        }
      }
      rows.push(rowContent);
    }
    //      $scope.column_number = data.tripIds.length;
    //      $scope.row_number = data.stops.length;
    $scope.data = rows;
    $scope.tt = data;
    $timeout(function(){;$scope.scrollLeftPosition = ttService.locateTablePosition(data,new Date());},0);
  };

  $scope.getTT(new Date().getTime());

  $scope.customDataFn = function (data, row, col) {
    if (col == 0 || row == 0) return data[row][col];
    var val = '';
    if (data[row] && data[row][col])
      val = data[row][col];
    return val;

  }
  $scope.styleFn = function (value, row, col) {
    //        var cls = col % 2 == 0 ? 'even' : 'odd';
    if (col % 2 == 0) return '';
    return 'background-color: #eee';
  }
});
