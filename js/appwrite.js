// =========================================
// appwrite.js - Appwrite SDK Setup
// =========================================

const APPWRITE_ENDPOINT =
  'https://fra.cloud.appwrite.io/v1';

const APPWRITE_PROJECT_ID =
  '6a11a9ab002adfeb9310';

const DATABASE_ID =
  '6a11a9ff00283f8ad76d';

const THREADS_COLLECTION_ID =
  'threads';

const REPLIES_COLLECTION_ID =
  'replies';

const NOTIFICATIONS_COLLECTION_ID =
  'notifications';
const VOTES_COLLECTION_ID =
'votes';

const BUCKET_ID =
  '6a15a249002eb5c2e7fe';

const {
  Query,
  ID,
  Permission,
  Role
} = Appwrite;

const client = new Appwrite.Client();

client
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

const account =
  new Appwrite.Account(client);

const databases =
  new Appwrite.Databases(client);

const storage =
  new Appwrite.Storage(client);

window.client = client;
window.account = account;
window.databases = databases;
window.storage = storage;

window.Query = Query;
window.ID = ID;
window.Permission = Permission;
window.Role = Role;

window.DATABASE_ID = DATABASE_ID;
window.THREADS_COLLECTION_ID =
  THREADS_COLLECTION_ID;

window.REPLIES_COLLECTION_ID =
  REPLIES_COLLECTION_ID;

window.NOTIFICATIONS_COLLECTION_ID =
  NOTIFICATIONS_COLLECTION_ID;

window.BUCKET_ID = BUCKET_ID;
window.PROJECT_ID =
  APPWRITE_PROJECT_ID;
// =========================================
// GET USER VOTE
// =========================================
async function getUserVote(
  userId,
  targetId,
  targetType
) {

  const response =
    await databases.listDocuments(
      DATABASE_ID,
      VOTES_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.equal('targetId', targetId),
        Query.equal('targetType', targetType)
      ]
    );

  return response.documents[0] || null;

}

// =========================================
// HANDLE VOTE
// =========================================
async function vote(
  targetId,
  targetType,
  voteType
) {

  const user =
    await getCurrentUser();

  if (!user) {

    alert('Login required');

    return null;

  }

  const collectionId =
    targetType === 'thread'
      ? THREADS_COLLECTION_ID
      : REPLIES_COLLECTION_ID;

  const target =
    await databases.getDocument(
      DATABASE_ID,
      collectionId,
      targetId
    );

  const existingVote =
    await getUserVote(
      user.$id,
      targetId,
      targetType
    );

  let upVotes =
  Number(target.upVotes ?? 0);

let downVotes =
  Number(target.downVotes ?? 0);

  // REMOVE SAME VOTE
  if (
    existingVote &&
    existingVote.voteType === voteType
  ) {

    await databases.deleteDocument(
      DATABASE_ID,
      VOTES_COLLECTION_ID,
      existingVote.$id
    );

    if (voteType === 1) {
      upVotes--;
    } else {
      downVotes--;
    }

  }

  // SWITCH VOTE
  else if (existingVote) {

    if (existingVote.voteType === 1) {
      upVotes--;
    } else {
      downVotes--;
    }

    if (voteType === 1) {
      upVotes++;
    } else {
      downVotes++;
    }

    await databases.updateDocument(
      DATABASE_ID,
      VOTES_COLLECTION_ID,
      existingVote.$id,
      {
        voteType
      }
    );

  }

  // NEW VOTE
  else {

    if (voteType === 1) {
      upVotes++;
    } else {
      downVotes++;
    }

    await databases.createDocument(
      DATABASE_ID,
      VOTES_COLLECTION_ID,
      ID.unique(),
      {
        userId: user.$id,
        targetId,
        targetType,
        voteType
      }
    );

  }

  await databases.updateDocument(
    DATABASE_ID,
    collectionId,
    targetId,
    {
      upVotes,
      downVotes
    }
  );

  return {
    upVotes,
    downVotes
  };

}
