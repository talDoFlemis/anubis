import { hash, compare } from 'bcrypt';

export const BCRYPT_SALT_ROUNDS = 12;

export const hashPassword = async (password: string) => await hash(password, BCRYPT_SALT_ROUNDS);
export const comparePassword = async (password: string, hashedPassword: string) =>
  await compare(password, hashedPassword);
