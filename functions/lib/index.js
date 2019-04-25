"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const challengeFunctions = require("./endpoints/challenge.functions");
const customerFunctions = require("./endpoints/customer.functions");
const imageFunctions = require("./endpoints/image.functions");
const transactionFunctions = require("./endpoints/transaction.functions");
const pdfFunctions = require("./endpoints/pdf.functions");
//import app from './express/server';
module.exports = Object.assign({}, challengeFunctions, customerFunctions, imageFunctions, transactionFunctions, pdfFunctions);
//# sourceMappingURL=index.js.map