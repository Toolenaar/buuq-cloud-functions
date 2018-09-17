"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const challenges_1 = require("./challenges");
const utils_1 = require("./utils");
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();
exports.updateCustomer = functions.firestore.document('transactions/{id}').onWrite((change, context) => {
    const data = getData(change);
    const eventType = utils_1.checkEventType(change);
    return db.collection('customers').doc(data.customer.id).get().then((value) => {
        const customer = value.data();
        //update overall cost / expese for customer
        const updatedCustomer = updateCustomerExpensesCosts(customer, change, eventType);
        db.collection('customers').doc(data.customer.id).set(updatedCustomer).then((value2) => {
            // return 
        }).catch((error) => {
            console.log(error);
        });
        1;
    });
});
exports.updateChallenges = functions.firestore.document('transactions/{id}').onWrite((change, context) => {
    const data = getData(change);
    return challenges_1.default.runChallenges(data, db).then((value) => {
        //return
    }).catch((error) => {
        console.log(error);
    });
});
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
exports.onTransactionWriteCreateQuarterOverview = functions.firestore.document('transactions/{id}').onWrite((change, context) => {
    const data = getData(change);
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
function getData(change) {
    // check if deleted
    let data = change.after.data();
    if (data === undefined) {
        data = change.before.data();
    }
    return data;
}
function updateCustomerExpensesCosts(customer, change, eventType) {
    const transaction = getData(change);
    customer.revenue = customer.revenue === undefined ? 0 : customer.revenue;
    customer.expenses = customer.expenses === undefined ? 0 : customer.expenses;
    if (eventType === 'update') {
        //if edit get the previous value and replace
        const previous = change.before.data();
        const newAmount = (transaction.amount - previous.amount);
        if (transaction.type === 'invoice') {
            customer.revenue += newAmount;
        }
        else if (transaction.type === 'expense') {
            customer.expenses += newAmount;
        }
    }
    else if (eventType === 'create') {
        //if create add the new value
        if (transaction.type === 'invoice') {
            customer.revenue += transaction.amount;
        }
        else if (transaction.type === 'expense') {
            customer.expenses += transaction.amount;
        }
    }
    else if (eventType === 'delete') {
        //if delete remove the previous value
        if (transaction.type === 'invoice') {
            customer.revenue -= transaction.amount;
        }
        else if (transaction.type === 'expense') {
            customer.expenses -= transaction.amount;
        }
    }
    return customer;
}
function createFinancialOverview(docs) {
    let revenue = 0.0;
    let expenses = 0.0;
    let taxes = 0.0;
    //calculate taxes (btw) to pay
    docs.forEach((item) => {
        const data = item.data();
        if (data.type === 'invoice') {
            revenue += data.amount;
            taxes += (data.amount / 100.0) * data.btwTarif;
        }
        else if (data.type === 'expense') {
            expenses += data.amount;
            taxes -= (data.amount / 100.0) * data.btwTarif;
        }
    });
    const profit = revenue - expenses;
    return {
        revenue, expenses, taxes, profit
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