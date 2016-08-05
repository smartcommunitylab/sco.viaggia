angular.module('viaggia.controllers.monitoring', [])

.controller('MonitoringCtrl', function ($scope, Config, $filter, $ionicPopup, $stateParams, monitoringService, Toast) {

    var ref = $stateParams.ref;
    var agencyId = $stateParams.agencyId;
    var groupId = $stateParams.groupId;
    var routeId = $stateParams.routeId;

    $scope.allDays = {
        checked: false
    };
    $scope.monitors = [];
    $scope.addingMonitor = false;

    function setTimeFromWidget() {
        $scope.timePickerObject24HourFrom = {
            inputEpochTime: ((new Date()).getHours() * 60 * 60 + (new Date()).getMinutes() * 60), //Optional
            step: 5, //Optional
            format: 24, //Optional
            titleLabel: $filter('translate')('popup_timepicker_title'), //Optional
            closeLabel: $filter('translate')('popup_timepicker_cancel'), //Optional
            setLabel: $filter('translate')('popup_timepicker_select'), //Optional
            setButtonType: 'button-popup', //Optional
            closeButtonType: 'button-popup', //Optional
            callback: function (val) { //Mandatory
                timePicker24Callback(val, 'from');
            }
        };
    }

    function setTimeToWidget() {
        $scope.timePickerObject24HourTo = {
            inputEpochTime: (((new Date()).getHours() + 2) * 60 * 60 + (new Date()).getMinutes() * 60), //Optional
            step: 5, //Optional
            format: 24, //Optional
            titleLabel: $filter('translate')('popup_timepicker_title'), //Optional
            closeLabel: $filter('translate')('popup_timepicker_cancel'), //Optional
            setLabel: $filter('translate')('popup_timepicker_select'), //Optional
            setButtonType: 'button-popup', //Optional
            closeButtonType: 'button-popup', //Optional
            callback: function (val) { //Mandatory
                timePicker24Callback(val, 'to');
            }
        };
    }

    function timePicker24Callback(val, fromOrTo) {
        if (typeof (val) === 'undefined') {
            console.log('Time not selected');
        } else {
            if (fromOrTo === 'from') {
                $scope.timePickerObject24HourFrom.inputEpochTime = val;
            } else {
                $scope.timePickerObject24HourTo.inputEpochTime = val;
            }
            var selectedTime = new Date();
            selectedTime.setHours(val / 3600);
            selectedTime.setMinutes((val % 3600) / 60);
            selectedTime.setSeconds(0);
            $scope.hourTimestamp = $filter('date')(selectedTime, 'hh:mma');
        }
    }
    $scope.recurrentDays = JSON.parse(JSON.stringify(Config.getDaysRec()));
    $scope.addMonitor = function () {

        $scope.addingMonitor = true;
    }
    $scope.saveMonitor = function () {
        monitoringService.saveMonitor().then(function (saved) {
            $scope.addingMonitor = false;
            Toast.show($filter('translate')('monitor_saved_confirmed'), "short", "bottom");

        }, function (error) {});
    }
    $scope.closeMonitor = function () {
        $scope.addingMonitor = false;
    }
    $scope.selectAll = function () {
        if ($scope.allDays.checked) {
            for (var k = 0; k < $scope.recurrentDays.length; k++) {
                $scope.recurrentDays[k].checked = true;
            }
        } else {
            for (var k = 0; k < $scope.recurrentDays.length; k++) {
                $scope.recurrentDays[k].checked = false;
            }
        }
    }
    $scope.deleteMonitor = function () {
        var confirmPopup = $ionicPopup.confirm({
            title: $filter('translate')('monitor_delete_popup_title'),
            template: $filter('translate')('monitor_delete_popup_text')
        });
        confirmPopup.then(function (res) {
            if (res) {
                Toast.show($filter('translate')('monitor_delete_confirmed'), "short", "bottom");
            }
        });
    }

    function initMonitor() {
        monitoringService.getActiveMonitor(agencyId, groupId, routeId).then(function (monitors) {
            $scope.monitors = monitors;
            for (var i = 0; i < $scope.monitors.length; i++) {
                var days = {
                    daysOfWeek: $scope.monitors[i].days
                };
                $scope.monitors[i].monitorDays = $scope.getRecurrentDays(days);
            }
        }, function (error) {

        });
        setTimeFromWidget();
        setTimeToWidget();
    }

    initMonitor();

})
