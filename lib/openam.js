/*
* CDDL HEADER START
*
* The contents of this file are subject to the terms of the
* Common Development and Distribution License, Version 1.0 only
* (the "License"). You may not use this file except in compliance
* with the License.
*
* You can obtain a copy of the license at LICENSE
* See the License for the specific language governing permissions
* and limitations under the License.
*
* When distributing Covered Code, include this CDDL HEADER in each
* file and include the License file at LICENSE.
* If applicable, add the following below this CDDL HEADER, with the
* fields enclosed by brackets "[]" replaced with your own identifying
* information: Portions Copyright [yyyy] [name of copyright owner]
*
* CDDL HEADER END
*
* 
* Copyright (c) 2012, Les Technologies Alesium Inc. All rights reserved.
*
*/

var querystring= require('querystring')
    ,URL= require('url');


exports.OpenAm = function(baseSite, realm, cookieName) {
	this._baseSite = baseSite;
	this._realm = realm = (realm === undefined) ? "/" : realm;
  this._cookieName = (cookieName === undefined) ? "AMAuthCookie" : cookieName;
	this._authenticateUrl = 'identity/authenticate';
	this._logoutUrl = 'identity/logout';
	this._tokenValidateUrl = 'identity/isTokenValid';
	this._authorizeUrl = 'identity/authorize';
	this._logUrl =  'identity/log';
	this._attributesUrl = 'identity/attributes';
  this._loginUiUrl = 'UI/Login';
  this._logoutUiUrl = 'UI/Logout';

}

exports.OpenAm.prototype._request= function(url, callback) {

  var parsedUrl = URL.parse( url, true ); 
  if( parsedUrl.protocol == "https:" && !parsedUrl.port ) parsedUrl.port= 443;
  if( parsedUrl.protocol == "http:" && !parsedUrl.port ) parsedUrl.port= 80;

  var queryStr= querystring.stringify(parsedUrl.query);
  if( queryStr ) queryStr=  "?" + queryStr;
  var options = {
    host: parsedUrl.hostname,
    port: parsedUrl.port,
    path: parsedUrl.pathname + queryStr,
  };

  var callbackCalled= false;

  function passBackControl( response, result ) {
    if(!callbackCalled) {
      callbackCalled=true;
      if( response.statusCode != 200 && (response.statusCode != 301) && (response.statusCode != 302) ) {
        callback({ statusCode: response.statusCode, data: result });
      } else {
        callback(null, result, response);
      } 
    }
  }
  function chomp(raw_text)
  {
      return raw_text.replace(/(\n|\r)+$/, '');
  }
  var http = {};
  if (parsedUrl.protocol.replace(/(\s+)?.$/, "") == "http") {
     http = require('http');
  }
   else if (parsedUrl.protocol.replace(/(\s+)?.$/, "") == "https") {
     http = require('https');
   }
   var result = "";
   http.get(options, function(res) {
     res.on('data', function (chunk) {
       result+= chunk;
     });
     res.addListener('end', function() {
       console.log(result);
       passBackControl( res, chomp(result) );
     }); 
   }).on('error', function(e){
     callbackCalled= true;
     callback(e);
   });
}

exports.OpenAm.prototype.authenticate= function (username, password, callback){
  this._request(this._getAuthenticateUrl( username, password), function(error, data){
               if ( error ) callback(error);
               else{
                var results = {};
                try {
                  results = querystring.parse( data);
                }
                catch (e) {
                 /*
                  * TODO need to impement in case of attributes query;
                  */
                  console.log(e);
                }
               callback(null, results['token.id']);
               }
  });
}

exports.OpenAm.prototype.logout= function (token, callback){
  this._request(this._getLogoutUrl(token), function( error, data){
    if ( error ) callback(error,false);
    if ( data ) callback(null, data);
    else callback(null,true);
  });
}

exports.OpenAm.prototype.isTokenValid= function(token, callback) {
  this._request(this._getTokenValidUrl(token), function(error, data) {
    if ( error ) callback(error, false);
    var results = {};
    if ( data ) {
      results = querystring.parse( data);
      if (results['boolean'] == 'true') {
        callback(null, true);
      } else {
        callback(null, false);
      }
    } else {
      callback(null, false);
    }
  });
  
}

exports.OpenAm.prototype.authorize= function(token, uri, callback) {
  this._request(this._getAuthorizeUrl(token, uri), function(error, data){
    if ( error ) callback(error, false);
    var results = {};
    if ( data ) {
      results = querystring.parse( data);
      if (results['boolean'] == 'true') {
        callback(null, true);
      } else {
        callback(null, false);
      }
    } else {
        callback(null, false);
    }
  });
  
}

exports.OpenAm.prototype.getAttributes= function(token, uri, callback) {
  this._request(this._getAttributesUrl(token), function(error, data){
    if ( error ) callback(error, false);
    callback(null,data);
  });
}


/*
 * TODO Implement Log
 */
exports.OpenAm.prototype.log= function(token, uri, callback) {
  
}

exports.OpenAm.prototype._getAuthenticateUrl= function( username, password ) {
    var params={};
    params['username'] = username;
    params['password'] = password;
    if (this._realm != "/")
      params['uri'] = "realm=" + this._realm;
    return this._generateUrl(this._authenticateUrl, params);
}

exports.OpenAm.prototype._getLogoutUrl= function( token ) {
    var params = {};
    params['subjectid'] = token
    return this._generateUrl(this._logoutUrl, params);
}

exports.OpenAm.prototype._getTokenValidUrl = function( token ) {
    var params = {};
    params['tokenid'] = token;
    return this._generateUrl(this._tokenValidateUrl, params);
}

exports.OpenAm.prototype._getAttributesUrl = function( token ) {
      var params = {};
      params['subjectid'] = token;
      return this._generateUrl(this._attributesUrl, params);
}

exports.OpenAm.prototype._getAuthorizeUrl = function( token, uri ) {
    var params = {} ;
    params=['uri'] = uri;
    params=['action'] = 'GET'; 
    params=['subjectid'] = token;
    return this._generateUrl(this._authorizeUrl, params);
}

exports.OpenAm.prototype._getLogUrl = function ( token, adminToken, logname, message ){
    var params = {};
    params=['appid'] = adminToken;
    params=['subjectid'] = token;
    params=['logname'] = logname;
    params=['message'] = message;
    return this._generateUrl( this._logUrl, params); 
}

exports.OpenAm.prototype._generateUrl = function( app, params ) {
  return this._baseSite + app + "?" + querystring.stringify(params);
}

exports.OpenAm.prototype.getLoginUiUrl= function ( params ) {
     var params= params || {};
     if (this._realm != "/")
             params['realm'] = this._realm;
     return this._baseSite + this._loginUiUrl + "?" + querystring.stringify(params);
}

exports.OpenAm.prototype.getLogoutUiUrl= function ( params ) {
     var params= params || {};
     return this._baseSite + this._logoutUiUrl + "?" + querystring.stringify(params);
}
