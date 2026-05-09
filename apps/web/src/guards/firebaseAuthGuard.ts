export function requireAuthenticatedUser(currentUser: { uid: string } | null) {
  if (!currentUser?.uid) {
    throw new Error('Firebase authentication required.');
  }
  return currentUser;
}
