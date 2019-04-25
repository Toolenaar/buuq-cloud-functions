import * as functions from 'firebase-functions';
const chromium = require('chrome-aws-lambda');
import * as puppeteer from 'puppeteer-core';

import * as handlebars from 'handlebars';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Transaction } from '../types';
import ctx from '../logic/context';
import { firestore } from 'firebase-admin';
//const admin = require('firebase-admin');
//https://github.com/GoogleChrome/puppeteer/issues/3120

const compile = async (templateName: string, data: any) => {
    const filePath = path.join(process.cwd(), 'src/templates', `${templateName}.hbs`);
    const html = await fs.readFile(filePath, 'utf-8');
    return handlebars.compile(html)(data);
}
const fetchdata = async (id: string): Promise<any> => {
    // fetch the invoice
    const invoiceSnap = await ctx.db.collection('transactions').doc(id).get();
    const invoice = invoiceSnap.data() as Transaction;

    if (invoice === null || invoice === undefined) {
        return null;
    }

    // fetch the user data
    const userSnap = await ctx.db.collection('users').where('uid', '==', invoice.uid).get();
    const user = userSnap.docs[0].data();
    if (user === null || user === undefined) {
        return null;
    }

    // fetch the customer data
    const customerSnap = await ctx.db.collection('customers').doc(invoice.customer.id).get();
    const customer = customerSnap.data();
    if (customer === null || customer === undefined) {
        return null;
    }

    return { invoice, user, customer };
}
const formatDate = (timestamp: firestore.Timestamp) => {
    const d = timestamp.toDate();
    return ("0" + d.getDate()).slice(-2) + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" +
        d.getFullYear() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
}
const createFinancials = (invoice: Transaction) => {
    const totalAmount = invoice.amount + ((invoice.amount / 100) * invoice.btwTarif);
    const total = '€' + Number(totalAmount).toLocaleString("nl-NL", { minimumFractionDigits: 2 })
    const amount = '€' + Number(invoice.amount).toLocaleString("nl-NL", { minimumFractionDigits: 2 })
    return { total, amount, date: formatDate(invoice.date) };
}
const createPdf = async (data: any, browser: any): Promise<Buffer> => {

    const page = await browser.newPage();
    const content = await compile('invoice', data);
    await page.setContent(content);
    await page.emulateMedia('screen');
    const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true
    });

    return pdf;
}


export const generatePdf = functions.region('europe-west1').runWith({
    timeoutSeconds: 300,
    memory: '2GB'
}).https.onRequest(async (request, res) => {
    // const apiKey = request.get('x-api-key');
    const id = request.body.id;
    //create headless chrome
    let result = null;
    let browser = null;

    try {
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
        });

        if (id === undefined || id === '') {
            res.status(404).send({ error: 'id not valid' });
        } else {

            const data = await fetchdata(id);
            if (data === null || data.invoice === undefined || data.invoice.type !== 'invoice') {
                res.status(404).send({ error: 'transaction not found' });
            } else {

                data.financials = createFinancials(data.invoice);
                console.log(data);
                const filename = id + ".pdf";
                res.set('Content-disposition', 'attachment; filename=' + filename);
                res.type('application/pdf');

                result = await createPdf(data, browser);
            }
        }

    } catch (error) {
        throw error;
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }

    return res.send(result);

});