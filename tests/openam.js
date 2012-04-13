var baseSite = 'http://sebasp.alesium.net/openam/';
var username = 'demo';
var goodPassword = 'demodemo';

var OpenAm = require('../lib/openam.js').OpenAm,
    assert = require('assert');


var openAm = new OpenAm(baseSite);


var token = openAm.authenticate(username,goodPassword, function(error, token, res) {
  assert.equal(error,null);
});
