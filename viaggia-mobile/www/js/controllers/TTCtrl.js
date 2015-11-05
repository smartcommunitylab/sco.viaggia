angular.module('viaggia.controllers.timetable', ['ionic'])

.controller('TTRouteListCtrl', function ($scope, $state, $stateParams, $timeout, ionicMaterialMotion, ionicMaterialInk, Config) {
  var min_grid_cell_width = 90;

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
        res.push({ref:ref, agencyId: localAgency, group: e.groups[j],
                  color: e.groups[j].color, label: e.groups[j].label, title: e.groups[j].title ? e.groups[j].title : e.groups[j].label,
                  gridCode: e.groups[j].gridCode});
      }
    }
    if (e.routes != null) {
      for (var j = 0; j < e.routes.length; j++) {
        res.push({ref:ref, agencyId: localAgency, route: e.routes[j],
                  color: e.routes[j].color ? e.routes[j].color : e.color,
                  label: e.routes[j].label ? e.routes[j].label : e.label,
                  title: e.routes[j].title ? e.routes[j].title : e.title});
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
    } else if (e.group.routes != null && e.group.routes.length == 1) {
      $state.go('app.tt',{ref: e.ref, agencyId: e.agencyId, groupId: e.group.label, routeId: e.group.routes[0].routeId});
    } else {
      $state.go('app.ttgroup',{ref: e.ref, agencyId: e.agencyId, groupId: e.group.label});
    }
  }

  var prepareGrid = function() {
    var cols = Math.floor(window.innerWidth / min_grid_cell_width);
    var gridRows = [];
    var row = [];
    gridRows.push(row);
    for(var i = 0; i < $scope.elements.length; i++) {
      row.push($scope.elements[i]);
      if ((i+1) % cols == 0) {
        row = [];
        gridRows.push(row);
      }
    }
    for (var i = row.length; i < cols; i++) {
      row.push({});
    }
    $scope.gridRows = gridRows;
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
      $scope.title = data.title ? data.title : data.label;
      $scope.elements = flattenData(data);
      $scope.view = data.view ? data.view : 'list';
      if ($scope.view == 'grid') {
        prepareGrid();
      }
    }
  }

  window.onresize = function(event) {
    if ($scope.view == 'grid') {
      $scope.view = null;
      $timeout(function(){$scope.view = 'grid'; prepareGrid();});

    }
  }


  $timeout(init, 500);

    $scope.$on('ngLastRepeat.elements', function (e) {
        $timeout(function () {
            ionicMaterialMotion.ripple();
            ionicMaterialInk.displayEffect()
        }, 0); // No timeout delay necessary.
    });

})

.controller('TTCtrl', function ($scope, $stateParams, $ionicPosition, $timeout, $filter, ttService, Config) {
  $scope.data = [];

  // header height from the standard style. Augmented in case of iOS non-fullscreen.
  var headerHeight = 44 + 50 + 1;
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

  // load timetable data
  $scope.getTT = function (date) {
    Config.loading();
    ttService.getTT($stateParams.agencyId, $scope.route.routeSymId, date).then(function (data) {
      constructTable(data);
      Config.loaded();
    }, function (err) {
      $scope.tt = {tripIds:[]};
      Config.loaded();
    });
  };

  // convert delay object to string
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
  // custom trip name if trip row is shown
  var getTripText = function(trip) {
    try {
      return TRIP_TYPE_EXTRACTOR($stateParams.agencyId, $scope.route.routeSymId, trip);
    }
    catch(e) {
      return trip;
    }
  }

  var initMeasures = function(data) {
    var cn = Math.floor((window.innerWidth - firstColWidth) / cellWidthBase);
    $scope.column_width = (window.innerWidth - firstColWidth) / cn;
    $scope.column_number = Math.min(cn, data.tripIds.length);

    var rn = Math.floor((window.innerHeight - (firstRowHeight+1)*$scope.header_row_number - headerHeight) / cellHeightBase);
    $scope.row_height = (window.innerHeight - (firstRowHeight+1)*$scope.header_row_number - headerHeight) / rn;
    $scope.row_number = Math.min(rn, data.stops.length);

    $timeout(function(){;$scope.scrollLeftPosition = ttService.locateTablePosition(data,new Date());},0);
  }

  var lastResize = 0;
  // track size change due to, e.g., orientation change
  window.onresize = function(event) {
    lastResize = new Date().getTime();

    $timeout(function(){
      // on drag may be many events. let's wait a bit
      if ((new Date().getTime() - 200) >= lastResize) {
        var tt = $scope.tt;
        // reset the tt data to trigger ng-if condition
        $scope.tt = null;
        $timeout(function(){constructTable(tt);});
      }
    }, 200);
  };

  // construct the table
  var constructTable = function (data) {
    $scope.header_row_number = $scope.route.showTrips ? 2 : 1;

    var rows = [];
    if (data.stops) {
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
    } else {
      data.stops = [];
      data.stopIds = [];
    }
    $scope.data = rows;
    $scope.tt = data;

    initMeasures(data);
  };

  // initialize
  $scope.load = function() {
    $scope.route = Config.getTTData($stateParams.ref, $stateParams.agencyId, $stateParams.groupId, $stateParams.routeId);
    if (!$scope.route.color) {
      var group = Config.getTTData($stateParams.ref, $stateParams.agencyId, $stateParams.groupId);
      if (group && group.color) $scope.color = group.color;
    } else {
      $scope.color = $scope.route.color;
    }
    $scope.getTT($scope.runningDate.getTime());
  }

  // go to next date
  $scope.nextDate = function() {
    $scope.runningDate.setDate($scope.runningDate.getDate()+1);
    $scope.getTT($scope.runningDate.getTime());
  }
  // go to prev date
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
