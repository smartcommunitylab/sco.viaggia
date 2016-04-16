angular.module('viaggia.controllers.registration', [])

.controller('RegistrationCtrl', function ($scope, $ionicLoading, $filter, Toast) {
    $ionicLoading.hide();
    $scope.user = {
        nickname: '',
        age: '20',
        km: '',
        publictransport: null,
        listOftransport: [],
        advice: ''
    }
    $scope.publicTransport = null;
    initPublicTransport();
    $scope.privateTransport = null;
    initPrivateTransport();
    $scope.usetransports = [
        {
            text: $filter('translate')('registration_true'),
            value: true
        },
        {
            text: $filter('translate')('registration_false'),
            value: false
        }

  ];

    function initPublicTransport() {
        $scope.publicTransport = [
            {
                text: $filter('translate')('registration_transport_train'),
                checked: false
        },
            {
                text: $filter('translate')('registration_transport_bus'),
                checked: false
        },
            {
                text: $filter('translate')('registration_transport_carsharing'),
                checked: false
        },
            {
                text: $filter('translate')('registration_transport_bikesharing'),
                checked: false
        }
  ];
    }

    function initPrivateTransport() {
        $scope.privateTransport = [
            {
                text: $filter('translate')('registration_transport_car'),
                checked: false
        },
            {
                text: $filter('translate')('registration_transport_bike'),
                checked: false
        },
            {
                text: $filter('translate')('registration_transport_foot'),
                checked: false
        }

    ];
    }
    $scope.initTransport = function () {
        initPrivateTransport();
        initPublicTransport();
    }
    $scope.data = {
        publictransport: true
    };
    $scope.read = {
        isChecked: false
    }
    $scope.register = function () {
        if (!$scope.read.isChecked) {
            Toast.show($filter('translate')('registration_must_accept'), "short", "bottom");
            return;
        } else {
            if (checkParams()) {
                Toast.show("registra", "short", "bottom");
            }
        }
    }

    function checkParams() {
        if ($scope.user.nickname == '') {
            Toast.show($filter('translate')('registration_empty_nick'), "short", "bottom");
            return false;
        }
        if ($scope.user.age == '') {
            Toast.show($filter('translate')('registration_empty_age'), "short", "bottom");
            return false;
        }
        if ($scope.user.km == '' || isNaN($scope.user.km)) {
            Toast.show($filter('translate')('registration_empty_km'), "short", "bottom");
            return false;
        }
        if ($scope.user.listOftransport.length == 0) {
            Toast.show($filter('translate')('registration_empty_transport'), "short", "bottom");
            return false;
        }
        return true;
        console.log(JSON.stringify($scope.user));
    }
});
