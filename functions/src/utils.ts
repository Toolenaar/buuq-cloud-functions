
import { Change } from 'firebase-functions';

export function checkEventType(change: Change<FirebaseFirestore.DocumentSnapshot>): string {
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