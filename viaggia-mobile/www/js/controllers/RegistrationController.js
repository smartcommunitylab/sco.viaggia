angular.module('viaggia.controllers.registration', [])

.controller('RegistrationCtrl', function ($scope, $ionicLoading, $filter, Toast, registrationService) {
    $ionicLoading.hide();
    $scope.user = {
        nickname: '',
        age_range: '',
        averagekm: '',
        use_transport: null,
        vehicles: [],
        nick_recommandation: ''
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
                checked: false,
                value: 'train'
        },
            {
                text: $filter('translate')('registration_transport_bus'),
                checked: false,
                value: 'bus'
        },
            {
                text: $filter('translate')('registration_transport_carsharing'),
                checked: false,
                value: 'shared car'
        },
            {
                text: $filter('translate')('registration_transport_bikesharing'),
                checked: false,
                value: 'shared bike'
        }
  ];
    }

    function initPrivateTransport() {
        $scope.privateTransport = [
            {
                text: $filter('translate')('registration_transport_car'),
                checked: false,
                value: 'private car'
        },
            {
                text: $filter('translate')('registration_transport_bike'),
                checked: false,
                value: 'private bike'
        },
            {
                text: $filter('translate')('registration_transport_foot'),
                checked: false,
                value: 'walk'
        }

    ];
    }
    $scope.initTransport = function () {
        initPrivateTransport();
        initPublicTransport();
    }
    $scope.data = {
        use_transport: true
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
              registrationService.register($scope.user).then(function () {
                  Toast.show("registrato", "short", "bottom");

              }, function (err) {
                  if (err == '409') {
                      Toast.show("nickname presente", "short", "bottom");

                  }
              });
            }
        }
    }

    function createArrayOfVeicles() {
        if ($scope.user.use_transport) {
            for (var i = 0; i < $scope.publicTransport.length; i++) {
                if ($scope.publicTransport[i].checked)
                    $scope.user.vehicles.push($scope.publicTransport[i].value);
            }
        } else {
            for (var i = 0; i < $scope.privateTransport.length; i++) {
                if ($scope.privateTransport[i].checked)
                    $scope.user.vehicles.push($scope.privateTransport[i].value);
            }
        }
    }

    function checkParams() {
        $scope.user.use_transport = $scope.data.use_transport;
        createArrayOfVeicles();
        if ($scope.user.nickname == '') {
            Toast.show($filter('translate')('registration_empty_nick'), "short", "bottom");
            return false;
        }
        if ($scope.user.age_range == '') {
            Toast.show($filter('translate')('registration_empty_age'), "short", "bottom");
            return false;
        }
        if ($scope.user.averagekm == '' || isNaN($scope.user.averagekm)) {
            Toast.show($filter('translate')('registration_empty_km'), "short", "bottom");
            return false;
        }
        if ($scope.user.vehicles.length == 0) {
            Toast.show($filter('translate')('registration_empty_transport'), "short", "bottom");
            return false;
        }
        return true;
        console.log(JSON.stringify($scope.user));
    }
});
