"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const challengeFunctions = require("./endpoints/challenge.functions");
const customerFunctions = require("./endpoints/customer.functions");
const imageFunctions = require("./endpoints/image.functions");
const transactionFunctions = require("./endpoints/transaction.functions");
const server_1 = require("./express/server");
module.exports = Object.assign({}, challengeFunctions, customerFunctions, imageFunctions, transactionFunctions, { api: functions.https.onRequest(server_1.default) });
//# sourceMappingURL=index.js.map