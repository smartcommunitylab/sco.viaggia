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

.controller('TTCtrl', function ($scope, $stateParams, $ionicPosition, $timeout, $filter, ttService, Config) {
  $scope.data = [];

  var headerHeight = 44 + 50;
  if (ionic.Platform.isIOS() && !ionic.Platform.isFullScreen) {
    headerHeight += 20;
  }
  var cellWidthBase = 50;
  var firstColWidth = 100;
  var cellHeightBase = 28;
  var firstRowHeight = 28;

  $scope.scrollLeftPosition = 0;
  $scope.tt = null;
  $scope.runningDate = new Date();
  $scope.color = '#ddd';

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

  var getDelayValue = function(delay) {
    var res = '';
    if (delay && delay.SERVICE && delay.USER > 0) {
      res += '<span>'+delay.SERVICE+'\'</span>';
    }
    if (delay && delay.USER && delay.USER > 0) {
      res += '<span>'+delay.USER+'\'</span>';
    }
    return res;
  }
  var getTripText = function(trip) {
    try {
      return TRIP_TYPE_EXTRACTOR($stateParams.agencyId, $scope.route.routeSymId, trip);
    }
    catch(e) {
      return trip;
    }
  }

  var constructTable = function (data) {
    $scope.header_row_number = $scope.route.showTrips ? 2 : 1;

    var rows = [];
    for (var row = 0; row < data.stops.length + $scope.header_row_number; row++) {
      var rowContent = [];
      for (var col = 0; col <= data.tripIds.length; col++) {
        if (col == 0 && row == 0) {
          rowContent.push($filter('translate')('lbl_delays'));
        } else if ($scope.header_row_number == 2 && row == 1 && col == 0) {
          rowContent.push($filter('translate')('lbl_trips'));
        } else if (col == 0) {
          rowContent.push(data.stops[row-$scope.header_row_number]);
        } else if (row == 0) {
          rowContent.push(getDelayValue(data.delays[col - 1]));
        } else if ($scope.header_row_number == 2 && row == 1) {
          rowContent.push(getTripText(data.tripIds[col - 1]));
        } else {
          rowContent.push(data.times[col - 1][row - $scope.header_row_number]);
        }
      }
      rows.push(rowContent);
    }
    $scope.data = rows;
    $scope.tt = data;

    var cn = Math.floor((window.innerWidth - firstColWidth) / cellWidthBase);
    $scope.column_width = (window.innerWidth - firstColWidth) / cn;
    $scope.column_number = Math.min(cn, data.tripIds.length);

    var rn = Math.floor((window.innerHeight - (firstRowHeight+1)*$scope.header_row_number - headerHeight) / cellHeightBase);
    $scope.row_height = (window.innerHeight - (firstRowHeight+1)*$scope.header_row_number - headerHeight) / rn;
    $scope.row_number = Math.min(rn, data.stops.length);

    $timeout(function(){;$scope.scrollLeftPosition = ttService.locateTablePosition(data,new Date());},0);
  };

  $scope.load = function() {
    $scope.route = Config.getTTData($stateParams.ref, $stateParams.agencyId, $stateParams.groupId, $stateParams.routeId);
    $scope.getTT($scope.runningDate.getTime());
  }

  $scope.nextDate = function() {
    $scope.runningDate.setDate($scope.runningDate.getDate()+1);
    $scope.getTT($scope.runningDate.getTime());
  }
  $scope.prevDate = function() {
    $scope.runningDate.setDate($scope.runningDate.getDate()-1);
    $scope.getTT($scope.runningDate.getTime());
  }

  $timeout($scope.load, 500);

  $scope.styleFn = function (value, row, col) {
    //        var cls = col % 2 == 0 ? 'even' : 'odd';
    var res = '';
    if (row == 0) res += 'color: red;';
    if (col % 2 == 0) return res;
    return res + 'background-color: #eee';
  }
})
