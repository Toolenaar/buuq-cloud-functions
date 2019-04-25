import * as functions from 'firebase-functions';
import ctx from '../logic/context';
import Utils from '../logic/utils';
import { Transaction } from '../types';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
export const onTransactionWriteCreateQuarterOverview = functions.region('europe-west1').firestore.document('transactions/{id}').onWrite(async (change, context) => {

    const data = Utils.getData(change);

    //get all transactions for quarter & create a financial overview
    const value = await ctx.db.collection('transactions')
        .where('uid', '==', data.uid)
        .where('year', '==', data.year)
        .where('isDeleted', '==', false)
        .where('quarter', '==', data.quarter).get();
    // create a quarter overview
    const docId = data.uid + data.year + data.quarter;
    const financials = createFinancialOverview(value.docs);
    ctx.db.collection('quarteroverviews').doc(docId).set(createQuarterOverview(data, financials)).then((value2) => {
        // return 
    }).catch((error) => {
        console.log(error);
    });

});

function createFinancialOverview(docs: FirebaseFirestore.QueryDocumentSnapshot[]) {

    let revenue = 0.0;
    let expenses = 0.0;
    let taxes = 0.0;

    //calculate taxes (btw) to pay
    docs.forEach((item) => {
        const data = item.data() as Transaction;
        if (data.type === 'invoice') {
            revenue += Utils.revenueAmountForLines(data.lines);
            taxes += Utils.taxedAmountForLines(data.lines);
        } else if (data.type === 'expense') {
            expenses += Utils.revenueAmountForLines(data.lines);
            taxes -= Utils.taxedAmountForLines(data.lines);
        }
    });
    const profit = revenue - expenses;
    return {
        revenue, expenses, taxes, profit
    }
}

function createQuarterOverview(data: FirebaseFirestore.DocumentData, financials: any) {
    return {
        uid: data.uid,
        quarter: data.quarter,
        year: data.year,
        financials
    };
}