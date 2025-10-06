import prisma from '../lib/prisma.js';
import { v4 as uuidv4 } from 'uuid';

export async function findOrCreateUserFromGoogle({ googleId, email, name, avatar, accessToken, refreshToken }) {
  if (!email) throw new Error('Google profile missing email');

  // try find by googleId
  let user = await prisma.user.findUnique({ where: { googleId } });
  if (user) {
    // update tokens/avatar
    await prisma.user.update({ where: { id: user.id }, data: { googleAccessToken: accessToken, googleRefreshToken: refreshToken, avatar } });
    return await prisma.user.findUnique({ where: { id: user.id } });
  }

  // link by email
  user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const updated = await prisma.user.update({ where: { id: user.id }, data: { googleId, googleAvatar: avatar, googleAccessToken: accessToken, googleRefreshToken: refreshToken, emailVerified: true } });
    return updated;
  }

  // create new user
  const newUser = await prisma.user.create({
    data: {
      id: uuidv4(),
      email,
      name,
      googleId,
      googleAvatar: avatar,
      googleAccessToken: accessToken,
      googleRefreshToken: refreshToken,
      emailVerified: true,
      isProfileComplete: true,
    }
  });

  return newUser;
}

export async function findUserById(id) {
  return prisma.user.findUnique({ where: { id } });
}
