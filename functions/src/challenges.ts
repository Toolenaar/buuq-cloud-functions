const getProgress = (docs:FirebaseFirestore.QueryDocumentSnapshot[]): number => {
    let progress = 0.0;
    docs.forEach((item) => {
        progress += item.data().amount;
    });
    return progress;
}

export const updateKleinSchalingHeidsChallenge = (
    data:FirebaseFirestore.DocumentData,
    db: FirebaseFirestore.Firestore): Promise<any> => {
        
    return db.collection('transactions')
    .where('uid','==',data.uid)
    .where('type','==','expense')
    .where('year', '==',data.year)
    .where('category.id','==','4310')
    .get().then((value) => {
        // create a quarter overview
        const docId = data.uid+data.year+'c01';
        const progress = getProgress(value.docs);
       
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
