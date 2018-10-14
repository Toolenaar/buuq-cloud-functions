import * as functions from 'firebase-functions';
import ctx from '../logic/context';
import { Transaction, Customer } from '../types';
import { getData, checkEventType } from '../logic/utils';


export const updateCustomer = functions.firestore.document('transactions/{id}').onWrite(async (change, context) => {

    const data = getData(change) as Transaction;
    const eventType = checkEventType(change);
    const value = await ctx.db.collection('customers').doc(data.customer.id).get();
    const customer = (value.data() as Customer);
    //update overall cost / expese for customer
    const updatedCustomer = updateCustomerExpensesCosts(customer, change, eventType);
    ctx.db.collection('customers').doc(data.customer.id).set(updatedCustomer).then((value2) => {
        // return 
    }).catch((error) => {
        console.log(error);
    });
    1;
});

function updateCustomerExpensesCosts(customer: Customer, change: functions.Change<FirebaseFirestore.DocumentSnapshot>, eventType: string): any {
    const transaction = getData(change) as Transaction;
    customer.revenue = customer.revenue === undefined ? 0 : customer.revenue;
    customer.expenses = customer.expenses === undefined ? 0 : customer.expenses;
    if (eventType === 'update') {
        //if edit get the previous value and replace
        const previous = change.before.data() as Transaction;
        const newAmount = (transaction.amount - previous.amount);
        if (transaction.type === 'invoice') {
            customer.revenue += newAmount;
        } else if (transaction.type === 'expense') {
            customer.expenses += newAmount;
        }

    } else if (eventType === 'create') {
        //if create add the new value
        if (transaction.type === 'invoice') {
            customer.revenue += transaction.amount;
        } else if (transaction.type === 'expense') {
            customer.expenses += transaction.amount;
        }
    } else if (eventType === 'delete') {
        //if delete remove the previous value
        if (transaction.type === 'invoice') {
            customer.revenue -= transaction.amount;
        } else if (transaction.type === 'expense') {
            customer.expenses -= transaction.amount;
        }
    }
    return customer;
}