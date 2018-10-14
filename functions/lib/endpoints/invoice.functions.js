"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
exports.pdf = functions.https.onRequest((req, res) => {
    if (req.method !== 'POST' || req.get('content-type') !== 'application/json') {
        res.status(400).send({ error: 'Bad Request' });
    }
    else {
        const id = req.body.id;
        if (id === undefined || id === null || id === '') {
            res.status(404).send({ error: 'Document not found' });
        }
        res.status(200).send(id);
    }
});
//# sourceMappingURL=invoice.functions.js.map