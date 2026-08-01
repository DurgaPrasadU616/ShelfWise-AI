import mongoose from 'mongoose';

export const getDbState = () => {
  switch (mongoose.connection.readyState) {
    case 0:
      return 'disconnected';
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'unknown';
  }
};

export const isDbConnected = () => mongoose.connection.readyState === 1;
