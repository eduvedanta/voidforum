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
