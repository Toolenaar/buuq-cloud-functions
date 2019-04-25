import * as challengeFunctions from './endpoints/challenge.functions';
import * as customerFunctions from './endpoints/customer.functions';
import * as imageFunctions from './endpoints/image.functions';
import * as transactionFunctions from './endpoints/transaction.functions';
import * as pdfFunctions from './endpoints/pdf.functions';
//import app from './express/server';
module.exports = {
    ...challengeFunctions,
    ...customerFunctions,
    ...imageFunctions,
    ...transactionFunctions,
    ...pdfFunctions,
    //api:functions.https.onRequest(app)
};


