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
class ChallengeHelper {
    static getKleineOndernemersAftrekProgress(docs) {
        //add up taxes to pay for each quarter
        let progress = 0.0;
        docs.forEach((item) => {
            progress += item.data().financials.taxes;
        });
        return progress;
    }
}
ChallengeHelper.updateKleineOndernemersAftrekChallenge = (data, db) => {
    // get all btw transactions for this year and count towards the challenge
    return db.collection('quarteroverviews')
        .where('uid', '==', data.uid)
        .where('year', '==', data.year)
        .get().then((value) => {
        // create/update the challenge
        const docId = data.uid + data.year + 'c05';
        const progress = ChallengeHelper.getKleineOndernemersAftrekProgress(value.docs);
        db.collection('challenges').doc(docId).set({
            uid: data.uid,
            challengeId: 'c05',
            year: data.year,
            progress
        }).then((value2) => {
            // return 
        }).catch((error) => {
            console.log(error);
        });
    });
};
ChallengeHelper.updateKleinSchalingHeidsChallenge = (data, db) => {
    return db.collection('transactions')
        .where('uid', '==', data.uid)
        .where('type', '==', 'expense')
        .where('year', '==', data.year)
        .where('category.id', '==', '4310')
        .get().then((value) => {
        // create/update the challenge
        const docId = data.uid + data.year + 'c01';
        const progress = ChallengeHelper.getKleinSchalingHeidsProgress(value.docs);
        db.collection('challenges').doc(docId).set({
            uid: data.uid,
            challengeId: 'c01',
            year: data.year,
            progress
        }).then((value2) => {
            // return 
        }).catch((error) => {
            console.log(error);
        });
    });
};
ChallengeHelper.getKleinSchalingHeidsProgress = (docs) => {
    let progress = 0.0;
    docs.forEach((item) => {
        progress += item.data().amount;
    });
    return progress;
};
ChallengeHelper.runChallenges = (data, db) => __awaiter(this, void 0, void 0, function* () {
    const result = yield ChallengeHelper.updateKleineOndernemersAftrekChallenge(data, db);
    if (data.type === 'expense' && data.amount > 400) {
        if (data.category.id === '4310') {
            return ChallengeHelper.updateKleinSchalingHeidsChallenge(data, db);
        }
    }
    return result;
});
exports.default = ChallengeHelper;
//# sourceMappingURL=challenges.js.map