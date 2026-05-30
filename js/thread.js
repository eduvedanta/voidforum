// =========================================
// thread.js - Thread Detail Page
// =========================================

let currentThreadId = null;
let currentUser = null;

// =========================================
// PAGE LOAD
// =========================================
document.addEventListener('DOMContentLoaded', async () => {

  const urlParams =
    new URLSearchParams(window.location.search);

  currentThreadId = urlParams.get('id');

  // No thread ID
  if (!currentThreadId) {

    window.location.href = 'forum.html';

    return;
  }

  // Current user
  currentUser = await getCurrentUser();

  updateNavbar(currentUser);

  // Initial load
  await loadThread();
  await loadReplies();

  // Show reply form
  showReplySection();

  // =====================================
  // REALTIME REPLY UPDATES
  // =====================================

  client.subscribe(
    `databases.${DATABASE_ID}.collections.${REPLIES_COLLECTION_ID}.documents`,
    (response) => {

      console.log(
        'Realtime reply update:',
        response
      );

      loadReplies();

    }
  );

});

// =========================================
// LOAD THREAD
// =========================================
async function loadThread() {

  const container =
    document.getElementById('thread-container');

  try {

    const thread =
      await databases.getDocument(
        DATABASE_ID,
        THREADS_COLLECTION_ID,
        currentThreadId
      );

    document.title =
      `${thread.title} — VOID FORUM`;

    container.innerHTML = `

      <div class="thread-detail">

        <div class="thread-detail-title">
          ${escapeHtml(thread.title)}
        </div>

        <div class="thread-detail-content">
          ${escapeHtml(thread.content || '')}
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
    onclick="voteCurrentThread(1)"
  >
    ▲ ${thread.upVotes || 0}
  </span>

  <span
    class="vote-down"
    onclick="voteCurrentThread(-1)"
  >
    ▼ ${thread.downVotes || 0}
  </span>

</div>

        <div class="thread-meta">

          <span
            class="author"
            style="
              color:${getProfileColor(thread.authorName)}
            "
          >
            ${escapeHtml(thread.authorName)}
          </span>

          <span>//</span>

          <span>
            ${formatDate(
              thread.createdAt ||
              thread.$createdAt
            )}
          </span>

          ${
            currentUser &&
            currentUser.$id === thread.userId
              ? `
                <button
                  class="delete-btn"
                  onclick="deleteThread()"
                >
                  Delete
                </button>
              `
              : ''
          }

        </div>

      </div>

    `;

  } catch (error) {

    console.error(
      'Error loading thread:',
      error
    );

    container.innerHTML = `
      <div class="message error">
        Failed to load thread:
        ${escapeHtml(error.message)}
      </div>
    `;
  }
}

// =========================================
// LOAD REPLIES
// =========================================
async function loadReplies() {

  const container =
    document.getElementById('replies-container');

  try {

    const response =
      await databases.listDocuments(
        DATABASE_ID,
        REPLIES_COLLECTION_ID,
        [
          Query.equal(
            'threadId',
            currentThreadId
          ),
          Query.orderAsc('createdAt'),
          Query.limit(100)
        ]
      );

    const replies =
      response.documents;

    const replyCount =
      document.getElementById('reply-count');

    if (replyCount) {
      replyCount.textContent =
        replies.length;
    }

    // Empty state
    if (replies.length === 0) {

      container.innerHTML = `
        <div
          class="empty-state"
          style="padding:30px 20px;"
        >
          <div style="
            font-size:10px;
            letter-spacing:2px;
            color:var(--text-muted);
          ">
            NO RESPONSES YET
          </div>
        </div>
      `;

      return;
    }

    // Render replies
    const repliesHtml =
      replies.map(reply => `

        <div class="reply-card">

          <div class="reply-author">

            <span style="
              color:${getProfileColor(reply.authorName)}
            ">
              ${escapeHtml(reply.authorName)}
            </span>

            <span class="time">
              ${formatDate(reply.createdAt)}
            </span>

            ${
              currentUser &&
              currentUser.$id === reply.userId
                ? `
                  <button
                    class="delete-btn"
                    onclick="deleteReply('${reply.$id}')"
                  >
                    Delete
                  </button>
                `
                : ''
            }

          </div>
		  <div class="vote-bar">

  <span
    class="vote-up"
    onclick="
      voteReply(
        '${reply.$id}',
        1
      )
    "
  >
    ▲ ${reply.upVotes || 0}
  </span>

  <span
    class="vote-down"
    onclick="
      voteReply(
        '${reply.$id}',
        -1
      )
    "
  >
    ▼ ${reply.downVotes || 0}
  </span>

</div>

          <div class="reply-content">
            ${escapeHtml(reply.content)}
          </div>

        </div>

      `).join('');

    container.innerHTML =
      repliesHtml;

  } catch (error) {

    console.error(
      'Error loading replies:',
      error
    );

    container.innerHTML = `
      <div class="message error">
        Failed to load replies:
        ${escapeHtml(error.message)}
      </div>
    `;
  }
}

