// utils/authHelpers.ts
export const cleanUserResponse = (user: any) => {
  if (!user) return null;
  return user.toObject ? user.toObject() : user;
};