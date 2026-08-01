import mongoose from 'mongoose';

export const isObjectId = (value) => mongoose.isValidObjectId(value);

export const objectIdMessage = 'Invalid id format';

export const objectIdParam = (field = 'id') => ({
  in: ['params'],
  errorMessage: objectIdMessage,
  custom: {
    options: (value) => isObjectId(value),
  },
  field,
});

export default { isObjectId, objectIdMessage, objectIdParam };
