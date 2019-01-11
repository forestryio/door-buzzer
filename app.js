var ApiBuilder = require('claudia-api-builder'),
    api = new ApiBuilder()

module.exports = api

api.post('/call', function (req) {
    const { parse } = require('querystring')
    const VoiceResponse = require('twilio').twiml.VoiceResponse
    const body = parse(req.body)
    console.log(body)
    const callSid = body.CallSid

    const twiml = new VoiceResponse();
    twiml.say('One moment please.', {voice: 'alice'})

    console.log(twiml.toString())

    return twiml.toString()
}, {
    success: { contentType: 'text/xml' }
})