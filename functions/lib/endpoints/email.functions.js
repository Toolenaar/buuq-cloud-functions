"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const sgMail = require("@sendgrid/mail");
exports.sendEmail = functions.region('europe-west1').https.onRequest((req, res) => {
    const apiKey = functions.config().sendgrid.key;
    console.log(apiKey);
    sgMail.setApiKey(apiKey);
    const msg = {
        to: 'toolenaar@gmail.com',
        from: 'test@example.com',
        subject: 'Sending with Twilio SendGrid is Fun',
        text: 'and easy to do anywhere, even with Node.js',
        html: '<strong>and easy to do anywhere, even with Node.js</strong>',
    };
    sgMail.send(msg).then((response) => {
        res.status(200).send(response);
    }).catch((e) => {
        res.status(500).send(e);
    });
});
//# sourceMappingURL=email.functions.js.map