"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const sgMail = require("@sendgrid/mail");
exports.sendEmail = functions.region('europe-west1').https.onRequest((req, res) => {
    const apiKey = functions.config().sendgrid.key;
    sgMail.setApiKey(apiKey);
    const msg = {
        to: 'toolenaar@gmail.com',
        from: 'test@example.com',
        subject: 'Sending with Twilio SendGrid is Fun',
        text: 'and easy to do anywhere, even with Node.js',
        html: '<strong>and easy to do anywhere, even with Node.js</strong>',
        attachments: [
            {
                content: 'Some base 64 encoded attachment content',
                filename: 'some-attachment.txt',
                type: 'application/pdf',
                disposition: 'attachment',
                contentId: 'mytext'
            },
        ],
    };
    sgMail.send(msg).then((response) => {
        res.status(200).send(response);
    }).catch((e) => {
        res.status(500).send(e);
    });
});
//# sourceMappingURL=email.functions.js.map