import * as functions from 'firebase-functions';
import ctx from '../logic/context';
import { Transaction, Customer } from '../types';
import Utils from '../logic/utils';

/**
 * when a new customer is added,edited update the details of the user to include total amount earned spent on that customer
 */
export const updateCustomer = functions.region('europe-west1').firestore.document('transactions/{id}').onWrite(async (change, context) => {
   
    const data = Utils.getData(change) as Transaction;
    const eventType = Utils.checkEventType(change);
    const value = await ctx.db.collection('customers').doc(data.customer.id).get();
    const customer = (value.data() as Customer);

    //check activity ID if activity id is same dont update

    //else update

    //update overall cost / expese for customer
    const updatedCustomer = await updateCustomerExpensesCosts(customer, change, eventType);
   
    ctx.db.collection('customers').doc(data.customer.id).set(updatedCustomer).then((value2) => {
        // return 
    }).catch((error) => {
        console.log(error);
    });
});

/**
 * get a list of transactions for the user and add all amounts
 * @param customer 
 * @param change 
 * @param eventType 
 */
async function updateCustomerExpensesCosts(customer: Customer, change: functions.Change<FirebaseFirestore.DocumentSnapshot>, eventType: string) {

    //on create add the amount
    const after = change.after.data() as Transaction;
    let amount = 0;
    if (after.type === 'invoice') {
        amount = customer.revenue == undefined ? 0 : customer.revenue;
    } else {
        amount = customer.expenses == undefined ? 0 : customer.expenses;
    }

    if (eventType == 'create') {
        amount += after.amount;
    } else if (eventType == 'update') {
        //on edit distract the old and add the new
        const before = change.before.data() as Transaction;
        amount -= before.amount;
        // if isDeleted only distract
        if (!after.isDeleted) {
            amount += after.amount;
        }
    }
    if (after.type === 'invoice') {
        customer.revenue = amount;
    } else {
        customer.expenses = amount;
    }
    return customer;
}