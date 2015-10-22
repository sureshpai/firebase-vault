'use strict';

// Declare app level module which depends on views, and components
var app = angular.module('vaultApp', [
  'ngRoute',
  'firebase',
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
  .factory('LoginService',['$firebaseAuth', '$firebaseObject',
     function($firebaseAuth,$firebaseObject){
    var _isLoggedIn=false;
    var _loginError=false;
    var _uid=null;
    var _name=null;
    var _email=null;
    var _ref= new Firebase(MyConfig.firebaseUrl);
    var loginS={};

    loginS.firebaseRef= function() { return _ref;};
    loginS.googleLogin= function(){
      var auth= $firebaseAuth(_ref);
      return auth.$authWithOAuthPopup("google",{scope:'email'}).then(function(authData) {
       _isLoggedIn=true;
       _loginError=false;
       _uid=authData.uid;
       _name=authData.google.displayName;
       _email=authData.google.email;

      })
      .then(function(){
               // create a record in firebase.
               var _userObj= $firebaseObject(_ref.child('user').child(_uid));
               _userObj.$value={'user':_name,
                           'email':_email,
                           'uid': _uid,
                           'lastLoggedIn': JSON.stringify(new Date())};
               return _userObj.$save();
      })
      .catch(function(error) {
        _isLoggedIn=false;
        _loginError=true;
        _uid=null; _name=null; _email=null;
        console.log("Authentication failed:", error);
      });
    }

    loginS.facebookLogin= function(){
      var auth= $firebaseAuth(_ref);
      return auth.$authWithOAuthPopup("facebook",{scope:'email'}).then(function(authData) {
       _isLoggedIn=true;
       _loginError=false;
       _uid=authData.uid;
       _name=authData.facebook.displayName;
       _email=authData.facebook.email;
      })
      .then(function(){
               // create a record in firebase.
               var _userObj= $firebaseObject(_ref.child('user').child(_uid));
               _userObj.$value={'user':_name,
                           'email':_email,
                           'uid': _uid,
                           'lastLoggedIn': JSON.stringify(new Date())};
               return _userObj.$save();
      })
      .catch(function(error) {
        _isLoggedIn=false;
        _loginError=true;
        _uid=null; _name=null; _email=null;
        console.log("Authentication failed:", error);
      });
    }


    loginS.isLoggedIn = function(){ return _isLoggedIn;}
    loginS.isLoginError= function(){ return _loginError;}
    loginS.uid = function(){return _uid;}
    loginS.pname= function(){return _name;}
    loginS.email= function(){ return _email;}

    return loginS;
}])
.factory('VaultService',['LoginService', function(LoginService){
   var _isEnabledForVault=false;
   var myVS={};

   myVS.isEnabledForVault= function(){
     // only users who are added to the "allow" list can create a file on this instance.
     if (!LoginService.isLoggedIn()) return false;


   }
}])
.controller('HomeCtrl',['$scope','LoginService',function($scope,LoginService){

  $scope.login={};
  $scope.login.isLoggedIn=LoginService.isLoggedIn();
  $scope.login.loginError=LoginService.isLoginError();
  $scope.login.uid=LoginService.uid();
  $scope.login.email=LoginService.email();
  $scope.login.pname=LoginService.pname();

  $scope.signInUsingGoogle = function(){
    LoginService.googleLogin().then(function(){
      $scope.login.isLoggedIn=LoginService.isLoggedIn();
      $scope.login.loginError=LoginService.isLoginError();
      $scope.login.uid=LoginService.uid();
      $scope.login.email=LoginService.email();
      $scope.login.pname=LoginService.pname();
      console.log(LoginService.pname());
    });
  }

  $scope.signInUsingFacebook = function(){
    LoginService.facebookLogin().then(function(){
      $scope.login.isLoggedIn=LoginService.isLoggedIn();
      $scope.login.loginError=LoginService.isLoginError();
      $scope.login.uid=LoginService.uid();
      $scope.login.email=LoginService.email();
      $scope.login.pname=LoginService.pname();
      console.log(LoginService.pname());
    });
  }
}])
.controller('AboutCtrl',['$scope',function($scope){}])
.controller('ContactCtrl',['$scope',function($scope){}]);
