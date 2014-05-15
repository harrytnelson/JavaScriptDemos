'use strict';

/* Controllers */
angular.module('F1FeederApp.controllers', []).
controller('driversController', function($scope,ergastAPIservice) {
    $scope.nameFilter = null;
    $scope.driversList = [];
    ergastAPIservice.getDrivers().success(function (response){
      $scope.driversList = response.MRData.StandingsTable.StandingsLists[0].DriverStandings;
    });
    $scope.searchFilter = function (driver) {
      var keyword = new RegExp($scope.nameFilter, 'i');
      return !$scope.nameFilter || keyword.test(driver.Driver.givenName) || keyword.test(driver.Driver.familyName);
    };
    //$scope.driversList = [
    //  {
    //      Driver: {
    //          givenName: 'Sebastian',
    //          familyName: 'Vettel'
    //      },
    //      points: 322,
    //      nationality: "German",
    //      Constructors: [
    //          {name: "Red Bull"}
    //      ]
    //  },
    //  {
    //      Driver: {
    //      givenName: 'Fernando',
    //          familyName: 'Alonso'
    //      },
    //      points: 207,
    //      nationality: "Spanish",
    //      Constructors: [
    //          {name: "Ferrari"}
    //      ]
    //  }
    //];
}).
  /* Driver controller */
  controller('driverController', function($scope, $routeParams, ergastAPIservice) {
    $scope.id = $routeParams.id;
    $scope.races = [];
    $scope.driver = null;

    ergastAPIservice.getDriverDetails($scope.id).success(function (response) {
        $scope.driver = response.MRData.StandingsTable.StandingsLists[0].DriverStandings[0]; 
    });

    ergastAPIservice.getDriverRaces($scope.id).success(function (response) {
        $scope.races = response.MRData.RaceTable.Races; 
    }); 
  });

