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
const functions = require("firebase-functions");
//const chromium = require('chrome-aws-lambda');
const puppeteer = require("puppeteer");
const handlebars = require("handlebars");
const fs = require("fs-extra");
const path = require("path");
const context_1 = require("../logic/context");
const utils_1 = require("../logic/utils");
//const admin = require('firebase-admin');
//https://github.com/GoogleChrome/puppeteer/issues/3120
//https://handlebarsjs.com/
handlebars.registerHelper('list', function (items, options) {
    let out = '<ul template-id="items-container" class="list">';
    for (let i = 0, l = items.length; i < l; i++) {
        out = out + '<li template-id="invoice-item" class="list__item row">' + options.fn(items[i]) + "</li>";
    }
    return out + "</ul>";
});
const compile = (templateName, data) => __awaiter(this, void 0, void 0, function* () {
    const filePath = path.join(process.cwd(), 'src/templates', `${templateName}.hbs`);
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
    const userSnap = yield context_1.default.db.collection('users').doc(invoice.uid).get();
    const user = userSnap.data();
    if (user === null || user === undefined) {
        return null;
    }
    // fetch the customer data
    const customerSnap = yield context_1.default.db.collection('users').doc(invoice.uid).collection('customers').doc(invoice.customer.id).get();
    const customer = customerSnap.data();
    if (customer === null || customer === undefined) {
        return null;
    }
    return { invoice, user, customer };
});
const formatDate = (timestamp) => {
    const d = timestamp.toDate();
    return ("0" + d.getDate()).slice(-2) + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" +
        d.getFullYear() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
};
const createFinancials = (invoice) => {
    let lines = [];
    let totalAmount = 0;
    let totalBtw = [];
    //for each line show/calculate
    //amount
    // btw tarif
    // total btw (per tarif)
    // total amount of all
    for (let line of invoice.lines) {
        const btw = ((line.amount / 100) * line.btwTarif);
        line.btw = btw;
        line.totalAmount = line.amount + btw;
        //for each btw tarif save total amount
        const key = line.btwTarif.toString();
        let totalBtwItem = totalBtw.find((f) => f.key === key);
        if (totalBtwItem === undefined || totalBtwItem === null) {
            totalBtw.push({ 'key': key, 'tarif': line.btwTarif, 'amount': line.amount, 'btw': btw });
        }
        else {
            totalBtwItem.btw += btw;
            totalBtwItem.amount += line.amount;
        }
        totalAmount += line.totalAmount;
        lines.push({
            'shortDescription': line.shortDescription,
            'btwTarif': line.btwTarif + '%',
            'amount': utils_1.default.formatFinancialAmount(line.amount)
        });
    }
    for (let item of totalBtw) {
        item.btwDisplay = utils_1.default.formatFinancialAmount(item.btw);
        item.display = `${item.tarif}% over ${utils_1.default.formatFinancialAmount(item.amount)}`;
    }
    // const totalAmount = invoice.amount + ((invoice.amount / 100) * invoice.btwTarif);
    const total = utils_1.default.formatFinancialAmount(totalAmount);
    //const amount = '€' + Number(invoice.amount).toLocaleString("nl-NL", { minimumFractionDigits: 2 })
    return { total, date: formatDate(invoice.date), btw: totalBtw, lines };
};
const createPdf = (data, browser) => __awaiter(this, void 0, void 0, function* () {
    const page = yield browser.newPage();
    const content = yield compile('invoice', data);
    yield page.setContent(content);
    yield page.emulateMedia('screen');
    const pdf = yield page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true
    });
    return pdf;
});
exports.generatePdf = functions.region('europe-west1').runWith({
    timeoutSeconds: 300,
    memory: '2GB'
}).https.onRequest((request, res) => __awaiter(this, void 0, void 0, function* () {
    //TODO - add apikey authorization
    // const apiKey = request.get('x-api-key');
    const id = request.body.id;
    //create headless chrome
    let result = null;
    let browser = null;
    try {
        // browser = await puppeteer.launch({
        //     args: chromium.args,
        //     defaultViewport: chromium.defaultViewport,
        //     executablePath: await chromium.executablePath,
        //     headless: chromium.headless,
        // });
        browser = yield puppeteer.launch({ args: ['--no-sandbox'] });
        if (id === undefined || id === '') {
            res.status(404).send({ error: 'id not valid' });
        }
        else {
            const data = yield fetchdata(id);
            if (data === null || data.invoice === undefined || data.invoice.type !== 'invoice') {
                res.status(404).send({ error: 'transaction not found' });
            }
            else {
                data.financials = createFinancials(data.invoice);
                const filename = id + ".pdf";
                res.set('Content-disposition', 'attachment; filename=' + filename);
                res.type('application/pdf');
                result = yield createPdf(data, browser);
            }
        }
    }
    catch (error) {
        throw error;
    }
    finally {
        if (browser !== null) {
            yield browser.close();
        }
    }
    return res.send(result);
}));
//# sourceMappingURL=pdf.functions.js.map