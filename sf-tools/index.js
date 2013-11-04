var crypto = require('crypto');


exports.saveCanvasDetailsInSession = function(req, canvasRequest){
	if(!req.session.canvas) req.session.canvas = {};
	req.session.canvas = canvasRequest;
}

exports.getCanvasDetails = function(req){
	if(!req.session.canvas) req.session.canvas = {};
	return req.session.canvas;
}

/* 
	Salesforce canvas callback.
	If the request is well formed, the callback function is called:
	@callback(error, canvasRequestJSON);
 */
exports.canvasCallback = function(body, secret, callback){
	if(!callback) throw 'No callback set';
	if(!body || !body.signed_request || !secret) return callback('No body in request or secret');
	try{
		var canvasRequest = verifyAndDecode(body.signed_request,secret);
		return callback(null,canvasRequest);
	}
	catch(e){
		return callback(e+'');
	}
};


/*
	Verifies and decodes the POST request made by the canvas app.
	Throws exceptions if any error occurs
*/
function verifyAndDecode(input, secret){
    if (!input || input.indexOf('.') <= 0) {
	    throw 'Input doesn\'t look like a signed request';
	}
	var split = input.split('.', 2);
    var encodedSig = split[0];
    var encodedEnvelope = split[1];

    // Deserialize the json body
    var json_envelope = new Buffer(encodedEnvelope,'base64').toString('utf8');
    var algorithm;
    var canvasRequest;
    try {
        canvasRequest = JSON.parse(json_envelope);
        algorithm = canvasRequest.algorithm ? "HMACSHA256" : canvasRequest.algorithm;
    } catch (e) {
        throw 'Error deserializing JSON: '+ e;
    }

    // check algorithm - not relevant to error
    if (!algorithm || algorithm.toUpperCase() !== 'HMACSHA256') {
        throw 'Unknown algorithm '+algorithm+'. Expected HMACSHA256';
    }

	expectedSig = crypto.createHmac('sha256', secret).update(split[1]).digest('base64');
    if (encodedSig !== expectedSig) {
       throw 'Bad signed JSON Signature!';
    }
   	

	return canvasRequest;

}