// =========================================
// SHOW REPLY SECTION
// =========================================
function showReplySection() {

  const container =
    document.getElementById('reply-form-container');

  if (currentUser) {

    container.innerHTML = `

      <div class="reply-form-box">

        <h3>Post a Response</h3>

        <div
          id="reply-message"
          class="message hidden"
        ></div>

        <div class="form-group">

          <label for="reply-content">
            Your Response
          </label>

          <textarea
            id="reply-content"
            placeholder="Write your response..."
          ></textarea>

        </div>

        <button
          class="btn btn-primary"
          onclick="submitReply()"
        >
          Submit Response
        </button>

      </div>

    `;

  } else {

    container.innerHTML = `
      <div class="login-prompt">
        <a href="login.html">
          Login or create an account
        </a>
        to post a response
      </div>
    `;
  }
}

// =========================================
// SUBMIT REPLY
// =========================================
async function submitReply() {

  const content =
    document
      .getElementById('reply-content')
      .value
      .trim();

  const messageEl =
    document.getElementById('reply-message');

  if (!content) {

    showMessage(
      messageEl,
      'error',
      'Response cannot be empty.'
    );

    return;
  }

  try {

   // Create reply
await databases.createDocument(
  DATABASE_ID,
  REPLIES_COLLECTION_ID,
  ID.unique(),
  {
    threadId: currentThreadId,
    content: content,
    authorName: currentUser.name,
    userId: currentUser.$id,
    createdAt: new Date().toISOString(),
    upVotes: 0,
    downVotes: 0
  },
  [
    Permission.read(Role.any()),
    Permission.update(
      Role.user(currentUser.$id)
    ),
    Permission.delete(
      Role.user(currentUser.$id)
    )
  ]
);
    // =====================================
    // INCREMENT REPLY COUNT
    // =====================================

    const currentThread =
      await databases.getDocument(
        DATABASE_ID,
        THREADS_COLLECTION_ID,
        currentThreadId
      );

    await databases.updateDocument(
      DATABASE_ID,
      THREADS_COLLECTION_ID,
      currentThreadId,
      {
        replyCount:
          (currentThread.replyCount ?? 0) + 1
      }
    );
// =====================================
// CREATE NOTIFICATION
// =====================================

if (
  currentThread.userId !==
  currentUser.$id
) {

  await databases.createDocument(
    DATABASE_ID,
    NOTIFICATIONS_COLLECTION_ID,
    ID.unique(),
    {
      userId: currentThread.userId,

      message:
        `${currentUser.name} replied to your thread`,

      threadId: currentThreadId,

      isRead: false,

      createdAt:
        new Date().toISOString()
    },
   [
  Permission.read(
    Role.user(
      currentThread.userId
    )
  ),

  Permission.update(
    Role.user(
      currentThread.userId
    )
  ),

  Permission.delete(
    Role.user(
      currentThread.userId
    )
  )
]
  );

}

    // Clear textarea
    document.getElementById(
      'reply-content'
    ).value = '';

    // Reload replies
    await loadReplies();

    // Success
    showMessage(
      messageEl,
      'success',
      'Response posted!'
    );

  } catch (error) {

    console.error(error);

    showMessage(
      messageEl,
      'error',
      'Failed to post response.'
    );
  }
}

// =========================================
// DELETE THREAD
// =========================================
async function deleteThread() {

  const confirmDelete =
    confirm(
      'Delete this thread permanently?'
    );

  if (!confirmDelete) return;

  try {

    await databases.deleteDocument(
      DATABASE_ID,
      THREADS_COLLECTION_ID,
      currentThreadId
    );

    window.location.href =
      '/forum.html';

  } catch (error) {

    console.error(error);

    alert('Failed to delete thread.');

  }
}

// =========================================
// DELETE REPLY
// =========================================
async function deleteReply(replyId) {

  const confirmDelete =
    confirm(
      'Delete this response permanently?'
    );

  if (!confirmDelete) return;

  try {

    // Delete reply
    await databases.deleteDocument(
      DATABASE_ID,
      REPLIES_COLLECTION_ID,
      replyId
    );

    // =====================================
    // DECREMENT REPLY COUNT
    // =====================================

    const currentThread =
      await databases.getDocument(
        DATABASE_ID,
        THREADS_COLLECTION_ID,
        currentThreadId
      );

    await databases.updateDocument(
      DATABASE_ID,
      THREADS_COLLECTION_ID,
      currentThreadId,
      {
        replyCount:
          Math.max(
            (currentThread.replyCount ?? 1) - 1,
            0
          )
      }
    );

    // Reload replies
    await loadReplies();

  } catch (error) {

    console.error(error);

    alert('Failed to delete response.');

  }
}

// =========================================
// SHOW MESSAGE
// =========================================
function showMessage(element, type, text) {

  element.className =
    `message ${type}`;

  element.textContent =
    text;

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
      (
        (hash << 5) - hash
      );

  }

  return colors[
    Math.abs(hash) %
    colors.length
  ];

}

// =========================================
// FORMAT DATE
// =========================================
function formatDate(dateString) {

  const date =
    new Date(dateString);

  return date.toLocaleString();

}
async function voteCurrentThread(
  voteType
) {

  await vote(
    currentThreadId,
    'thread',
    voteType
  );

  loadThread();

}
async function voteReply(
  replyId,
  voteType
) {

  await vote(
    replyId,
    'reply',
    voteType
  );

  loadReplies();

}

