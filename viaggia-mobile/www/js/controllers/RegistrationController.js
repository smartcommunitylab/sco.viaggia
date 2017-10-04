angular.module('viaggia.controllers.registration', [])

    .controller('RegistrationCtrl', function ($scope, $state, $filter, $ionicHistory, $ionicModal, $location, $ionicScrollDelegate, Toast, Config, registrationService, LoginService) {
        $scope.expandedRules = false;
        Config.loaded();
        $scope.user = {
            nickname: '',
            mail: LoginService.getUserProfile().email,
            age_range: '',
            averagekm: '',
            use_transport: true,
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
        $scope.read = {
            isChecked: false
        }

        $scope.register = function () {
            if (!$scope.read.isChecked) {
                Toast.show($filter('translate')('registration_must_accept'), "short", "bottom");
                return;
            } else {
                if (checkParams()) {
                    Config.loading();
                    registrationService.register($scope.user).then(function () {
                        Config.loaded();
                        $ionicHistory.nextViewOptions({
                            disableBack: true,
                            historyRoot: true
                        });
                        $state.go('app.home');

                    }, function (errStatus) {
                        if (errStatus == '409') {
                            Toast.show($filter('translate')('nickname_inuse'), "short", "bottom");
                        }
                        Config.loaded();
                    });
                }
            }
        }


 function charsAllowed (nickname){
     var pattern=/^[a-zA-Z0-9]*$/;
     return pattern.test(nickname);

 }
        function checkParams() {
            //createArrayOfVeicles();
            if ($scope.user.nickname == '') {
                Toast.show($filter('translate')('registration_empty_nick'), "short", "bottom");
                return false;
            }
            if (!charsAllowed($scope.user.nickname)) {
                Toast.show($filter('translate')('registration_wrong_chars'), "short", "bottom");
                return false;
            }
            if ($scope.user.mail == '') {
                Toast.show($filter('translate')('registration_empty_mail'), "short", "bottom");
                return false;
            }

            return true;
        }
    });
