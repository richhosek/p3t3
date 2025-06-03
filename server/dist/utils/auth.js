import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import dotenv from 'dotenv';
dotenv.config();
export const authenticateToken = async ({ req, }) => {
    let token = req.body.token || req.query.token || req.headers.authorization || '';
    let user = null;
    console.log('=== AUTH DEBUG ===');
    console.log('Raw token:', token);
    console.log('JWT_SECRET_KEY exists:', !!process.env.JWT_SECRET_KEY);
    if (!token) {
        console.log('No token provided');
        return { user: null };
    }
    if (token) {
        try {
            token = token.split(' ').pop()?.trim() || '';
            console.log('Cleaned token:', token.substring(0, 20) + '...');
            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || '', {
                maxAge: '4h',
            });
            console.log('Decoded JWT:', decoded);
            console.log('Decoded data:', decoded.data);
            user = decoded.data;
            console.log('Final user object:', user);
        }
        catch (err) {
            console.log('Token verification failed:', err);
        }
    }
    console.log('Returning user:', user);
    console.log('=== AUTH DEBUG END ===');
    return { user };
};
export const signToken = (username, email, _id) => {
    const payload = { username, email, _id };
    const secretKey = process.env.JWT_SECRET_KEY;
    return jwt.sign({ data: payload }, secretKey, { expiresIn: '2h' });
};
export class AuthenticationError extends GraphQLError {
    constructor(message) {
        super(message, undefined, undefined, undefined, ['UNAUTHENTICATED']);
        Object.defineProperty(this, 'name', { value: 'AuthenticationError' });
    }
}
;
