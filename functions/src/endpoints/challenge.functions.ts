import * as functions from 'firebase-functions';
import ChallengeHelper from '../logic/challenges';
import Utils from '../logic/utils';
import ctx from '../logic/context';

export const updateChallenges = functions.region('europe-west1').firestore.document('transactions/{id}').onWrite(async (change, context) => {
    const data = Utils.getData(change);
    try {
        await ChallengeHelper.runChallenges(data, ctx.db);
    }
    catch (error) {
        console.log(error);
    }
});