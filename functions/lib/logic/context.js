"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();
const storage = admin.storage();
exports.default = {
    admin,
    db,
    storage
};
//# sourceMappingURL=context.js.map