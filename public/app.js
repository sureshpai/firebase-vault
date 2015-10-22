'use strict';

// Declare app level module which depends on views, and components
var app = angular.module('vaultApp', [
  'ngRoute',
  'ui.bootstrap'
  ]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/home', {
     templateUrl: 'home.html',
     controller: 'HomeCtrl'
   }). when('/about', {
     templateUrl: 'about.html',
     controlller: 'AboutCtrl'
   }).when('/contact', {
     templateUrl: 'contact.html',
     controller: 'ContactCtrl'
   })
   .otherwise({
	    redirectTo: '/home'
    });
}])
.controller('HomeCtrl',['$scope',function($scope){}])
.controller('AboutCtrl',['$scope',function($scope){}])
.controller('ContactCtrl',['$scope',function($scope){}]);
