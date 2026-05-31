// =========================================
// threads.js
// =========================================

// =========================================
// PAGE LOAD
// =========================================
document.addEventListener(
  'DOMContentLoaded',
  async () => {

    const user =
      await getCurrentUser();

    updateNavbar(user);

    await loadThreads();

    // REALTIME THREAD UPDATES
    client.subscribe(
      `databases.${DATABASE_ID}.collections.${THREADS_COLLECTION_ID}.documents`,
      () => {

        loadThreads();

      }
    );

  }
);

// =========================================
// LOAD THREADS
// =========================================
async function loadThreads() {

  const container =
    document.getElementById(
      'threads-container'
    );

  try {

    const response =
      await databases.listDocuments(
        DATABASE_ID,
        THREADS_COLLECTION_ID,
        [
          Query.orderDesc('$createdAt'),
          Query.limit(50)
        ]
      );

    const threads =
      response.documents;

    // Empty state
    if (threads.length === 0) {

      container.innerHTML = `

        <div class="empty-state">

          <div class="icon">
            📡
          </div>

          <div>
            NO TRANSMISSIONS FOUND
          </div>

        </div>

      `;

      return;
    }

    // Render threads
    container.innerHTML =
      threads
        .map(thread =>
          createThreadCard(thread)
        )
        .join('');

  } catch (error) {

    console.error(
      'Error loading threads:',
      error
    );

    container.innerHTML = `

      <div class="message error">
        Failed to load threads
      </div>

    `;
  }
}

// =========================================
// THREAD CARD
// =========================================
function createThreadCard(thread) {

  const content =
    thread.content || '';

  const preview =
    content.length > 150
      ? content.substring(0, 150) + '...'
      : content;

  return `

    <div
      class="thread-card"
      onclick="openThread('${thread.$id}')"
    >

      <div class="thread-card-title">
        ${escapeHtml(thread.title)}
      </div>

      <div class="thread-card-preview">
        ${escapeHtml(preview)}
      </div>

      ${
        thread.mediaUrl
          ? (
              thread.mediaType &&
              thread.mediaType.startsWith('image/')
            )
              ? `

                <img
                  src="${thread.mediaUrl}"
                  class="thread-media"
                />

              `
              : `

                <video
                  controls
                  class="thread-media"
                >

                  <source
                    src="${thread.mediaUrl}"
                    type="${thread.mediaType}"
                  />

                </video>

              `
          : ''
      }
      <div class="vote-bar">

  <span
    class="vote-up"
    onclick="
      event.stopPropagation();
      voteThread('${thread.$id}',1)
    "
  >
    ▲ ${thread.upVotes || 0}
  </span>

  <span
    class="vote-down"
    onclick="
      event.stopPropagation();
      voteThread('${thread.$id}',-1)
    "
  >
    ▼ ${thread.downVotes || 0}
  </span>

</div>

      <div class="thread-card-meta">

        <span
          class="author"
          style="
            color:${getProfileColor(
              thread.authorName
            )}
          "
        >

          ${escapeHtml(
            thread.authorName
          )}

        </span>

        <span class="separator">
          //
        </span>

        <span>

          ${formatDate(
            thread.createdAt ||
            thread.$createdAt
          )}

        </span>

        <span class="separator">
          //
        </span>

        <span class="reply-count">

          💬 ${thread.replyCount ?? 0}
          responses

        </span>

      </div>

    </div>

  `;
}

// =========================================
// OPEN THREAD
// =========================================
function openThread(threadId) {

  window.location.href =
    `thread.html?id=${threadId}`;

}

// =========================================
// ESCAPE HTML
// =========================================
function escapeHtml(text) {

  if (!text) return '';

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

}

// =========================================
// FORMAT DATE
// =========================================
function formatDate(dateString) {

  const date =
    new Date(dateString);

  return date.toLocaleString();

}

// =========================================
// PROFILE COLOR
// =========================================
function getProfileColor(username) {

  const colors = [
    '#ff4d6d',
    '#7b61ff',
    '#00d4ff',
    '#00ff99',
    '#ffd166',
    '#ff9f1c',
    '#f72585',
    '#4cc9f0'
  ];

  let hash = 0;

  for (
    let i = 0;
    i < username.length;
    i++
  ) {

    hash =
      username.charCodeAt(i) +
      ((hash << 5) - hash);

  }

  return colors[
    Math.abs(hash) %
    colors.length
  ];

}
async function voteThread(
  threadId,
  voteType
) {

  try {

    await vote(
      threadId,
      'thread',
      voteType
    );

    loadThreads();

  } catch(error) {

    console.error(error);

  }

}
// =========================================
// UPDATE ACTIVE USER
// =========================================
async function updateActiveUser(user) {

  if (!user) return;

  try {

    const existing =
      await databases.listDocuments(
        DATABASE_ID,
        ACTIVE_USERS_COLLECTION_ID,
        [
          Query.equal(
            'userId',
            user.$id
          )
        ]
      );

    // User already exists
    if (
      existing.documents.length > 0
    ) {

      await databases.updateDocument(
        DATABASE_ID,
        ACTIVE_USERS_COLLECTION_ID,
        existing.documents[0].$id,
        {
          lastSeen:
            new Date().toISOString()
        }
      );

    }

    // First visit
    else {

      await databases.createDocument(
        DATABASE_ID,
        ACTIVE_USERS_COLLECTION_ID,
        ID.unique(),
        {
          userId: user.$id,
          username: user.name,
          lastSeen:
            new Date().toISOString()
        }
      );

    }

  } catch(error) {

    console.error(
      'Active user error:',
      error
    );

  }

}
