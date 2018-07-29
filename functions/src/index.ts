import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
export const onTransactionWrite = functions.firestore.document('transactions/{id}').onWrite((change, context) => {

    // check if deleted
    let data = change.after.data();
    if(data === undefined){
        data = change.before.data();
    }
    
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

function createFinancialOverview(docs:FirebaseFirestore.QueryDocumentSnapshot[]) {

    let revenue = 0;
    let expenses = 0;
    let taxes = 0;

    docs.forEach((item) => {
        const data = item.data();
        if(data.type === 'invoice'){
            revenue += data.amount
        }else if(data.type === 'expense'){
            expenses += data.amount;
        }
        //calculate taxes (btw) to pay
        taxes += (data.amount / 100) * data.btwTarif;
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

