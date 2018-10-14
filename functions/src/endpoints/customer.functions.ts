import * as functions from 'firebase-functions';
import ctx from '../logic/context';
import { Transaction, Customer } from '../types';
import { getData, checkEventType } from '../logic/utils';

/**
 * when a new customer is added,edited update the details of the user to include total amount earned spent on that customer
 */
export const updateCustomer = functions.firestore.document('transactions/{id}').onWrite(async (change, context) => {

    const data = getData(change) as Transaction;
    const eventType = checkEventType(change);
    const value = await ctx.db.collection('customers').doc(data.customer.id).get();
    const customer = (value.data() as Customer);
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
    const transaction = getData(change) as Transaction;
    const transactionsForCustomer = await ctx.db.collection('transactions')
    .where('customer.id', '==', customer.id)
    .where('isDeleted', '==', false).get();

    if(transactionsForCustomer.docs.length !== 0){
        const transactionList = transactionsForCustomer.docs.map(t => t.data() as Transaction);
        if (transaction.type === 'invoice') {
            customer.revenue = transactionList.reduce((a, b) => a + b.amount, 0);
        } else if (transaction.type === 'expense') {
            customer.expenses = transactionList.reduce((a, b) => a + b.amount, 0);
        }
    }
    
    return customer;
}