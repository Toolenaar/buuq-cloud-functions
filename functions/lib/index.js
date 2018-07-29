"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello from Firebase!");
});
exports.onTransactionWrite = functions.firestore.document('transactions/{id}').onWrite((change, context) => {
    let data = change.after.data();
    if (data === undefined) {
        data = change.before.data();
    }
    //get all transactions for quarter & create a financial overview
    return db.collection('transactions')
        .where('uid', '==', data.uid)
        .where('year', '==', data.year)
        .where('quarter', '==', data.quarter).get().then((value) => {
        // create a quarter overview
        const docId = data.uid + data.year + data.quarter;
        const financials = createFinancialOverview(value.docs);
        db.collection('quarteroverviews').doc(docId).set(createQuarterOverview(data, financials)).then((value2) => {
            // return 
        }).catch((error) => {
            console.log(error);
        });
    });
});
function createFinancialOverview(docs) {
    let revenue = 0;
    let expenses = 0;
    let taxes = 0;
    docs.forEach((item) => {
        const data = item.data();
        if (data.type === 'invoice') {
            revenue += data.amount;
        }
        else if (data.type === 'expense') {
            expenses += data.amount;
        }
        //calculate taxes (btw) to pay
        taxes += (data.amount / 100) * data.btwTarif;
    });
    return {
        revenue, expenses, taxes
    };
}
function createQuarterOverview(data, financials) {
    return {
        uid: data.uid,
        quarter: data.quarter,
        year: data.year,
        financials
    };
}
//# sourceMappingURL=index.js.map