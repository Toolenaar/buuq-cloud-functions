import { Request } from 'firebase-functions';
import ctx from '../logic/context';
export class SecurityHelper {
    static async adminHasAccess(userId: string, gemeenteCode: string): Promise<boolean> {
        console.log(userId);
        const userResult = await ctx.db.collection('users').doc(userId).get();
        const user = userResult.data();
        console.log(user);
        if (!user) return false;
        if (user.role === 'super_admin' || (user.role === 'gov_admin' && user.location.gemeenteCode === gemeenteCode)) {
            return true;
        }
        return false;
    }
    static async isAuthenticated(req: Request): Promise<boolean> {

        if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
            !(req.cookies && req.cookies.__session)) {

            return false;
        }

        let idToken;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            console.log('Found "Authorization" header');
            // Read the ID Token from the Authorization header.
            idToken = req.headers.authorization.split('Bearer ')[1];
        } else if (req.cookies) {
            console.log('Found "__session" cookie');
            // Read the ID Token from cookie.
            idToken = req.cookies.__session;
        } else {
            // No cookie
            return false;
        }

        try {
            const decodedIdToken = await ctx.admin.auth().verifyIdToken(idToken);
            console.log('ID Token correctly decoded', decodedIdToken);
            return true;
        } catch (error) {
            console.error('Error while verifying Firebase ID token:', error);
            return false;
        }

        return true;
    }

}