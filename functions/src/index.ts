import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { updateKleinSchalingHeidsChallenge } from './challenges';
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();

export const updateChallenges = functions.firestore.document('transactions/{id}').onWrite((change, context) => {
    const data = getData(change);
      // if transaction is expense and of category with id 4310 (kantoorkosten)
    if(data.type === 'expense') {
        if(data.category.id === '4310'){
            return updateKleinSchalingHeidsChallenge(data,db);
        }
       
    }
    return null;
});

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
export const onTransactionWriteCreateQuarterOverview = functions.firestore.document('transactions/{id}').onWrite((change, context) => {

    const data = getData(change);
    
    //get all transactions for quarter & create a financial overview
    return db.collection('transactions')
    .where('uid','==',data.uid)
    .where('year', '==',data.year)
    .where('quarter','==',data.quarter).get().then((value) => {
        // create a quarter overview
        const docId = data.uid+data.year+data.quarter;
        const financials = createFinancialOverview(value.docs);
        db.collection('quarteroverviews').doc(docId).set(createQuarterOverview(data,financials)).then((value2) => {
            // return 
        }).catch((error) => {
            console.log(error);
        });
    });
   
});
function getData(change: functions.Change<FirebaseFirestore.DocumentSnapshot>){
 // check if deleted
 let data = change.after.data();
 if(data === undefined){
     data = change.before.data();
 }
 return data;
}
function createFinancialOverview(docs:FirebaseFirestore.QueryDocumentSnapshot[]) {

    let revenue = 0.0;
    let expenses = 0.0;
    let taxes = 0.0;

    docs.forEach((item) => {
        const data = item.data();
        if(data.type === 'invoice'){
            revenue += data.amount
        }else if(data.type === 'expense'){
            expenses += data.amount;
        }
        //calculate taxes (btw) to pay
        taxes += (data.amount / 100.0) * data.btwTarif;
    });

    return {
        revenue,expenses,taxes
    }
}
function createQuarterOverview(data:FirebaseFirestore.DocumentData,financials:any){
    return {
        uid:data.uid,
        quarter:data.quarter,
        year:data.year,
        financials
    };
}

