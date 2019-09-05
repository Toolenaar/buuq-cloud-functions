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
const context_1 = require("../logic/context");
class SecurityHelper {
    static adminHasAccess(userId, gemeenteCode) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(userId);
            const userResult = yield context_1.default.db.collection('users').doc(userId).get();
            const user = userResult.data();
            console.log(user);
            if (!user)
                return false;
            if (user.role === 'super_admin' || (user.role === 'gov_admin' && user.location.gemeenteCode === gemeenteCode)) {
                return true;
            }
            return false;
        });
    }
    static isAuthenticated(req) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
                !(req.cookies && req.cookies.__session)) {
                return false;
            }
            let idToken;
            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
                console.log('Found "Authorization" header');
                // Read the ID Token from the Authorization header.
                idToken = req.headers.authorization.split('Bearer ')[1];
            }
            else if (req.cookies) {
                console.log('Found "__session" cookie');
                // Read the ID Token from cookie.
                idToken = req.cookies.__session;
            }
            else {
                // No cookie
                return false;
            }
            try {
                const decodedIdToken = yield context_1.default.admin.auth().verifyIdToken(idToken);
                console.log('ID Token correctly decoded', decodedIdToken);
                return true;
            }
            catch (error) {
                console.error('Error while verifying Firebase ID token:', error);
                return false;
            }
            return true;
        });
    }
}
exports.SecurityHelper = SecurityHelper;
//# sourceMappingURL=securityHelper.js.map