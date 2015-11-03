angular.module('viaggia.controllers.timetable', ['ionic'])

.controller('TTRouteListCtrl', function ($scope, $state, $stateParams, Config) {
  var ref = $stateParams.ref;
  var agencyId = $stateParams.agencyId;
  var groupId = $stateParams.groupId;

  $scope.title = null;
  $scope.view = 'list';

  var flattenElement = function(e, res) {
    var localAgency = agencyId;
    if (e.agencyId != null) localAgency = e.agencyId;
    if (e.groups != null) {
      for (var j = 0; j < e.groups.length; j++) {
        res.push({ref:ref, agencyId: localAgency, group: e.groups[j]});
      }
    }
    if (e.routes != null) {
      for (var j = 0; j < e.routes.length; j++) {
        res.push({ref:ref, agencyId: localAgency, route: e.routes[j]});
      }
    }
  }
  var flattenData = function(data) {
    var res = [];
    if (data.elements) {
      for (var i = 0; i < data.elements.length; i++) {
        var e = data.elements[i];
        flattenElement(e, res);
      }
    } else {
        flattenElement(data, res);
    }
    return res;
  }

  $scope.selectElement = function(e) {
    if (e.route != null) {
      $state.go('app.tt',{ref: e.ref, agencyId: e.agencyId, groupId: groupId, routeId: e.route.routeId});
    } else {
      $state.go('app.ttgroup',{ref: e.ref, agencyId: e.agencyId, groupId: e.group.label});
    }
  }

  var init = function(){
    if (agencyId == null && groupId == null) {
      // main data
      var data = Config.getTTData(ref);
    } else if (agencyId != null) {
      // specific data
      if (groupId != null) {
        // specific group
        var data = Config.getTTData(ref, agencyId, groupId);
      } else {
        // agency
        var data = Config.getTTData(ref, agencyId);
      }
    }
    if (data) {
  //    if (data.view != null) $scope.view = data.view;
      $scope.title = data.title ? data.title : data.label;
      $scope.elements = flattenData(data);
    }
  }

  init();


})

.controller('TTCtrl', function ($scope, $stateParams, $ionicPosition, $timeout, ttService, Config) {
  $scope.data = [];

  $scope.route = Config.getTTData($stateParams.ref, $stateParams.agencyId, $stateParams.groupId, $stateParams.routeId);

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
    ttService.getTT($stateParams.agencyId, $scope.route.routeSymId, date).then(function (data) {
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
})
