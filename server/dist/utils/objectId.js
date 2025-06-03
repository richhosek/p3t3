// utils/objectIdUtils.ts
import { Types } from 'mongoose';
// Utility function to convert a string to ObjectId
export const toObjectId = (id) => {
    return typeof id === 'string' ? new Types.ObjectId(id) : id;
};
