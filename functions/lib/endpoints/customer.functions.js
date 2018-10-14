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
exports.updateCustomer = functions.firestore.document('transactions/{id}').onWrite((change, context) => __awaiter(this, void 0, void 0, function* () {
    const data = utils_1.getData(change);
    const eventType = utils_1.checkEventType(change);
    const value = yield context_1.default.db.collection('customers').doc(data.customer.id).get();
    const customer = value.data();
    //update overall cost / expese for customer
    const updatedCustomer = updateCustomerExpensesCosts(customer, change, eventType);
    context_1.default.db.collection('customers').doc(data.customer.id).set(updatedCustomer).then((value2) => {
        // return 
    }).catch((error) => {
        console.log(error);
    });
}));
function updateCustomerExpensesCosts(customer, change, eventType) {
    const transaction = utils_1.getData(change);
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
//# sourceMappingURL=customer.functions.js.map