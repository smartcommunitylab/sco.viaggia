angular.module('viaggia.services.markets', [])

.factory('marketService', function ($q, Config) {
    var marketService = {};
    var mercatino = {
        name: "Mercatini - Via Roma",
        lat: 45.889568,
        long: 11.043297
    };
    var park = {
        name: "Stadio Quercia",
        lat: 45.90031,
        long: 11.03626
    };
    var favorites = [];

    var mercatinoFavorites = function () {
        return favorites;
    }
    marketService.getMercatinoPoint = function () {
        return mercatino;
    }
    marketService.getParkPoint = function () {
        return park;
    }
    marketService.initMarketFavorites = function () {
        var alreadywritten = localStorage.getItem(Config.getAppId() + "_alreadywritten");
        if (favorites && !!!alreadywritten) {
            localStorage.setItem(Config.getAppId() + "_favoritePlaces", JSON.stringify(favorites));
            localStorage.setItem(Config.getAppId() + "_alreadywritten", "true");
        };
    }

    return marketService;
})
