angular.module('viaggia.directives', [])
    .directive('formattedTime', function ($filter) {

        return {
            require: '?ngModel',
            link: function (scope, elem, attr, ngModel) {
                if (!ngModel)
                    return;
                if (attr.type !== 'time')
                    return;

                ngModel.$formatters.unshift(function (value) {
                    return value.replace(/:[0-9]+.[0-9]+$/, '');
                });
            }
        };

    })
    .directive('standardTimeNoMeridian', function () {
        return {
            restrict: 'AE',
            replace: true,
            scope: {
                etime: '=etime'
            },
            template: "<strong>{{stime}}</strong>",
            link: function (scope, elem, attrs) {

                scope.stime = epochParser(scope.etime, 'time');

                function prependZero(param) {
                    if (String(param).length < 2) {
                        return "0" + String(param);
                    }
                    return param;
                }

                function epochParser(val, opType) {
                    if (val === null) {
                        return "00:00";
                    } else {
                        if (opType === 'time') {
                            var hours = parseInt(val / 3600);
                            var minutes = (val / 60) % 60;

                            return (prependZero(hours) + ":" + prependZero(minutes));
                        }
                    }
                }

                scope.$watch('etime', function (newValue, oldValue) {
                    scope.stime = epochParser(scope.etime, 'time');
                });

            }
        };
    })
