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
const context_1 = require("../logic/context");
const utils_1 = require("../logic/utils");
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
exports.onTransactionWriteCreateQuarterOverview = functions.region('europe-west1').firestore.document('transactions/{id}').onWrite((change, context) => __awaiter(this, void 0, void 0, function* () {
    const data = utils_1.default.getData(change);
    //get all transactions for quarter & create a financial overview
    const value = yield context_1.default.db.collection('transactions')
        .where('uid', '==', data.uid)
        .where('year', '==', data.year)
        .where('isDeleted', '==', false)
        .where('quarter', '==', data.quarter).get();
    // create a quarter overview
    const docId = data.uid + data.year + data.quarter;
    const financials = createFinancialOverview(value.docs);
    context_1.default.db.collection('quarteroverviews').doc(docId).set(createQuarterOverview(data, financials)).then((value2) => {
        // return 
    }).catch((error) => {
        console.log(error);
    });
}));
function createFinancialOverview(docs) {
    let revenue = 0.0;
    let expenses = 0.0;
    let taxes = 0.0;
    //calculate taxes (btw) to pay
    docs.forEach((item) => {
        const data = item.data();
        if (data.type === 'invoice') {
            revenue += utils_1.default.revenueAmountForLines(data.lines);
            taxes += utils_1.default.taxedAmountForLines(data.lines);
        }
        else if (data.type === 'expense') {
            expenses += utils_1.default.revenueAmountForLines(data.lines);
            taxes -= utils_1.default.taxedAmountForLines(data.lines);
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
//# sourceMappingURL=transaction.functions.js.map