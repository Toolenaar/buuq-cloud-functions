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
/**
 * when a new customer is added,edited update the details of the user to include total amount earned spent on that customer
 */
exports.updateCustomer = functions.region('europe-west1').firestore.document('transactions/{id}').onWrite((change, context) => __awaiter(this, void 0, void 0, function* () {
    const data = utils_1.default.getData(change);
    const eventType = utils_1.default.checkEventType(change);
    const value = yield context_1.default.db.collection('customers').doc(data.customer.id).get();
    const customer = value.data();
    //update overall cost / expese for customer
    const updatedCustomer = yield updateCustomerExpensesCosts(customer, change, eventType);
    context_1.default.db.collection('customers').doc(data.customer.id).set(updatedCustomer).then((value2) => {
        // return 
    }).catch((error) => {
        console.log(error);
    });
}));
/**
 * get a list of transactions for the user and add all amounts
 * @param customer
 * @param change
 * @param eventType
 */
function updateCustomerExpensesCosts(customer, change, eventType) {
    return __awaiter(this, void 0, void 0, function* () {
        const transaction = utils_1.default.getData(change);
        const transactionsForCustomer = yield context_1.default.db.collection('transactions')
            .where('customer.id', '==', customer.id)
            .where('isDeleted', '==', false).get();
        if (transactionsForCustomer.docs.length !== 0) {
            const transactionList = transactionsForCustomer.docs.map(t => t.data());
            if (transaction.type === 'invoice') {
                customer.revenue = transactionList.reduce((a, b) => a + b.amount, 0);
            }
            else if (transaction.type === 'expense') {
                customer.expenses = transactionList.reduce((a, b) => a + b.amount, 0);
            }
        }
        return customer;
    });
}
//# sourceMappingURL=customer.functions.js.map