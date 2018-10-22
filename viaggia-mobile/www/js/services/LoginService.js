/*
 * Remember to move URLs and other stuff in an external config/constant file
 */

angular.module('smartcommunitylab.services.login', [])

.factory('LoginService', function ($rootScope, $q, $http, $window) {
	var service = {};

	var libConfigOK;

	service.LOGIN_TYPE = {
		AAC: 'oauth',
		CUSTOM: 'custom',
		COOKIE: 'cookie'
	};

	// 'googlelocal' and 'facebooklocal' used locally
	service.PROVIDER = {
		INTERNAL: 'internal',
		GOOGLE: 'google',
		FACEBOOK: 'facebook'
	};

	var PROVIDER_NATIVE = {
		GOOGLE: 'googlelocal',
		FACEBOOK: 'facebooklocal'
	};

	var AAC = {
		AUTHORIZE_URI: "/eauth/authorize",
		SUCCESS_REGEX: /\?code=(.+)$/,
		ERROR_REGEX: /\?error=(.+)$/,
		BASIC_PROFILE_URI: "/basicprofile/me",
		ACCOUNT_PROFILE_URI: "/accountprofile/me",
		TOKEN_URI: "/oauth/token",
		REGISTER_URI: "/internal/register/rest",
		RESET_URI: "/internal/reset",
		REVOKE_URI: "/eauth/revoke/",
		REDIRECT_URL: "http://localhost"
	};

	var authWindow = null;

	var settings = {
		loginType: undefined,
		googleWebClientId: undefined,
		aacUrl: undefined,
		clientId: undefined,
		clientSecret: undefined,
		customConfig: undefined
	};

	var user = {
		provider: null,
		profile: null,
		tokenInfo: null
	};

	service.localStorage = {
		PROVIDER: 'user_provider',
		PROFILE: 'user_profile',
		TOKENINFO: 'user_tokenInfo',
		getProvider: function () {
			return JSON.parse($window.localStorage.getItem(this.PROVIDER));
		},
		saveProvider: function () {
			$window.localStorage.setItem(this.PROVIDER, JSON.stringify(user.provider));
		},
		getProfile: function () {
			return JSON.parse($window.localStorage.getItem(this.PROFILE));
		},
		saveProfile: function () {
			$window.localStorage.setItem(this.PROFILE, JSON.stringify(user.profile));
		},
		getTokenInfo: function () {
			return JSON.parse($window.localStorage.getItem(this.TOKENINFO));
		},
		saveTokenInfo: function () {
			$window.localStorage.setItem(this.TOKENINFO, JSON.stringify(user.tokenInfo));
		},
		getUser: function () {
			user = {
				provider: this.getProvider(),
				profile: this.getProfile(),
				tokenInfo: this.getTokenInfo()
			};
            return user;
		},
		saveUser: function () {
			this.saveProvider();
			this.saveProfile();
			this.saveTokenInfo();
		},
		deleteUser: function () {
			$window.localStorage.removeItem(this.PROVIDER);
			$window.localStorage.removeItem(this.PROFILE);
			$window.localStorage.removeItem(this.TOKENINFO);
		}
	};

	service.userIsLogged = function () {
		return (!!user && !!user.provider && !!user.profile && !!user.profile.userId && (settings.loginType == service.LOGIN_TYPE.COOKIE ? true : !!user.tokenInfo));
	};

	var saveToken = function (tokenInfo) {
		if (!!tokenInfo) {
			user.tokenInfo = tokenInfo;
			// set expiry (after removing 1 hr).
			var t = new Date();
			t.setSeconds(t.getSeconds() + (user.tokenInfo.expires_in - (60 * 60)));
			// FIXME only dev purpose
			//t.setSeconds(t.getSeconds() + 10);
			// FIXME /only dev purpose
			user.tokenInfo.validUntil = t;
		}
		service.localStorage.saveTokenInfo();
	};

	var resetUser = function () {
		user = {
			provider: undefined,
			profile: undefined,
			tokenInfo: undefined
		};
		service.localStorage.deleteUser();
	};

	var isEmailValid = function (email) {
		var regex = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;
		return regex.test(email);
	};

	service.init = function (newSettings) {
		var deferred = $q.defer();

		if (!newSettings) {
			libConfigOK = false;
			deferred.reject('Invalid settings');
		} else {
			var validLoginType = false;
			for (var key in service.LOGIN_TYPE) {
				if (validLoginType == false && newSettings.loginType == service.LOGIN_TYPE[key]) {
					validLoginType = true;
				}
			}

			if (!validLoginType) {
				libConfigOK = false;
				deferred.reject('Invalid login type');
			} else {
				if (newSettings.loginType == service.LOGIN_TYPE.AAC && (!newSettings.aacUrl || !newSettings.clientId || !newSettings.clientSecret)) {
					libConfigOK = false;
					deferred.reject('AAC URL, clientId and clientSecret needed');
				} else if (newSettings.loginType == service.LOGIN_TYPE.COOKIE && (!newSettings.customConfig || !newSettings.customConfig.AUTHORIZE_URL || !newSettings.customConfig.SUCCESS_REGEX || !newSettings.customConfig.ERROR_REGEX || !newSettings.customConfig.REVOKE_URL || !newSettings.customConfig.REDIRECT_URL)) {
					libConfigOK = false;
					deferred.reject('Complete custom config needed');
				}
			}
		}

		if (libConfigOK != false) {
			// undefined or true
			settings = newSettings;
			libConfigOK = true;
			service.localStorage.getUser();
			deferred.resolve();
		}

		return deferred.promise;
	};

	/*
	 * get token using the authorization code
	 */
	var getAACtoken = function (code) {
		var deferred = $q.defer();

		var url, redirectUri;
		if (settings.loginType == service.LOGIN_TYPE.AAC) {
			url = settings.aacUrl + AAC.TOKEN_URI;
			redirectUri = AAC.REDIRECT_URL;
		} else {
			deferred.reject('[LOGIN] loginType is not AAC');
			return deferred.promise;
		}

		$http.post(url, null, {
			params: {
				'client_id': settings.clientId,
				'client_secret': settings.clientSecret,
				'code': code,
				'redirect_uri': redirectUri,
				'grant_type': 'authorization_code'
			}
		}).then(
			function (response) {
				if (!!response.data.access_token) {
					console.log('[LOGIN] AAC token obtained');
					deferred.resolve(response.data);
				} else {
					deferred.resolve(null);
				}
			},
			function (responseError) {
				deferred.reject(responseError);
			}
		);

		return deferred.promise;
	};

	/*
	 * get token using credentials
	 */
	var getAACtokenInternal = function (credentials) {
		var deferred = $q.defer();

		$http.post(settings.aacUrl + AAC.TOKEN_URI, null, {
			params: {
				'username': credentials.email,
				'password': credentials.password,
				'client_id': settings.clientId,
				'client_secret': settings.clientSecret,
				'grant_type': 'password'
			},
			headers: {
				'Accept': 'application/json',
			},
			timeout: 10000
		}).then(
			function (response) {
				if (!!response.data.access_token) {
					console.log('[LOGIN] AAC token obtained');
					deferred.resolve(response.data);
				} else {
					deferred.reject(!!response.data.exception ? response.data.exception : null);
				}
			},
			function (reason) {
				deferred.reject(reason);
			}
		);

		return deferred.promise;
	};

	var remoteAAC = {
		getBasicProfile: function getBasicProfile(tokenInfo) {
			var deferred = $q.defer();

			$http.get(settings.aacUrl + AAC.BASIC_PROFILE_URI, {
				headers: {
					'Authorization': 'Bearer ' + tokenInfo.access_token
				},
                timeout: 10000
			}).then(
				function (response) {
					deferred.resolve(response.data);
				},
				function (reason) {
					deferred.reject(reason);
				}
			);

			return deferred.promise;
		},
		getAccountProfile: function getBasicProfile(tokenInfo) {
			var deferred = $q.defer();

			$http.get(settings.aacUrl + AAC.ACCOUNT_PROFILE_URI, {
				headers: {
					'Authorization': 'Bearer ' + tokenInfo.access_token
				},
                timeout: 10000
			}).then(
				function (response) {
					deferred.resolve(response.data);
				},
				function (reason) {
					deferred.reject(reason);
				}
			);

			return deferred.promise;
		},
		getCompleteProfile: function (tokenInfo) {
			var deferred = $q.defer();

			remoteAAC.getBasicProfile(tokenInfo).then(
				function (profile) {
					if (!!profile && !!profile.userId) {
						remoteAAC.getAccountProfile(tokenInfo).then(
							function (accountProfile) {
								for (var authority in accountProfile.accounts) {
									for (var k in accountProfile.accounts[authority]) {
										if (k.indexOf('email') >= 0 && !!accountProfile.accounts[authority][k]) {
											profile.email = accountProfile.accounts[authority][k];
										}
									}
								}
								deferred.resolve(profile);
							},
							function (reason) {
								deferred.resolve(profile);
							}
						);
					} else {
						deferred.resolve(profile);
					}
				},
				function (reason) {
					deferred.reject(reason);
				}
			);

			return deferred.promise;
		}
	};

	/*
	 * login with provider (and, if needed, credentials)
	 */
	service.login = function (provider, credentials) {
		var deferred = $q.defer();

		if (!libConfigOK) {
			console.log('[LOGIN] ' + 'Invalid configuration');
			deferred.reject('Invalid configuration');
			return deferred.promise;
		}

		var validProvider = false;
		for (var key in service.PROVIDER) {
			if (validProvider == false && provider == service.PROVIDER[key]) {
				validProvider = true;
			}
		}

		if (!validProvider) {
			deferred.reject('Invalid provider');
			return deferred.promise;
		}

		if (provider == service.PROVIDER.FACEBOOK && ionic.Platform.isWebView() && !!facebookConnectPlugin) {
			// on mobile force Facebook plugin
			provider = PROVIDER_NATIVE.FACEBOOK;
		} else if (provider == service.PROVIDER.GOOGLE && ionic.Platform.isWebView() && !!$window.plugins.googleplus) {
			// on mobile force Google plugin
			provider = PROVIDER_NATIVE.GOOGLE;
		}

		var authorizeProvider = function (token) {
			var deferred = $q.defer();
			var processThat = false;

			var authUrl;
			// Build the OAuth consent page URL
			if (settings.loginType == service.LOGIN_TYPE.AAC) {
				authUrl = settings.aacUrl + AAC.AUTHORIZE_URI + '/' + provider;
				authUrl += '?client_id=' + settings.clientId + '&response_type=code' + '&redirect_uri=' + AAC.REDIRECT_URL;
				if (token) {
					authUrl += '&token=' + token;
				}
			} else if (settings.loginType == service.LOGIN_TYPE.COOKIE) {
				// TODO cookie
				authUrl = settings.customConfig.AUTHORIZE_URL + '/' + provider;
				if (token) {
					authUrl += '?token=' + encodeURIComponent(token);
				}
			}

			// Open the OAuth consent page in the InAppBrowser
			if (!authWindow) {
				authWindow = $window.open(authUrl, '_blank', 'location=no,toolbar=no');
				processThat = !!authWindow;
			}

			var processURL = function (url, deferred, w) {
				var success, error;

				if (settings.loginType == service.LOGIN_TYPE.AAC) {
					success = AAC.SUCCESS_REGEX.exec(url);
					error = AAC.ERROR_REGEX.exec(url);
				} else if (settings.loginType == service.LOGIN_TYPE.COOKIE) {
					// TODO cookie
					success = settings.customConfig.SUCCESS_REGEX.exec(url);
					error = settings.customConfig.ERROR_REGEX.exec(url);
				}

				if (w && (success || error)) {
					// Always close the browser when match is found
					w.close();
					authWindow = null;
				}

				if (success) {
					if (settings.loginType == service.LOGIN_TYPE.AAC) {
						var code = success[1];
						if (code.substring(code.length - 1) == '#') {
							code = code.substring(0, code.length - 1);
						}
						console.log('[LOGIN] AAC code obtained');
						deferred.resolve(code);
					} else if (settings.loginType == service.LOGIN_TYPE.COOKIE) {
						// TODO cookie
						var str = success[1];
						if (str.indexOf('#') != -1) {
							str = str.substring(0, str.indexOf('#'));
						}
						var profile = JSON.parse(decodeURIComponent(str));
						console.log('[LOGIN] profile obtained');
						deferred.resolve(profile);
					}
				} else if (error) {
					//The user denied access to the app
					deferred.reject({
						error: error[1]
					});
				}
			};

			if (ionic.Platform.isWebView()) {
				if (processThat) {
					authWindow.addEventListener('loadstart', function (e) {
						//console.log('[LOGIN] ' + e);
						var url = e.url;
						processURL(url, deferred, authWindow);
					});
				}
			} else {
				angular.element($window).bind('message', function (event) {
					$rootScope.$apply(function () {
						processURL(event.data, deferred);
					});
				});
			}

			return deferred.promise;
		};

		/* Actions by provider */
		switch (provider) {
			case PROVIDER_NATIVE.GOOGLE:
				/*
				Uses the cordova-plugin-googleplus plugin
				https://github.com/EddyVerbruggen/cordova-plugin-googleplus
				*/
				//'offline': true
				var options = {
					'scopes': 'profile email',
					'offline': true
				};

				if (ionic.Platform.isAndroid()) {
					if (!!settings.googleWebClientId) {
						options['webClientId'] = settings.googleWebClientId;
					} else {
						deferred.reject('webClientId mandatory for googlenative on Android');
						return deferred.promise;
					}
				}

				var successCallback;
				if (settings.loginType == service.LOGIN_TYPE.AAC) {
					successCallback = function (code) {
						getAACtoken(code).then(
							function (tokenInfo) {
								saveToken(tokenInfo);
								user.provider = provider;
								console.log('[LOGIN] Logged in with ' + user.provider);
								remoteAAC.getCompleteProfile(user.tokenInfo).then(
									function (profile) {
										user.profile = profile;
										service.localStorage.saveUser();
										deferred.resolve(profile);
									},
									function (reason) {
										deferred.reject(reason);
									}
								);
							},
							function (error) {
								deferred.reject(error);
							}
						);
					};
				} else if (settings.loginType == service.LOGIN_TYPE.COOKIE) {
					// TODO cookie
					successCallback = function (profile) {
						saveToken();
						user.provider = provider;
						console.log('[LOGIN] Logged in with ' + user.provider);
						user.profile = profile;
						service.localStorage.saveUser();
						deferred.resolve(profile);
					}
				}

				$window.plugins.googleplus.login(options,
					function (obj) {
						if (!!obj.idToken) {
							// or obj.serverAuthCode?
							console.log('[LOGIN] ' + provider + ' token obtained: ' + obj.idToken);
							authorizeProvider(obj.idToken).then(successCallback,
								function (reason) {
									console.log('[LOGIN] ' + reason);
									deferred.reject(reason);
								}
							);
						}
					},
					function (msg) {
						console.log('[LOGIN] ' + 'Login googlelocal error: ' + msg);
						deferred.reject('Login googlelocal error: ' + msg);
					}
				);
				break;
			case PROVIDER_NATIVE.FACEBOOK:
				/*
				Uses the cordova-plugin-facebook4 plugin
				https://github.com/jeduan/cordova-plugin-facebook4
				*/

				var successCallback;
				if (settings.loginType == service.LOGIN_TYPE.AAC) {
					successCallback = function (code) {
						getAACtoken(code).then(
							function (tokenInfo) {
								saveToken(tokenInfo);
								user.provider = provider;
								console.log('[LOGIN] Logged in with ' + user.provider);
								remoteAAC.getCompleteProfile(user.tokenInfo).then(
									function (profile) {
										user.profile = profile;
										service.localStorage.saveUser();
										deferred.resolve(profile);
									},
									function (reason) {
										deferred.reject(reason);
									}
								);
							},
							function (error) {
								deferred.reject(error);
							}
						);
					};
				} else if (settings.loginType == service.LOGIN_TYPE.COOKIE) {
					// TODO cookie
					successCallback = function (profile) {
						saveToken();
						user.provider = provider;
						console.log('[LOGIN] Logged in with ' + user.provider);
						user.profile = profile;
						service.localStorage.saveUser();
						deferred.resolve(profile);
					}
				}

				var gotProviderToken = function (response) {
					console.log('[LOGIN] FACEBOOK RESPONSE ' + JSON.stringify(response));
					console.log('[LOGIN] ' + provider + ' token obtained: ' + response.authResponse.accessToken);
					authorizeProvider(response.authResponse.accessToken).then(successCallback,
						function (reason) {
							console.log('[LOGIN] ' + reason);
							deferred.reject(reason);
						}
					);
				};

				var facebookLogin = function () {
					facebookConnectPlugin.login(['public_profile', 'email'], gotProviderToken, function (error) {
						deferred.reject(error);
					});
				};

				facebookConnectPlugin.getLoginStatus(
					function (response) {
						response.status == 'connected' ? gotProviderToken(response) : facebookLogin();
					},
					function () {
						facebookLogin();
					}
				);
				break;
			case service.PROVIDER.GOOGLE:
				authorizeProvider().then(
					function (code) {
						getAACtoken(code).then(
							function (tokenInfo) {
								saveToken(tokenInfo);
								user.provider = provider;
								console.log('[LOGIN] Logged in with ' + user.provider);
								remoteAAC.getCompleteProfile(user.tokenInfo).then(
									function (profile) {
										user.profile = profile;
										service.localStorage.saveUser();
										deferred.resolve(profile);
									},
									function (reason) {
										deferred.reject(reason);
									}
								);
							},
							function (error) {
								deferred.reject(error);
							}
						);
					},
					function (reason) {
						console.log('[LOGIN] ' + reason);
						deferred.reject(reason);
					}
				);
				break;
			case service.PROVIDER.INTERNAL:
				if (!credentials || !credentials.email || !credentials.password) {
					deferred.reject('Invalid credentials');
					break;
				}

				if (settings.loginType == service.LOGIN_TYPE.AAC) {
					/*
					Uses the internal AAC sign-in system
					*/
					getAACtokenInternal(credentials).then(
						function (tokenInfo) {
							saveToken(tokenInfo);
							user.provider = provider;
							console.log('[LOGIN] logged in with ' + user.provider);
							remoteAAC.getCompleteProfile(user.tokenInfo).then(
								function (profile) {
									user.profile = profile;
									service.localStorage.saveUser();
									deferred.resolve(profile);
								},
								function (reason) {
									deferred.reject(reason);
								}
							);
						},
						function (reason) {
							deferred.reject(reason);
						}
					);
				} else if (settings.loginType == service.LOGIN_TYPE.COOKIE) {
					$http.get(settings.customConfig.LOGIN_URL, {
						params: {
							email: credentials.email,
							password: credentials.password
						},
						headers: {
							'Accept': 'application/json',
						}
					}).then(
						function (response) {
							saveToken();
							user.provider = provider;
							console.log('[LOGIN] logged in with ' + user.provider);
							user.profile = response.data;
							service.localStorage.saveUser();
							deferred.resolve(response.data);
						},
						function (reason) {
							deferred.reject(reason);
						}
					);
				}
				break;
			default:
				deferred.reject('Provider "' + provider + '" still unsupported.');
		}

		return deferred.promise;
	};

	var refreshTokenDeferred = null;
	var refreshTokenTimestamp = null;
	/*
	 * GET (REFRESHING FIRST IF NEEDED) AAC TOKEN
	 */
	service.getValidAACtoken = function () {
		// 10 seconds
		if (!!refreshTokenDeferred && ((new Date().getTime()) < (refreshTokenTimestamp + (1000 * 10)))) {
			console.log('[LOGIN] use recent refreshToken deferred!');
			return refreshTokenDeferred.promise;
		}

		refreshTokenTimestamp = new Date().getTime();
		refreshTokenDeferred = $q.defer();

		// check for expiry.
		var now = new Date();
		if (!!user && !!user.tokenInfo && !!user.tokenInfo.refresh_token) {
			var validUntil = new Date(user.tokenInfo.validUntil);
			if (validUntil.getTime() >= now.getTime() + (60 * 60 * 1000)) {
				refreshTokenDeferred.resolve(user.tokenInfo.access_token);
			} else {
				$http.post(settings.aacUrl + AAC.TOKEN_URI, null, {
					params: {
						'client_id': settings.clientId,
						'client_secret': settings.clientSecret,
						'refresh_token': user.tokenInfo.refresh_token,
						'grant_type': 'refresh_token'
					}
				}).then(
					function (response) {
						if (response.data.access_token) {
							console.log('[LOGIN] AAC token refreshed');
							saveToken(response.data);
							service.localStorage.saveTokenInfo();
							refreshTokenDeferred.resolve(response.data.access_token);
						} else {
							resetUser();
							console.log('[LOGIN] invalid refresh_token');
							refreshTokenDeferred.reject(null);
						}
					},
					function (reason) {
						resetUser();
						refreshTokenDeferred.reject(reason);
					}
				);
			}
		} else {
			resetUser();
			refreshTokenDeferred.reject(null);
		}

		return refreshTokenDeferred.promise;
	};

	/*
	 * LOGOUT
	 */
	service.logout = function () {
		var deferred = $q.defer();

		if (settings.loginType == service.LOGIN_TYPE.AAC || settings.loginType == service.LOGIN_TYPE.COOKIE) {
			switch (user.provider) {
				case PROVIDER_NATIVE.GOOGLE:
					$window.plugins.googleplus.logout(
						function (msg) {
							resetUser();
							console.log('[LOGIN] ' + PROVIDER_NATIVE.GOOGLE + ' logout successfully (' + msg + ')');
							if (settings.loginType == service.LOGIN_TYPE.COOKIE) {
								$window.cookies.clear(function () {
									console.log('[LOGIN] Cookies cleared!');
								});
							}
							deferred.resolve(msg);
						},
						function (error) {
							deferred.reject();
						}
					);
					break;
				case PROVIDER_NATIVE.FACEBOOK:
					facebookConnectPlugin.logout(
						function () {
							resetUser();
							console.log('[LOGIN] ' + PROVIDER_NATIVE.FACEBOOK + ' logout successfully');
							if (settings.loginType == service.LOGIN_TYPE.COOKIE) {
								$window.cookies.clear(function () {
									console.log('[LOGIN] Cookies cleared!');
								});
							}
							deferred.resolve();
						},
						function (error) {
							deferred.reject();
						}
					);
					break;
				case service.PROVIDER.INTERNAL:
					$http.get(settings.aacUrl + AAC.REVOKE_URI + user.tokenInfo.access_token, {
						headers: {
							'Authorization': 'Bearer ' + user.tokenInfo.access_token
						}
					}).then(
						function (response) {
							resetUser();
							console.log('[LOGIN] ' + service.PROVIDER.INTERNAL + ' logout successfully (token revoked)');
							if (settings.loginType == service.LOGIN_TYPE.COOKIE) {
								$window.cookies.clear(function () {
									console.log('[LOGIN] Cookies cleared!');
								});
							}
							deferred.resolve(response.data);
						},
						function (reason) {
							deferred.reject(reason);
						}
					);
					break;
				default:
			}
		} else if (settings.loginType == service.LOGIN_TYPE.CUSTOM) {
			/*
			var complete = function (response) {
				StorageSrv.reset().then(function () {
					try {
						cookieMaster.clear(
							function () {
								console.log('[LOGIN] ' + 'Cookies have been cleared');
								deferred.resolve(response.data);
							},
							function () {
								console.log('[LOGIN] ' + 'Cookies could not be cleared');
								deferred.resolve(response.data);
							});
					} catch (e) {
						deferred.resolve(e);
					}
				});
			};

			CacheSrv.reset();

			$http.get(settings.appLoginUrl + AAC.LOGOUT_URL, {
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				}
			}).then(
				function (response) {
					complete(response);
				},
				function (reason) {
					deferred.reject(reason.data ? reason.data.errorMessage : reason);
				}
			);
			*/
		}

		return deferred.promise;
	};

	/*
	 * registration
	 */
	service.register = function (user) {
		// the validation of user has to be done by the developer or server side.
		var deferred = $q.defer();

		var url;
		if (settings.loginType == service.LOGIN_TYPE.AAC) {
			url = settings.aacUrl + AAC.REGISTER_URI;
		} else if (settings.loginType == service.LOGIN_TYPE.COOKIE) {
			url = settings.customConfig.REGISTER_URL;
		} else {
		  deferred.reject('UNKNOWN LOGIN TYPE');	
          return;
		}

		var httpOptions = {
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			}
		};

		if (settings.loginType == service.LOGIN_TYPE.AAC) {
			httpOptions.params = {
				'client_id': settings.clientId,
				'client_secret': settings.clientSecret
			};
		}

		$http.post(url, user, httpOptions).then(
			function (response) {
				deferred.resolve(response);
			},
			function (reason) {
				deferred.reject(reason);
			}
		);

		return deferred.promise;
	};

	var getLang = function () {
		var browserLanguage = '';
		// works for earlier version of Android (2.3.x)
		var androidLang;
		if ($window.navigator && $window.navigator.userAgent && (androidLang = $window.navigator.userAgent.match(/android.*\W(\w\w)-(\w\w)\W/i))) {
			browserLanguage = androidLang[1];
		} else {
			// works for iOS, Android 4.x and other devices
			browserLanguage = $window.navigator.userLanguage || $window.navigator.language;
		}

		var lang = browserLanguage.substring(0, 2);
		if (lang != 'it' && lang != 'en' && lang != 'de') {
			lang = 'en'
		};

		return lang;
	};

	/*
	 * reset password
	 */
	service.resetPassword = function (email) {
		// if email is provided call the endpoint
		var url;

		if (settings.loginType == service.LOGIN_TYPE.AAC) {
			url = settings.aacUrl + AAC.RESET_URI;
		} else if (settings.loginType == service.LOGIN_TYPE.COOKIE) {
			url = settings.customConfig.RESET_URL;
		} else {
			return;
		}

		if (!email || !isEmailValid(email)) {
			$window.open(url + '?lang=' + getLang(), '_system', 'location=no,toolbar=no');
		} else {
			var deferred = $q.defer();

			$http.post(url, {}, {
				params: {
					'email': email
				}
			}).then(
				function (response) {
					deferred.resolve();
				},
				function (reason) {
					deferred.reject(reason);
				}
			);

			return deferred.promise;
		}
	};

	service.getUserProfile = function () {
		if (!!user.profile && !!user.profile.userId) {
			return user.profile;
		}
		return null;
	};

	return service;
});
