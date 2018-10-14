"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// https://medium.com/@ebidel/puppeteering-in-firebase-google-cloud-functions-76145c7662bd
const express = require("express");
const puppeteer = require('puppeteer');
//import  * as  puppeteer  from 'puppeteer';
const handlebars = require("handlebars");
const fs = require("fs-extra");
const path = require("path");
const context_1 = require("../logic/context");
const app = express();
const compile = (templateName, data) => __awaiter(this, void 0, void 0, function* () {
    const filePath = path.join(process.cwd(), 'src/express/templates', `${templateName}.hbs`);
    const html = yield fs.readFile(filePath, 'utf-8');
    return handlebars.compile(html)(data);
});
const fetchdata = (id) => __awaiter(this, void 0, void 0, function* () {
    // fetch the invoice
    const invoiceSnap = yield context_1.default.db.collection('transactions').doc(id).get();
    const invoice = invoiceSnap.data();
    if (invoice === null || invoice === undefined) {
        return null;
    }
    // fetch the user data
    const userSnap = yield context_1.default.db.collection('users').where('uid', '==', invoice.uid).get();
    const user = userSnap.docs[0].data();
    if (user === null || user === undefined) {
        return null;
    }
    // fetch the customer data
    const customerSnap = yield context_1.default.db.collection('customers').doc(invoice.customer.id).get();
    const customer = customerSnap.data();
    if (customer === null || customer === undefined) {
        return null;
    }
    return { invoice, user, customer };
});
const formatDate = (d) => {
    return ("0" + d.getDate()).slice(-2) + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" +
        d.getFullYear() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
};
const createFinancials = (invoice) => {
    const totalAmount = invoice.amount + ((invoice.amount / 100) * invoice.btwTarif);
    const total = '€' + Number(totalAmount).toLocaleString("nl-NL", { minimumFractionDigits: 2 });
    const amount = '€' + Number(invoice.amount).toLocaleString("nl-NL", { minimumFractionDigits: 2 });
    return { total, amount, date: formatDate(invoice.date) };
};
const createPdf = (data, res) => __awaiter(this, void 0, void 0, function* () {
    const browser = res.locals.browser;
    const page = yield browser.newPage();
    const content = yield compile('invoice', data);
    yield page.setContent(content);
    yield page.emulateMedia('screen');
    return yield page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true
    });
});
// Runs before every route. Launches headless Chrome.
app.all('/pdf/:id', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    // Note: --no-sandbox is required in this env.
    // Could also launch chrome and reuse the instance
    // using puppeteer.connect()
    res.locals.browser = yield puppeteer.launch({
        args: ['--no-sandbox']
    });
    next(); // pass control to next route.
}));
app.get('/pdf/:id', (req, res) => __awaiter(this, void 0, void 0, function* () {
    const { id } = req.params;
    if (id === undefined || id === '') {
        res.status(404).send({ error: 'id not valid' });
    }
    else {
        try {
            const data = yield fetchdata(id);
            if (data === null || data.invoice === undefined || data.invoice.type !== 'invoice') {
                res.status(404).send({ error: 'transaction not found' });
            }
            else {
                data.financials = createFinancials(data.invoice);
                console.log(data);
                const filename = id + ".pdf";
                res.set('Content-disposition', 'attachment; filename=' + filename);
                res.type('application/pdf');
                res.send(yield createPdf(data, res));
            }
        }
        catch (e) {
            console.log(e);
            res.status(500).send({ error: e });
        }
    }
}));
exports.default = app;
//# sourceMappingURL=server.js.map