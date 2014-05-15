'use strict';

angular.module('F1FeederApp', [
  'F1FeederApp.controllers',
  'F1FeederApp.services',
  'ngRoute'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.
    when("/drivers", {templateUrl: "partials/drivers.html", controller: "driversController"}).
    when("/driver/:id", {templateUrl: "partials/driver.html", controller: "driverController"}).
    otherwise({redirectTo: "/drivers"});
}]);

