import * as challengeFunctions from './endpoints/challenge.functions';
import * as customerFunctions from './endpoints/customer.functions';
import * as imageFunctions from './endpoints/image.functions';
import * as transactionFunctions from './endpoints/transaction.functions';

module.exports = {
    ...challengeFunctions,
    ...customerFunctions,
    ...imageFunctions,
    ...transactionFunctions
};


