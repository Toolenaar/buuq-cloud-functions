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
const functions = require("firebase-functions");
const challenges_1 = require("../logic/challenges");
const utils_1 = require("../logic/utils");
const context_1 = require("../logic/context");
exports.updateChallenges = functions.firestore.document('transactions/{id}').onWrite((change, context) => __awaiter(this, void 0, void 0, function* () {
    const data = utils_1.getData(change);
    try {
        const value = yield challenges_1.default.runChallenges(data, context_1.default.db);
    }
    catch (error) {
        console.log(error);
    }
}));
//# sourceMappingURL=challenge.functions.js.map