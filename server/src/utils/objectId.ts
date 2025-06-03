// utils/objectIdUtils.ts
import { Types } from 'mongoose';

// Utility function to convert a string to ObjectId
export const toObjectId = (id: string | Types.ObjectId): Types.ObjectId => {
  return typeof id === 'string' ? new Types.ObjectId(id) : id;
};
