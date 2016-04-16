angular.module('viaggia.controllers.registration', [])

.controller('RegistrationCtrl', function ($scope, $ionicLoading, $filter, Toast) {
    $ionicLoading.hide();
    $scope.user = {
        nickname: '',
        age_range: '',
        averagekm: '',
        publictransport: null,
        listOftransport: [],
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
        publictransport: true
    };
    $scope.read = {
        isChecked: false
    }
    var getVehicles = function() {
      var res = [];
      if ($cope.data.publictransport) {
        $scope.publicTransport.forEach(function(t) {
          if (t.checked) {
            res.push(t.value);
          }
        });
      } else {
        $scope.privateTransport.forEach(function(t) {
          if (t.checked) {
            res.push(t.value);
          }
        });
      }
      return res;
    }

    $scope.register = function () {
        if (!$scope.read.isChecked) {
            Toast.show($filter('translate')('registration_must_accept'), "short", "bottom");
            return;
        } else {
            if (checkParams()) {

              var nickname = $scope.user.nickname;
              var personalData = {
                age_range: $scope.user.age_range,
                averagekm: $scope.user.averagekm,
                use_transport: $scope.data.publictransport,
                vehicles: getVehicles(),
                nick_recommandation: $scope.user.nick_recommandation
              };
                Toast.show("registra", "short", "bottom");
            }
        }
    }

    function checkParams() {
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
        if ($scope.user.listOftransport.length == 0) {
            Toast.show($filter('translate')('registration_empty_transport'), "short", "bottom");
            return false;
        }
        return true;
        console.log(JSON.stringify($scope.user));
    }
});
