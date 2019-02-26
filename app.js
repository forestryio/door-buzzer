var ApiBuilder = require('claudia-api-builder'),
    api = new ApiBuilder()

module.exports = api

api.post('/call', (req) => {
    const { parse } = require('querystring')
    const VoiceResponse = require('twilio').twiml.VoiceResponse
    const SlackBot = require('slackbots')
    const bot = new SlackBot({
        token: process.env.SLACK_BOT_TOKEN,
        name: 'OfficeBot'
    })
    const twiml = new VoiceResponse()

    const body = parse(req.body)
    const callSid = body.CallSid

    let data = {
        attachments: [{
            fallback: 'Someone is at the door',
            title: 'Someone is at the door',
            // title_link: recordingUrl,
            // text: 'Click link to hear the recording',
            callback_id: `door_open:${callSid}`,
            actions: [
                {
                    name: 'open_door',
                    text: 'Let them in',
                    type: 'button',
                    value: 'open_door'
                },
                {
                    name: 'deny_access',
                    text: 'No.',
                    type: 'button',
                    value: 'deny_access'
                }
            ]
        }]
    }

    return new Promise((resolve, reject) => {
        bot.on('start', () => {
            bot.postMessageToChannel('talk-charlottetown', '<!channel> Someone is at the door', data, () => {
                twiml.say('One moment please.', {voice: 'alice'})
                twiml.pause({length: 240})
                twiml.say('Sorry, no one is in the office right now.', {voice: 'alice'})
                resolve(twiml.toString())
            })
        })
    })
}, {
    success: { contentType: 'text/xml' }
})

api.post('/call/response', (req) => {
    const { parse } = require('querystring')
    const payload = JSON.parse(parse(req.body).payload)
    const callSid = payload.callback_id.split(':')[1]
    const action = payload.actions[0]
    const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILLIO_AUTH_TOKEN)
    let continueAt = ''
    let response = ''

    if (action.value === 'open_door') {
        continueAt = 'call/accept'
        response = 'Letting them in'
    } else {
        continueAt = 'call/reject';
        response = 'Telling them to go away'
    }
    return client.calls(callSid).update({
        url: `https://kpib3ihpwe.execute-api.us-east-1.amazonaws.com/latest/${continueAt}`,
        method: 'POST'
    }).then(() => response)
}, {
    success: { contentType: 'text/plain' }
})

api.post('/call/accept', (req) => {
    const VoiceResponse = require('twilio').twiml.VoiceResponse
    const twiml = new VoiceResponse()
    twiml.play({digits: 9})
    return twiml.toString()
}, {
    success: { contentType: 'text/xml' }
})

api.post('/call/reject', (req) => {
    const VoiceResponse = require('twilio').twiml.VoiceResponse
    const twiml = new VoiceResponse()
    twiml.say('Sorry, no one is in the office right now.', {voice: 'alice'})
    return twiml.toString()
}, {
    success: { contentType: 'text/xml' }
})