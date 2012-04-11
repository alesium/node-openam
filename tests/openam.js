var vows = require('vows'),
    assert = require('assert'),
    OpenAm= require('../lib/openam').OpenAm;

var baseSite = 'http://sebasp.alesium.net/openam/';
var username = 'demo';
var goodPassword = 'demodemo';
var badPassword = 'demode';

vows.describe('OpenAm').addBatch({
  'openam':{
    topic: new OpenAm(baseSite),
      'should return login UI url' : function (openam){
          assert.equal(openam.getLoginUiUrl(), baseSite + 'UI/Login?');
      },
      'should return logout UI url' : function (openam){
       assert.equal(openam.getLogoutUiUrl(), baseSite +'UI/Logout?');
     },
  },
   'authenticate' : {
      topic: new OpenAm(baseSite),
       'Good password' : function (topic){
         topic.authenticate(username,goodPassword,function( error, token){
           assert.equal(error,null);
           topic.isTokenValid(token, function( isValid ){
             assert.equal(isValid,true);
           });
         })
       },
   },

}).export(module);
