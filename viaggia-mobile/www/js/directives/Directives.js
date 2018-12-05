angular.module('viaggia.directives', [])

    .directive('formattedTime', function ($filter) {
        return {
            require: '?ngModel',
            link: function (scope, elem, attr, ngModel) {
                if (!ngModel) {
                    return;
                }

                if (attr.type !== 'time') {
                    return;
                }

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
            template: "<span>{{stime}}</span>",
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

    //    .directive('ngLastRepeat', function ($timeout) {
    //        return {
    //            restrict: 'A',
    //            link: function (scope, element, attr) {
    //                if (scope.$last === true) {
    //                    $timeout(function () {
    //                        scope.$emit('ngLastRepeat' + (attr.ngLastRepeat ? '.' + attr.ngLastRepeat : ''));
    //                    });
    //                }
    //            }
    //        };
    //    })

    .directive('placeautocomplete', function () {
        var index = -1;

        return {
            restrict: 'E',
            scope: {
                searchParam: '=ngModel',
                suggestions: '=data',
                onType: '=onType',
                onSelect: '=onSelect',
                onClear: '=onClear',
                playerautocompleteRequired: '='
            },
            controller: [
                '$scope',
                function ($scope) {
                    // the index of the suggestions that's currently selected
                    $scope.selectedIndex = -1;

                    $scope.initLock = true;

                    // set new index
                    $scope.setIndex = function (i) {
                        $scope.selectedIndex = parseInt(i);
                    };

                    this.setIndex = function (i) {
                        $scope.setIndex(i);
                        $scope.$apply();
                    };

                    $scope.getIndex = function (i) {
                        return $scope.selectedIndex;
                    };

                    $scope.clear = function () {
                        $scope.searchParam = '';
                        $scope.onClear();
                    };

                    // watches if the parameter filter should be changed
                    var watching = true;

                    // autocompleting drop down on/off
                    $scope.completing = false;

                    // starts autocompleting on typing in something
                    $scope.$watch('searchParam', function (newValue, oldValue) {
                        if (oldValue === newValue || (!oldValue && $scope.initLock)) {
                            return;
                        }

                        if (watching && typeof $scope.searchParam !== 'undefined' && $scope.searchParam !== null) {
                            $scope.completing = true;
                            $scope.searchFilter = $scope.searchParam;
                            $scope.selectedIndex = -1;
                        }

                        // function thats passed to on-type attribute gets executed
                        if ($scope.onType) {
                            $scope.onType($scope.searchParam);
                        }
                    });

                    // for hovering over suggestions
                    this.preSelect = function (suggestion) {
                        watching = false;

                        // this line determines if it is shown
                        // in the input field before it's selected:
                        //$scope.searchParam = suggestion;

                        $scope.$apply();
                        watching = true;
                    };

                    $scope.preSelect = this.preSelect;

                    this.preSelectOff = function () {
                        watching = true;
                    };

                    $scope.preSelectOff = this.preSelectOff;

                    // selecting a suggestion with RIGHT ARROW or ENTER
                    $scope.select = function (suggestion) {
                        if (suggestion) {
                            $scope.searchParam = suggestion;
                            $scope.searchFilter = suggestion;
                            if ($scope.onSelect)
                                $scope.onSelect(suggestion);
                        }
                        watching = false;
                        $scope.completing = false;
                        setTimeout(function () {
                            watching = true;
                        }, 1000);
                        $scope.setIndex(-1);
                    };
                }
            ],
            link: function (scope, element, attrs) {
                setTimeout(function () {
                    scope.initLock = false;
                    scope.$apply();
                }, 250);

                var attr = '';

                // Default atts
                scope.attrs = {
                    "placeholder": "start typing...",
                    "class": "",
                    "id": "",
                    "inputclass": "",
                    "inputid": ""
                };

                for (var a in attrs) {
                    attr = a.replace('attr', '').toLowerCase();
                    // add attribute overriding defaults
                    // and preventing duplication
                    if (a.indexOf('attr') === 0) {
                        scope.attrs[attr] = attrs[a];
                    }
                }

                if (attrs.clickActivation) {
                    element[0].onclick = function (e) {
                        if (!scope.searchParam) {
                            setTimeout(function () {
                                scope.completing = true;
                                scope.$apply();
                            }, 200);
                        }
                    };
                }

                var key = {
                    left: 37,
                    up: 38,
                    right: 39,
                    down: 40,
                    enter: 13,
                    esc: 27,
                    tab: 9
                };

                document.addEventListener("keydown", function (e) {
                    var keycode = e.keyCode || e.which;

                    switch (keycode) {
                        case key.esc:
                            // disable suggestions on escape
                            scope.select();
                            scope.setIndex(-1);
                            scope.$apply();
                            e.preventDefault();
                    }
                }, true);

                document.addEventListener("blur", function (e) {
                    // disable suggestions on blur
                    // we do a timeout to prevent hiding it before a click event is registered
                    setTimeout(function () {
                        scope.select();
                        scope.setIndex(-1);
                        scope.$apply();
                    }, 150);
                }, true);

                element[0].addEventListener("keydown", function (e) {
                    var keycode = e.keyCode || e.which;

                    var l = angular.element(this).find('li').length;

                    // this allows submitting forms by pressing Enter in the autocompleted field
                    if (!scope.completing || l == 0) return;

                    // implementation of the up and down movement in the list of suggestions
                    switch (keycode) {
                        case key.up:
                            index = scope.getIndex() - 1;
                            if (index < -1) {
                                index = l - 1;
                            } else if (index >= l) {
                                index = -1;
                                scope.setIndex(index);
                                scope.preSelectOff();
                                break;
                            }
                            scope.setIndex(index);

                            if (index !== -1)
                                scope.preSelect(angular.element(angular.element(this).find('li')[index]).text());

                            scope.$apply();

                            break;
                        case key.down:
                            index = scope.getIndex() + 1;
                            if (index < -1) {
                                index = l - 1;
                            } else if (index >= l) {
                                index = -1;
                                scope.setIndex(index);
                                scope.preSelectOff();
                                scope.$apply();
                                break;
                            }
                            scope.setIndex(index);

                            if (index !== -1) {
                                scope.preSelect(angular.element(angular.element(this).find('li')[index]).text());
                            }

                            break;
                        case key.left:
                            break;
                        case key.right:
                        case key.enter:
                        case key.tab:
                            index = scope.getIndex();
                            // scope.preSelectOff();
                            if (index !== -1) {
                                scope.select(angular.element(angular.element(this).find('li')[index]).text());
                                if (keycode == key.enter) {
                                    e.preventDefault();
                                }
                            } else {
                                if (keycode == key.enter) {
                                    scope.select();
                                }
                            }
                            scope.setIndex(-1);
                            scope.$apply();

                            break;
                        case key.esc:
                            // disable suggestions on escape
                            scope.select();
                            scope.setIndex(-1);
                            scope.$apply();
                            e.preventDefault();
                            break;
                        default:
                            return;
                    }
                });
            },
            template: '\
        <div class="placeautocomplete {{ attrs.class }}" ng-class="{ notempty: (searchParam.length > 0) }" id="{{ attrs.id }}">\
          <input\
            type="text"\
            ng-model="searchParam"\
            placeholder="{{ attrs.placeholder }}"\
            class="placeautocomplete-input {{ attrs.inputclass }}"\
            id="{{ attrs.inputid }}"\
            ng-required="{{ placeautocompleteRequired }}" />\
            <a ng-if="searchParam.length > 0" class="placeautocomplete-input-clear" ng-click="clear()"><i class="icon ion-android-cancel"></i></a>\
          <ul ng-show="completing && (suggestions).length > 0">\
            <li\
              suggestion\
              ng-repeat="suggestion in suggestions track by $index"\
              index="{{ $index }}"\
              val="{{ suggestion }}"\
              class="suggestion"\
              ng-class="{ active: ($index === selectedIndex) }"\
              ng-click="select(suggestion)"\
              ng-bind-html="suggestion | highlight:searchParam"></li>\
          </ul>\
        </div>'
        };
    })

    .directive('playerautocomplete', function () {
        var index = -1;

        return {
            restrict: 'E',
            scope: {
                searchParam: '=ngModel',
                suggestions: '=data',
                onType: '=onType',
                onSelect: '=onSelect',
                onClear: '=onClear',
                getUserImg:'&',
                player:'&',
                playerautocompleteRequired: '='
            },
            controller: [
                '$scope',
                function ($scope) {
                    // the index of the suggestions that's currently selected
                    $scope.selectedIndex = -1;

                    $scope.initLock = true;

                    // set new index
                    $scope.setIndex = function (i) {
                        $scope.selectedIndex = parseInt(i);
                    };

                    this.setIndex = function (i) {
                        $scope.setIndex(i);
                        $scope.$apply();
                    };

                    $scope.getIndex = function (i) {
                        return $scope.selectedIndex;
                    };

                    $scope.clear = function () {
                        $scope.searchParam = '';
                        $scope.onClear();
                    };

                    // watches if the parameter filter should be changed
                    var watching = true;

                    // autocompleting drop down on/off
                    $scope.completing = false;

                    // starts autocompleting on typing in something
                    $scope.$watch('searchParam', function (newValue, oldValue) {
                        if (oldValue === newValue || (!oldValue && $scope.initLock)) {
                            return;
                        }

                        if (watching && typeof $scope.searchParam !== 'undefined' && $scope.searchParam !== null) {
                            $scope.completing = true;
                            $scope.searchFilter = $scope.searchParam;
                            $scope.selectedIndex = -1;
                        }

                        // function thats passed to on-type attribute gets executed
                        if ($scope.onType) {
                            $scope.onType($scope.searchParam);
                        }
                    });

                    // for hovering over suggestions
                    this.preSelect = function (suggestion) {
                        watching = false;

                        // this line determines if it is shown
                        // in the input field before it's selected:
                        //$scope.searchParam = suggestion;

                        $scope.$apply();
                        watching = true;
                    };

                    $scope.preSelect = this.preSelect;

                    this.preSelectOff = function () {
                        watching = true;
                    };

                    $scope.preSelectOff = this.preSelectOff;

                    // selecting a suggestion with RIGHT ARROW or ENTER
                    $scope.select = function (suggestion) {
                        if (suggestion) {
                            $scope.searchParam = suggestion;
                            $scope.searchFilter = suggestion;
                            if ($scope.onSelect)
                                $scope.onSelect(suggestion);
                        }
                        watching = false;
                        $scope.completing = false;
                        setTimeout(function () {
                            watching = true;
                        }, 1000);
                        $scope.setIndex(-1);
                    };
                }
            ],
            link: function (scope, element, attrs) {
                setTimeout(function () {
                    scope.initLock = false;
                    scope.$apply();
                }, 250);

                var attr = '';

                // Default atts
                scope.attrs = {
                    "placeholder": "start typing...",
                    "class": "",
                    "id": "",
                    "inputclass": "",
                    "inputid": ""
                };

                for (var a in attrs) {
                    attr = a.replace('attr', '').toLowerCase();
                    // add attribute overriding defaults
                    // and preventing duplication
                    if (a.indexOf('attr') === 0) {
                        scope.attrs[attr] = attrs[a];
                    }
                }

                if (attrs.clickActivation) {
                    element[0].onclick = function (e) {
                        if (!scope.searchParam) {
                            setTimeout(function () {
                                scope.completing = true;
                                scope.$apply();
                            }, 200);
                        }
                    };
                }

                var key = {
                    left: 37,
                    up: 38,
                    right: 39,
                    down: 40,
                    enter: 13,
                    esc: 27,
                    tab: 9
                };

                document.addEventListener("keydown", function (e) {
                    var keycode = e.keyCode || e.which;

                    switch (keycode) {
                        case key.esc:
                            // disable suggestions on escape
                            scope.select();
                            scope.setIndex(-1);
                            scope.$apply();
                            e.preventDefault();
                    }
                }, true);

                document.addEventListener("blur", function (e) {
                    // disable suggestions on blur
                    // we do a timeout to prevent hiding it before a click event is registered
                    setTimeout(function () {
                        scope.select();
                        scope.setIndex(-1);
                        scope.$apply();
                    }, 150);
                }, true);

                element[0].addEventListener("keydown", function (e) {
                    var keycode = e.keyCode || e.which;

                    var l = angular.element(this).find('li').length;

                    // this allows submitting forms by pressing Enter in the autocompleted field
                    if (!scope.completing || l == 0) return;

                    // implementation of the up and down movement in the list of suggestions
                    switch (keycode) {
                        case key.up:
                            index = scope.getIndex() - 1;
                            if (index < -1) {
                                index = l - 1;
                            } else if (index >= l) {
                                index = -1;
                                scope.setIndex(index);
                                scope.preSelectOff();
                                break;
                            }
                            scope.setIndex(index);

                            if (index !== -1)
                                scope.preSelect(angular.element(angular.element(this).find('li')[index]).text());

                            scope.$apply();

                            break;
                        case key.down:
                            index = scope.getIndex() + 1;
                            if (index < -1) {
                                index = l - 1;
                            } else if (index >= l) {
                                index = -1;
                                scope.setIndex(index);
                                scope.preSelectOff();
                                scope.$apply();
                                break;
                            }
                            scope.setIndex(index);

                            if (index !== -1) {
                                scope.preSelect(angular.element(angular.element(this).find('li')[index]).text());
                            }

                            break;
                        case key.left:
                            break;
                        case key.right:
                        case key.enter:
                        case key.tab:
                            index = scope.getIndex();
                            // scope.preSelectOff();
                            if (index !== -1) {
                                scope.select(angular.element(angular.element(this).find('li')[index]).text());
                                if (keycode == key.enter) {
                                    e.preventDefault();
                                }
                            } else {
                                if (keycode == key.enter) {
                                    scope.select();
                                }
                            }
                            scope.setIndex(-1);
                            scope.$apply();

                            break;
                        case key.esc:
                            // disable suggestions on escape
                            scope.select();
                            scope.setIndex(-1);
                            scope.$apply();
                            e.preventDefault();
                            break;
                        default:
                            return;
                    }
                });
            },
        //     template: '\
        // <div class="playerautocomplete {{ attrs.class }}" ng-class="{ notempty: (searchParam.length > 0) }" id="{{ attrs.id }}">\
        //   <input\
        //     type="text"\
        //     ng-model="searchParam"\
        //     placeholder="{{ attrs.placeholder }}"\
        //     class="input-challenge-search {{ attrs.inputclass }}"\
        //     id="{{ attrs.inputid }}"\
        //     ng-required="{{ playerautocompleteRequired }}" />\
        //   <ul ng-show="completing && (suggestions).length > 0">\
        //     <li\
        //       suggestion-player\
        //       ng-repeat="suggestion in suggestions track by $index"\
        //       index="{{ $index }}"\
        //       val="{{ suggestion }}"\
        //       class="suggestion"\
        //       ng-class="{ active: ($index === selectedIndex) }"\
        //       ng-click="select(suggestion)">\
        //       <img class="challenge-profile-img" ng-src="{{getUserImg(player.id)}}">\
        //       <span ng-bind-html="suggestion | highlight:searchParam"></span></li>\
        //   </ul>\
        // </div>'
        // };
        template: '\
        <div class="playerautocomplete {{ attrs.class }}" ng-class="{ notempty: (searchParam.length > 0) }" id="{{ attrs.id }}">\
          <input\
            type="text"\
            ng-model="searchParam"\
            placeholder="{{ attrs.placeholder }}"\
            class="input-challenge-search {{ attrs.inputclass }}"\
            id="{{ attrs.inputid }}"\
            ng-required="{{ playerautocompleteRequired }}" />\
          <ul ng-show="completing && (suggestions).length > 0">\
            <li\
              suggestion-player\
              ng-repeat="suggestion in suggestions track by $index"\
              index="{{ $index }}"\
              val="{{ suggestion }}"\
              class="suggestion"\
              ng-class="{ active: ($index === selectedIndex) }"\
              ng-click="select(suggestion)">\
              <span ng-bind-html="suggestion | highlight:searchParam"></span></li>\
          </ul>\
        </div>'
        };
    })
    .filter('highlight', ['$sce', function ($sce) {
        return function (input, searchParam) {
            if (typeof input === 'function') return '';
            if (searchParam) {
                var words = '(' +
                    searchParam.split(/\ /).join(' |') + '|' +
                    searchParam.split(/\ /).join('|') +
                    ')',
                    exp = new RegExp(words, 'gi');
                if (words.length) {
                    input = input.replace(exp, "<span class=\"highlight\">$1</span>");
                }
            }
            return $sce.trustAsHtml(input);
        };
    }])
    .directive('browseTo', function ($ionicGesture) {
        return {
            restrict: 'A',
            link: function ($scope, $element, $attrs) {
                var handleTap = function (e) {
                    var inAppBrowser = window.open(encodeURI($attrs.browseTo), '_system');
                };
                var tapGesture = $ionicGesture.on('tap', handleTap, $element);
                $scope.$on('$destroy', function () {
                    // Clean up - unbind drag gesture handler
                    $ionicGesture.off(tapGesture, 'tap', handleTap);
                });
            }
        }
    })

    .directive('compile', ['$compile', function ($compile) {
        return function (scope, element, attrs) {
            scope.$watch(
                function (scope) {
                    return scope.$eval(attrs.compile);
                },
                function (value) {
                    element.html(value);
                    $compile(element.contents())(scope);
                }
            )
        };
    }])
    .directive('a', [
        function () {
            return {
                restrict: 'E',
                link: function (scope, element, attrs, ctrl) {
                    element.on('click', function (event) {
                        // process only non-angular links / links starting with hash
                        if (element[0].href && !element[0].attributes['ng-href'] && element[0].attributes['href'].value.indexOf('#') != 0) {
                            event.preventDefault();

                            var url = element[0].attributes['href'].value.replace(/“/gi, '').replace(/”/gi, '').replace(/"/gi, '').replace(/‘/gi, '').replace(/’/gi, '').replace(/'/gi, '');
                            console.log('url: <' + url + '>');
                            //var protocol = element[0].protocol;
                            //console.log('protocol: '+protocol);
                            //if (protocol && url.indexOf(protocol) == 0) {

                            // do not open broken/relative links
                            if (url.indexOf('http://') == 00 || url.indexOf('https://') == 0 || url.indexOf('mailto:') == 0 || url.indexOf('tel:') == 0 || url.indexOf('sms:') == 0) {
                                window.open(url, '_system');
                            } else {
                                console.log("blocking broken link: " + url);
                            }
                        }
                    });
                }
            };
        }])

    .directive('suggestion', function () {
        return {
            restrict: 'A',
            require: '^placeautocomplete', // ^look for controller on parents element
            link: function (scope, element, attrs, autoCtrl) {
                element.bind('mouseenter', function () {
                    autoCtrl.preSelect(attrs.val);
                    autoCtrl.setIndex(attrs.index);
                });

                element.bind('mouseleave', function () {
                    autoCtrl.preSelectOff();
                });
            }
        }
    })
    .directive('suggestion-player', function () {
        return {
            restrict: 'A',
            require: '^playerautocomplete', // ^look for controller on parents element
            link: function (scope, element, attrs, autoCtrl) {
                element.bind('mouseenter', function () {
                    autoCtrl.preSelect(attrs.val);
                    autoCtrl.setIndex(attrs.index);
                });

                element.bind('mouseleave', function () {
                    autoCtrl.preSelectOff();
                });
            }
        };
    }).directive('compile', ['$compile', function ($compile) {
        return function(scope, element, attrs) {
            scope.$watch(
                function(scope) {
                    // watch the 'compile' expression for changes
                    return scope.$eval(attrs.compile);
                },
                function(value) {
                    // when the 'compile' expression changes
                    // assign it into the current DOM
                    element.html(value);
    
                    // compile the new DOM and link it to the current
                    // scope.
                    // NOTE: we only compile .childNodes so that
                    // we don't get into infinite loop compiling ourselves
                    $compile(element.contents())(scope);
                }
            );
        };
    }]);
