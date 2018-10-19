angular.module('viaggia.controllers.registration', [])

    .controller('RegistrationCtrl', function ($scope, $state, $cordovaCamera, profileService, notificationService, $ionicPopup, $filter, $ionicHistory, Toast, Config, registrationService, LoginService) {
        $scope.expandedRules = false;
        $scope.currentFile = null;
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
        $scope.profileImg = 'img/game/generic_user.png' + '?' + new Date().getTime();

        $scope.changeProfile = function () {
            $ionicPopup.confirm({
                title: $filter('translate')("change_image_title"),
                template: $filter('translate')("change_image_template"),
                buttons: [
                    {
                        text: $filter('translate')("btn_close"),
                        type: 'button-cancel'
                    },
                    {
                        text: $filter('translate')("change_image_confirm"),
                        type: 'button-custom',
                        onTap: function () {
                            document.getElementById('inputImg').click()
                        }
                    }
                ]
            });
        }

        $scope.image_source = 'img/game/generic_user.png' + '?' + new Date().getTime();
        $scope.setFile = function (element) {
            $scope.currentFile = element;
            var reader = new FileReader();

            reader.onload = function (event) {
                $scope.image_source = event.target.result
                $scope.$apply()

            }
            // when the file is read it triggers the onload event above.
            reader.readAsDataURL(element);
        }

        $scope.initTransport = function () {
            initPrivateTransport();
            initPublicTransport();
        }
        $scope.read = {
            isChecked: false
        }
        $scope.changepicture = function () {
            $scope.chooseAndUploadPhoto($scope.setFile)
        }
        $scope.register = function () {
            if (!$scope.read.isChecked) {
                Toast.show($filter('translate')('registration_must_accept'), "short", "bottom");
                return;
            } else {
                if (checkParams()) {
                    Config.loading();
                    registrationService.register($scope.user).then(function (success) {
                        if (success) {
                            if ($scope.currentFile) {
                                profileService.setProfileImage($scope.currentFile).then(function () {
                                    notificationService.registerUser();
                                    $state.go('app.home');
                                }, function (error) {
                                    if (error == 413) {
                                        Toast.show($filter('translate')('payload_large'), "short", "bottom");
                                        $state.go('app.home');
                                        console.log("Payload too large");
                                        return;
                                    }
                                    if (error == 415) {
                                        Toast.show($filter('translate')('payload_unsupported'), "short", "bottom");
                                        $state.go('app.home');
                                        console.log("Unsupported media type");
                                        return;
                                    }
                                    console.log("network error");
                                }).finally(Config.loaded)
                            } else {
                                notificationService.registerUser();
                                $state.go('app.home');
                            }
                        } else {
                            Toast.show($filter('translate')('toast_error_server_template'), "short", "bottom");

                        }

                    }, function (errStatus) {
                        if (errStatus == '409') {
                            Toast.show($filter('translate')('nickname_inuse'), "short", "bottom");
                        } else {
                            Toast.show($filter('translate')('toast_error_server_template'), "short", "bottom");

                        }
                        Config.loaded();
                    });


                }
            }
        }


        function charsAllowed(nickname) {
            var pattern = /^[a-zA-Z0-9]*$/;
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
