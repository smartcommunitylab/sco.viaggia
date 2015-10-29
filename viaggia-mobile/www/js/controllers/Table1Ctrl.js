angular.module('viaggia.controllers.table1', ['ionic', 'ngcTableDirective'])

.controller('Table1Ctrl', function ($scope, $ionicPosition, ttService, Config) {
    $scope.data = [];
    $scope.row_number = Math.floor((window.innerHeight - 28 - 44) / 28);
    console.log("window height" + window.innerHeight);
    console.log("content height" + document.getElementById("content").clientHeight);
    console.log("offsetWidth rect " + document.getElementById("content").offsetWidth);
    console.log("scrollHeight rect " + document.getElementById("content").scrollHeight);
    //console.log("ionic position table " + $ionicPosition.offset(document.getElementById("content")));
    $scope.column_number = window.innerWidth / 50;
    var n = 50;

    $scope.tt = null;
    $scope.getTT = function(date) {
      Config.loading();
      ttService.getTT('12','05A',date).then(function(data) {
        constructTable(data);
        Config.loaded();
      }, function(err) {
        $scope.tt = null;
        Config.loaded();
      });
    };
    var constructTable = function(data) {
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
                  rowContent.push(data.times[col-1][row-1]);
              }
          }
          rows.push(rowContent);
      }
//      $scope.column_number = data.tripIds.length;
//      $scope.row_number = data.stops.length;
      $scope.data = rows;
      $scope.tt = data;
    };

    $scope.getTT(new Date().getTime());

    $scope.customDataFn = function (data, row, col) {
        if (col == 0 || row == 0) return data[row][col];
        var cls = col % 2 == 0 ? 'even' : 'odd';
        var val = '';
        if (data[row] && data[row][col])
          val = data[row][col];
        return '<div class="'+cls+'">'+val+'</div>';
    }
});
