// =========================================
// create.js - Create Thread Page
// =========================================

let currentUser = null;

// =========================================
// PAGE LOAD
// =========================================
document.addEventListener('DOMContentLoaded', async () => {

  currentUser = await requireAuth();

  if (!currentUser) return;

  updateNavbar(currentUser);

});

// =========================================
// SUBMIT THREAD
// =========================================
async function submitThread() {

  const title = document
    .getElementById('thread-title')
    .value
    .trim();

  const content = document
    .getElementById('thread-content')
    .value
    .trim();

  const mediaFile = document
    .getElementById('thread-media')
    .files[0];

  const messageEl = document.getElementById('create-message');

  const submitBtn = document.getElementById('submit-btn');

  // Reset message
  messageEl.className = 'message hidden';

  // Validation
  if (!title) {
    showMessage(messageEl, 'error', 'Thread title is required.');
    return;
  }

  if (!content) {
    showMessage(messageEl, 'error', 'Thread content is required.');
    return;
  }

  // Disable button
  submitBtn.disabled = true;
  submitBtn.textContent = 'Publishing...';

  try {

    let mediaUrl = '';
    let mediaType = '';

    // =====================================
    // UPLOAD FILE
    // =====================================
    if (mediaFile) {

      const uploadedFile = await storage.createFile(
        BUCKET_ID,
        ID.unique(),
        mediaFile
      );

      mediaUrl =
        `https://fra.cloud.appwrite.io/v1/storage/buckets/${BUCKET_ID}/files/${uploadedFile.$id}/view?project=${PROJECT_ID}`;

      mediaType = mediaFile.type;
    }

    // =====================================
    // CREATE THREAD
    // =====================================
    const newThread = await databases.createDocument(
      DATABASE_ID,
      THREADS_COLLECTION_ID,
      ID.unique(),
      {
        title: title,
        content: content,
        mediaUrl: mediaUrl,
        mediaType: mediaType,
		replyCount: 0,
        authorName: currentUser.name,
        userId: currentUser.$id,
        createdAt: new Date().toISOString(),
		  	upVotes: 0,
			downVotes: 0,
			replyCount: 0
      },
      [
        Permission.read(Role.any()),
        Permission.update(Role.user(currentUser.$id)),
        Permission.delete(Role.user(currentUser.$id))
      ]
    );

    // Success
    showMessage(
      messageEl,
      'success',
      'Thread published successfully!'
    );

    // Redirect
    setTimeout(() => {
      window.location.href =
        `thread.html?id=${newThread.$id}`;
    }, 1000);

  } catch (error) {

    console.error(error);

    showMessage(
      messageEl,
      'error',
      'Failed to publish thread: ' + error.message
    );

    submitBtn.disabled = false;
    submitBtn.textContent = 'Publish Thread →';
  }
}

// =========================================
// SHOW MESSAGE
// =========================================
function showMessage(element, type, text) {

  element.className = `message ${type}`;
  element.textContent = text;

}
