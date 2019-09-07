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
    console.log('updating customer total expenses');
    const data = utils_1.default.getData(change);
    const eventType = utils_1.default.checkEventType(change);
    const value = yield context_1.default.db.collection('customers').doc(data.customer.id).get();
    const customer = value.data();
    //check activity ID if activity id is same dont update
    //else update
    //update overall cost / expese for customer
    const updatedCustomer = yield updateCustomerExpensesCosts(customer, change, eventType);
    console.log(`updated customer ${updatedCustomer.id}`);
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
        //on create add the amount
        const after = change.after.data();
        let amount = 0;
        if (after.type === 'invoice') {
            amount = customer.revenue == undefined ? 0 : customer.revenue;
        }
        else {
            amount = customer.expenses == undefined ? 0 : customer.expenses;
        }
        if (eventType == 'create') {
            amount += after.amount;
        }
        else if (eventType == 'update') {
            //on edit distract the old and add the new
            const before = change.before.data();
            amount -= before.amount;
            // if isDeleted only distract
            if (!after.isDeleted) {
                amount += after.amount;
            }
        }
        if (after.type === 'invoice') {
            customer.revenue = amount;
        }
        else {
            customer.expenses = amount;
        }
        return customer;
    });
}
//# sourceMappingURL=customer.functions.js.map