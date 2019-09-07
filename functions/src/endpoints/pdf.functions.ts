import * as functions from 'firebase-functions';
//const chromium = require('chrome-aws-lambda');
import * as puppeteer from 'puppeteer';
import * as sgMail from '@sendgrid/mail';
import * as handlebars from 'handlebars';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Transaction } from '../types';
import ctx from '../logic/context';
import { firestore } from 'firebase-admin';
import Utils from '../logic/utils';
import { SecurityHelper } from '../logic/securityHelper';
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

const compile = async (templateName: string, data: any) => {
    const filePath = path.join(process.cwd(), 'src/templates', `${templateName}.hbs`);
    const html = await fs.readFile(filePath, 'utf-8');
    return handlebars.compile(html)(data);
}

const fetchdata = async (id: string): Promise<any> => {
    // fetch the invoice
    const invoiceSnap = await ctx.db.collection('transactions').doc(id).get();
    const invoice = invoiceSnap.data() as Transaction;
    console.log(invoice);
    if (invoice === null || invoice === undefined) {
        return null;
    }

    // fetch the user data
    const userSnap = await ctx.db.collection('users').doc(invoice.uid).get();
    const user = userSnap.data();
    console.log(user);
    if (user === null || user === undefined) {
        return null;
    }

    // fetch the customer data
    const customerSnap = await ctx.db.collection('customers').doc(invoice.customer.id).get();
    const customer = customerSnap.data();
    console.log(customer);
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
    const lines = [];
    let totalAmount = 0;
    const totalBtw = [];
    //for each line show/calculate
    //amount
    // btw tarif
    // total btw (per tarif)
    // total amount of all
    for (const line of invoice.lines) {
        const btw = ((line.amount / 100) * line.btwTarif);
        line.btw = btw;
        line.totalAmount = line.amount + btw;

        //for each btw tarif save total amount
        const key = line.btwTarif.toString();
        const totalBtwItem = totalBtw.find((f) => f.key === key);
        if (totalBtwItem === undefined || totalBtwItem === null) {
            totalBtw.push(
                { 'key': key, 'tarif': line.btwTarif, 'amount' : line.amount, 'btw':btw });
        } else {
            totalBtwItem.btw += btw;
            totalBtwItem.amount += line.amount;
        }
        totalAmount += line.totalAmount;

        lines.push({ 
            'shortDescription':line.shortDescription,
            'btwTarif':  line.btwTarif + '%',
            'amount': Utils.formatFinancialAmount(line.amount)
        });
       
    }
    for (const item of totalBtw) {
        item.btwDisplay = Utils.formatFinancialAmount(item.btw);
        item.display = `${item.tarif}% over ${Utils.formatFinancialAmount(item.amount)}`;
    }

    // const totalAmount = invoice.amount + ((invoice.amount / 100) * invoice.btwTarif);
    const total = Utils.formatFinancialAmount(totalAmount);
    //const amount = '€' + Number(invoice.amount).toLocaleString("nl-NL", { minimumFractionDigits: 2 })
    return { total, date: formatDate(invoice.date),btw:totalBtw,lines };
}
const createPdf = async (data: any, browser: any): Promise<Buffer> => {

    const page = await browser.newPage();
    const content = await compile('invoice', data);
    await page.setContent(content);
    await page.emulateMedia('screen');
    const pdf = await page.pdf({
       // format: 'A4',
        width:600,
        printBackground: true,
        preferCSSPageSize: true
    });

    return pdf;
}


export const generatePdf = functions.region('europe-west1').runWith({
    timeoutSeconds: 300,
    memory: '2GB'
}).https.onRequest(async (request, res) => {
    //TODO - add apikey authorization
    // const apiKey = request.get('x-api-key');
   
    const isAuthenticated = await SecurityHelper.isAuthenticated(request);
    if (!isAuthenticated) {
        res.status(403).send('Unauthorized');
        return;
    }

    const {id,email,subject,text,html} = request.body;
    //create headless chrome
    let result = null;
    let browser = null;
    const filename = id + ".pdf";
    try {
        // browser = await puppeteer.launch({
        //     args: chromium.args,
        //     defaultViewport: chromium.defaultViewport,
        //     executablePath: await chromium.executablePath,
        //     headless: chromium.headless,
        // });
        browser = await puppeteer.launch({ args: ['--no-sandbox'] });
     
        if (id === undefined || id === '') {
            res.status(404).send({ error: 'id not valid' });
        } else {

            const data = await fetchdata(id);
            if (data === null || data.invoice === undefined || data.invoice.type !== 'invoice') {
                res.status(404).send({ error: 'transaction not found' });
                return;
            } else {

                data.financials = createFinancials(data.invoice);
                
                // res.set('Content-disposition', 'attachment; filename=' + filename);
                // res.type('application/pdf');

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
    //send email
    if(result === null)return;
    const apiKey = functions.config().sendgrid.key;
   
    sgMail.setApiKey(apiKey);

    const base64data = result.toString('base64');

    const msg = {
        to: email,
        from: 'buuq@noreply.io',
        subject: subject,
        text: text,
        html: html,
        attachments: [
            {
              content: base64data,
              filename: filename,
              type: 'application/pdf',
              disposition: 'attachment',
             // contentId: id
            },
          ],
    };
    sgMail.send(msg).then((response) => {
        return res.status(200).send(response);
    }).catch((e) => {
        console.log(e);
        return res.status(500).send(e);
    });

    //return res.send(result);

});