// https://medium.com/@ebidel/puppeteering-in-firebase-google-cloud-functions-76145c7662bd
import * as express from 'express';
const puppeteer = require('puppeteer');
//import  * as  puppeteer  from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Browser } from 'puppeteer';
import ctx from '../logic/context';
import { Transaction } from '../types';
const app = express();

const compile = async (templateName: string, data: any) => {
  const filePath = path.join(process.cwd(), 'src/express/templates', `${templateName}.hbs`);
  const html = await fs.readFile(filePath, 'utf-8');
  return handlebars.compile(html)(data);
}
const fetchdata = async (id: string): Promise<any> => {
  // fetch the invoice
  const invoiceSnap = await ctx.db.collection('transactions').doc(id).get();
  const invoice = invoiceSnap.data() as Transaction;
 
  if(invoice === null || invoice === undefined){
    return null;
  }
 
  // fetch the user data
  const userSnap = await ctx.db.collection('users').where('uid', '==', invoice.uid).get();
  const user = userSnap.docs[0].data();
  if(user === null || user === undefined){
    return null;
  }

  // fetch the customer data
  const customerSnap = await ctx.db.collection('customers').doc(invoice.customer.id).get();
  const customer = customerSnap.data();
  if(customer === null || customer === undefined){
    return null;
  }

  return {invoice,user,customer};
}
const formatDate = (d: Date) => {
  return ("0" + d.getDate()).slice(-2) + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" +
    d.getFullYear() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
}
const createFinancials = (invoice: Transaction) => {
  const totalAmount = invoice.amount + ((invoice.amount / 100) * invoice.btwTarif);
  const total = '€'+Number(totalAmount).toLocaleString("nl-NL", {minimumFractionDigits: 2})
  const amount = '€'+Number(invoice.amount).toLocaleString("nl-NL", {minimumFractionDigits: 2})
  return {total, amount,date:formatDate(invoice.date)};
}

const createPdf = async (data: any,res: express.Response): Promise<Buffer> => {
  const browser = res.locals.browser as Browser;
  const page = await browser.newPage();
  const content = await compile('invoice', data);
  await page.setContent(content);
  await page.emulateMedia('screen');
  return await page.pdf({
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true
  });
}

// Runs before every route. Launches headless Chrome.
app.all('/pdf', async (req, res, next) => {
  // Note: --no-sandbox is required in this env.
  // Could also launch chrome and reuse the instance
  // using puppeteer.connect()
  res.locals.browser = await puppeteer.launch({
    args: ['--no-sandbox']
  });
  next(); // pass control to next route.
});
app.post('/pdf', async (req: express.Request, res: express.Response) => {
  const { id } = req.body;

  if (id === undefined || id === '') {
    res.status(404).send({ error: 'id not valid' });
  } else {
    try {
      const data = await fetchdata(id);
      if(data === null || data.invoice === undefined || data.invoice.type !== 'invoice'){
        res.status(404).send({ error: 'transaction not found' });
      }else{
      
        data.financials = createFinancials(data.invoice); 
        console.log(data);
        const filename = id+".pdf";
        res.set('Content-disposition', 'attachment; filename=' + filename);
        res.type('application/pdf');
        res.send(await createPdf(data,res));
      }
    } catch (e) {
      res.status(500).send({ error: e });
    }
  }
});

export default app;