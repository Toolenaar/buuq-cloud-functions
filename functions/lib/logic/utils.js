"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function checkEventType(change) {
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
exports.checkEventType = checkEventType;
function getData(change) {
    // check if deleted
    let data = change.after.data();
    if (data === undefined) {
        data = change.before.data();
    }
    return data;
}
exports.getData = getData;
//# sourceMappingURL=utils.js.map