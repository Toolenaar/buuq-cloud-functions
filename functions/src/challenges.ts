export default class ChallengeHelper {
    
    public static updateKleineOndernemersAftrekChallenge = ( 
        data:FirebaseFirestore.DocumentData,
        db: FirebaseFirestore.Firestore) : Promise<any> => {
        // get all btw transactions for this year and count towards the challenge
        return db.collection('quarteroverviews')
        .where('uid','==',data.uid)
        .where('year', '==',data.year)
        .get().then((value) => {
            // create/update the challenge
            const docId = data.uid+data.year+'c05';
            const progress = ChallengeHelper.getKleineOndernemersAftrekProgress(value.docs);
           
            db.collection('challenges').doc(docId).set({
                uid:data.uid,
                challengeId:'c05',
                year:data.year,
                progress
            }).then((value2) => {
                // return 
            }).catch((error) => {
                console.log(error);
            });
        });
    }
    public static getKleineOndernemersAftrekProgress(docs:FirebaseFirestore.QueryDocumentSnapshot[]){
        //add up taxes to pay for each quarter
        let progress = 0.0;
        docs.forEach((item) => {
            progress += item.data().financials.taxes;
        });
        return progress;
    }
    
    public static updateKleinSchalingHeidsChallenge = (
        data:FirebaseFirestore.DocumentData,
        db: FirebaseFirestore.Firestore): Promise<any> => {
            
        return db.collection('transactions')
        .where('uid','==',data.uid)
        .where('type','==','expense')
        .where('year', '==',data.year)
        .where('category.id','==','4310')
        .get().then((value) => {
            // create/update the challenge
            const docId = data.uid+data.year+'c01';
            const progress = ChallengeHelper.getKleinSchalingHeidsProgress(value.docs);
           
            db.collection('challenges').doc(docId).set({
                uid:data.uid,
                challengeId:'c01',
                year:data.year,
                progress
            }).then((value2) => {
                // return 
            }).catch((error) => {
                console.log(error);
            });
        });
    }
    public static getKleinSchalingHeidsProgress = (docs:FirebaseFirestore.QueryDocumentSnapshot[]): number => {
        let progress = 0.0;
        docs.forEach((item) => {
            progress += item.data().amount;
        });
        return progress;
    }

    public static runChallenges = async (data:FirebaseFirestore.DocumentData, db: FirebaseFirestore.Firestore) => {
        const result = await ChallengeHelper.updateKleineOndernemersAftrekChallenge(data,db);
        if(data.type === 'expense' && data.amount > 400) {
            if(data.category.id === '4310'){
                return ChallengeHelper.updateKleinSchalingHeidsChallenge(data,db);
            }
        }
        return result;
    }


}


