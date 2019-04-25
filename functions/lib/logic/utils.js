"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Utils {
    static revenueAmountForLines(lines) {
        let total = 0;
        lines.forEach((line) => {
            total += line.amount;
        });
        return total;
    }
    static taxedAmountForLines(lines) {
        let total = 0;
        lines.forEach((line) => {
            total += ((line.amount / 100.0) * line.btwTarif);
        });
        return total;
    }
    static checkEventType(change) {
        const before = change.before.exists;
        const after = change.after.exists;
        if (before === false && after === true) {
            return 'create';
        }
        else if (before === true && after === true) {
            return 'update';
        }
        else if (before === true && after === false) {
            return 'delete';
        }
        else {
            throw new Error(`Unkown firestore event! before: '${before}', after: '${after}'`);
        }
    }
    static getData(change) {
        // check if deleted
        let data = change.after.data();
        if (data === undefined) {
            data = change.before.data();
        }
        return data;
    }
}
exports.default = Utils;
//# sourceMappingURL=utils.js.map