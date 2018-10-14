import * as functions from 'firebase-functions';
import ChallengeHelper from '../logic/challenges';
import { getData } from '../logic/utils';
import ctx from '../logic/context';

export const updateChallenges = functions.firestore.document('transactions/{id}').onWrite(async (change, context) => {
    const data = getData(change);
    try {
        const value = await ChallengeHelper.runChallenges(data, ctx.db);
    }
    catch (error) {
        console.log(error);
    }
});