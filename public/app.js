'use strict';

var _stateNotLoggedIn=0;
var _stateLoginPending=1;
var _stateLoggedIn=2;
var _stateCheckingForVaultEnabled=3;
var _stateVaultEnabled=4;
var _stateGettingVault=5;
var _stateVaultNotInitialized=6;
var _stateGotVaultContents=7;
var _statePasswordRequired=8;
var _statePasswordIncorrect=9;
var _stateDisplayVault=10;
var _stateEditVault=11;
var _stateRefreshVault=12;
var _stateNotEligibleForVault=13;
var _stateCouldNotSave=14;
var _stateSavingInProgress=15;
var _stateNewPasswordReqd=16;

var _defaultMessageInVault=
    "#Welcome to your vault\n\n"+
    "Anything that you put in here is only available only with your password.\n\n"+
    "I dont know when this will be going away; so keep a backup somewhere else.\n\n";


// Declare app level module which depends on views, and components
var app = angular.module('vaultApp', [
  'ngRoute',
  'firebase',
  'ui.bootstrap',
  'ngSanitize'
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
   }).when('/vault',{
     templateUrl: 'vault.html',
     controller: 'VaultCtrl'
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
.factory('VaultService',['LoginService', '$firebaseObject',
  function(LoginService,$firebaseObject,$q){
   var myVS={};
   myVS.error=null;

   myVS.getIsEnabledForVault= function(){
     // only users who are added to the "granted" list can create a file on this instance.
     var vaultEnabledForMe= $firebaseObject(
       LoginService.firebaseRef().child('granted').child(LoginService.uid()));
     return vaultEnabledForMe.$loaded().then(function(){
          var _enabled=vaultEnabledForMe.$value;
          if (_enabled !== true){
            vaultEnabledForMe.$value=false; // granted=false => pending.
            vaultEnabledForMe.$save();
          }
        return _enabled;
      });
    }

   myVS.getVaultContents= function(){
       var myVault= $firebaseObject(
            LoginService.firebaseRef().child('vault').child(LoginService.uid()));
        return myVault.$loaded().then(function(){
                return myVault.$value;
              });

   }

   myVS.setVaultContents= function(data){
        var myVault= $firebaseObject(
            LoginService.firebaseRef().child('vault').child(LoginService.uid()));
         myVault.$value=data;
         return myVault.$save();
   }


   var _showDown = new showdown.Converter();
   _showDown.setOption('tables',true);
   myVS.makeHtml = function(mkdwn){
     return _showDown.makeHtml(mkdwn);
   }


   return myVS;

}])
.factory('StateMaintainer', function(){
  var _state=_stateNotLoggedIn;
  var myState={};
  myState.setState = function(s){
    _state=s;
  }
  myState.getState= function(){
    return _state;
  }

  var _vault= {};
  myState.setVault = function(v){
    _vault = v;
  }
  myState.getVault = function(){ return _vault;}

  return myState;
})
.controller('HomeCtrl',['$scope','LoginService',
  '$location', 'StateMaintainer','VaultService',
  function($scope,LoginService,$location,StateMaintainer,VaultService){

   // most of the UI changes are driven off this Controller.

   $scope.stateNotLoggedIn=_stateNotLoggedIn;
   $scope.stateLoginPending=_stateLoginPending;
   $scope.stateLoggedIn=_stateLoggedIn;
   $scope.stateCheckingForVaultEnabled=_stateCheckingForVaultEnabled;
   $scope.stateVaultEnabled=_stateVaultEnabled;
   $scope.stateNotEligibleForVault= _stateNotEligibleForVault;
   $scope.stateGettingVault=_stateGettingVault;
   $scope.stateVaultNotInitialized=_stateVaultNotInitialized;
   $scope.stateGotVaultContents=_stateGotVaultContents;
   $scope.statePasswordRequired=_statePasswordRequired;
   $scope.statePasswordIncorrect=_statePasswordIncorrect;
   $scope.stateDisplayVault=_stateDisplayVault;
   $scope.stateEditVault=_stateEditVault;
   $scope.stateRefreshVault=_stateRefreshVault;
   $scope.stateCouldNotSave=_stateCouldNotSave;
   $scope.stateSavingInProgress=_stateSavingInProgress;
   $scope.stateNewPasswordRequired=_stateNewPasswordReqd;


   $scope.state = StateMaintainer.getState();

  $scope.login={};
  $scope.login.loginError=LoginService.isLoginError();
  $scope.login.uid=LoginService.uid();
  $scope.login.email=LoginService.email();
  $scope.login.pname=LoginService.pname();

  $scope.signInUsingGoogle = function(){
    StateMaintainer.setState(_stateLoginPending);
    $scope.state= StateMaintainer.getState();
    LoginService.googleLogin().then(function(){
      StateMaintainer.setState(_stateLoggedIn);
      $scope.state= StateMaintainer.getState();
      $scope.login.isLoggedIn=LoginService.isLoggedIn();
      $scope.login.loginError=LoginService.isLoginError();
      $scope.login.uid=LoginService.uid();
      $scope.login.email=LoginService.email();
      $scope.login.pname=LoginService.pname();
      $scope.checkIfEnabledForVault();
    }).catch(function(error){
      StateMaintainer.setState(_stateNotLoggedIn);
      $scope.state= StateMaintainer.getState();
    })
  }

    $scope.signInUsingFacebook = function(){
      StateMaintainer.setState(_stateLoginPending);
      $scope.state= StateMaintainer.getState();
      LoginService.facebookLogin().then(function(){
        StateMaintainer.setState(_stateLoggedIn);
        $scope.state= StateMaintainer.getState();
        $scope.login.isLoggedIn=LoginService.isLoggedIn();
        $scope.login.loginError=LoginService.isLoginError();
        $scope.login.uid=LoginService.uid();
        $scope.login.email=LoginService.email();
        $scope.login.pname=LoginService.pname();
        $scope.checkIfEnabledForVault();
      }).catch(function(error){
        StateMaintainer.setState(_stateNotLoggedIn);
        $scope.state= StateMaintainer.getState();
    })
  }

  $scope.checkIfEnabledForVault = function(){
    StateMaintainer.setState(_stateCheckingForVaultEnabled);
    $scope.state= StateMaintainer.getState();
    VaultService.getIsEnabledForVault().then(function(s){
      if (s){
        StateMaintainer.setState(_stateVaultEnabled);
        $scope.state = StateMaintainer.getState();
        $scope.getVaultContents();
      }
      else {
        StateMaintainer.setState(_stateNotEligibleForVault);
        $scope.state = StateMaintainer.getState();
      }
    })
  }

  $scope.vault=StateMaintainer.getVault();
  $scope.getVaultContents = function(){
    StateMaintainer.setState(_stateGettingVault);
    $scope.state= StateMaintainer.getState();
    VaultService.getVaultContents().then(function(data){
      if (data == null){
        //StateMaintainer.setState(_stateVaultNotInitialized);
        StateMaintainer.setState(_stateNewPasswordReqd);
        $scope.state=StateMaintainer.getState();
      }
      else {
        $scope.vault.contents = data;
        StateMaintainer.setVault($scope.vault);
//        StateMaintainer.setState(_stateGotVaultContents);
//        $scope.state = StateMaintainer.getState();

        StateMaintainer.setState(_statePasswordRequired);
        $scope.state = StateMaintainer.getState();

      }
    })
  }

  $scope.decrypt= function() {
    try {
      if ($scope.vault.pass){
        $scope.vault.plaintext= sjcl.decrypt($scope.vault.pass,$scope.vault.contents);
        $scope.vault.mkdown = VaultService.makeHtml($scope.vault.plaintext);
        StateMaintainer.setVault($scope.vault);

        StateMaintainer.setState(_stateDisplayVault);
        $scope.state = StateMaintainer.getState();
      }
    }
    catch(e){
      $scope.vault.passwordError = true;
      StateMaintainer.setVault($scope.vault);
      StateMaintainer.setState(_statePasswordIncorrect);
      $scope.state = StateMaintainer.getState();
    }
  }

  $scope.startEditing = function(){
    $scope.vault.copyPlaintext=$scope.vault.plaintext;
    StateMaintainer.setVault($scope.vault);
    StateMaintainer.setState(_stateEditVault);
    $scope.state = StateMaintainer.getState();
  }

  $scope.storeText = function(){
    try {
      StateMaintainer.setState(_stateSavingInProgress);
      $scope.state=StateMaintainer.getState();
      if ($scope.vault.copyPlaintext){
        $scope.vault.plaintext= $scope.vault.copyPlaintext;
        $scope.vault.mkdown = VaultService.makeHtml($scope.vault.plaintext);
        $scope.vault.contents = sjcl.encrypt($scope.vault.pass,$scope.vault.plaintext,{"ks":256});

        StateMaintainer.setVault($scope.vault);
        VaultService.setVaultContents($scope.vault.contents).then(function(){
          StateMaintainer.setState(_stateDisplayVault);
          $scope.state = StateMaintainer.getState();
        }).catch(function(){
          console.log(e);
          StateMaintainer.setState(_stateCouldNotSave);
          $scope.state = StateMaintainer.getState();
        })
        $scope.getVaultContents();
      }

    }
    catch(e){
      console.log(e);
      StateMaintainer.setState(_stateCouldNotSave);
      $scope.state = StateMaintainer.getState();
    }

  }

  $scope.stopEditing = function(){
    StateMaintainer.setState(_stateDisplayVault);
    $scope.state = StateMaintainer.getState();
  }

  $scope.newPassword = function(defaultMsg){
    // this comes up when we dont have a vault yet.
    $scope.vault.passwordError=false;

    if ($scope.vault.newPass && $scope.vault.newPass === $scope.vault.newPassRepeated){
      $scope.vault.pass = $scope.vault.newPass;
      $scope.vault.newPass= null;
      $scope.vault.newPassRepeated = null;
      $scope.vault.plaintext= _defaultMessageInVault;
      $scope.vault.mkdown = VaultService.makeHtml($scope.vault.plaintext);
      $scope.vault.contents = sjcl.encrypt($scope.vault.pass,$scope.vault.plaintext);
      StateMaintainer.setState(_stateDisplayVault);
      $scope.state = StateMaintainer.getState();
      StateMaintainer.setVault($scope.vault);

    }
    else {
      $scope.vault.passwordError = true;
      StateMaintainer.setVault($scope.vault);
    }
  }


}])
.controller('AboutCtrl',['$scope',function($scope){}])
.controller('ContactCtrl',['$scope',function($scope){}])
