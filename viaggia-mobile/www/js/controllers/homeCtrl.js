angular.module('viaggia.controllers.home', ['ionic', 'ngcTableDirective'])

.controller('HomeCtrl', function ($scope, $ionicPosition) {
    $scope.data = [];
    $scope.row_number = Math.floor((window.innerHeight - 40 - 44) / 30);
    console.log("window height" + window.innerHeight);
    console.log("content height" + document.getElementById("content").clientHeight);
    console.log("offsetWidth rect " + document.getElementById("content").offsetWidth);
    console.log("scrollHeight rect " + document.getElementById("content").scrollHeight);
    //console.log("ionic position table " + $ionicPosition.offset(document.getElementById("content")));
    $scope.column_number = window.innerWidth / 50;
    var n = 50;

    for (var row = 0; row < n; row++) {
        var rowContent = [];
        for (var col = 0; col < n; col++) {
            if (col == 0 && row == 0) {
                rowContent.push("stops");
            } else if (col == 0) {
                rowContent.push("stop" + row);
            } else if (row == 0) {
                rowContent.push("course" + col);
            } else {
                rowContent.push(col + ":" + row);
            }
        }
        $scope.data.push(rowContent);
    }

    //    $scope.customDataFn = function (data, row, col) {
    //        return data[n - row - 1][n - col - 1];
    //    }
    $scope.customDataFn = function (data, row, col) {
        if (data[row] && data[row][col])
            return data[row][col];
        else return "yabba"
    }
});
