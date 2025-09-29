import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export async function verifyPassword(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword)
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export async function createUser(username: string, password: string) {
  const hashedPassword = await hashPassword(password)
  
  return db.user.create({
    data: {
      username,
      password: hashedPassword,
    },
  })
}

export async function getUser(username: string) {
  return db.user.findUnique({
    where: { username },
  })
}


