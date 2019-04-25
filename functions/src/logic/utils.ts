
import { Change } from 'firebase-functions';
// tslint:disable-next-line:no-duplicate-imports
import * as functions from 'firebase-functions';
import { TransactionLine } from '../types';

export default class Utils {

    static revenueAmountForLines(lines: TransactionLine[]): number {
        let total = 0;
        lines.forEach((line: TransactionLine) => {
            total += line.amount;
        });
        return total;
    }
    static taxedAmountForLines(lines: TransactionLine[]): number {
        let total = 0;
        lines.forEach((line: TransactionLine) => {
            total += ((line.amount / 100.0) * line.btwTarif);
        });
        return total;
    }
    static checkEventType(change: Change<FirebaseFirestore.DocumentSnapshot>): string {
        const before: boolean = change.before.exists;
        const after: boolean = change.after.exists;

        if (before === false && after === true) {
            return 'create';
        } else if (before === true && after === true) {
            return 'update';
        } else if (before === true && after === false) {
            return 'delete';
        } else {
            throw new Error(`Unkown firestore event! before: '${before}', after: '${after}'`);
        }
    }

    static getData(change: functions.Change<FirebaseFirestore.DocumentSnapshot>) {
        // check if deleted
        let data = change.after.data();
        if (data === undefined) {
            data = change.before.data();
        }
        return data;
    }
}

