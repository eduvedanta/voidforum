// =========================================
// notifications.js
// =========================================

let currentUser = null;

document.addEventListener(
  'DOMContentLoaded',
  async () => {

    currentUser =
      await requireAuth();

    if (!currentUser) return;

    updateNavbar(currentUser);

    await loadNotifications();

  }
);

async function loadNotifications() {

  const container =
    document.getElementById(
      'notifications-container'
    );

  try {

    const response =
      await databases.listDocuments(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION_ID,
        [
          Query.equal(
            'userId',
            currentUser.$id
          ),
          Query.orderDesc(
            'createdAt'
          ),
          Query.limit(50)
        ]
      );

    const notifications =
  response.documents;

// Mark notifications as read
for (const notif of notifications) {

  if (!notif.isRead) {

    await databases.updateDocument(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      notif.$id,
      {
        isRead: true
      }
    );

  }

}

    if (
      notifications.length === 0
    ) {

      container.innerHTML = `
        <div class="empty-state">
          NO NOTIFICATIONS
        </div>
      `;

      return;
    }

    container.innerHTML =
      notifications.map(notif => `

        <div class="reply-card">

          <div class="reply-content">

            ${escapeHtml(
              notif.message
            )}

          </div>

          <div class="thread-card-meta">

            <span>
              ${formatDate(
                notif.createdAt
              )}
            </span>

            <span class="separator">
              //
            </span>

            <a
              href="/thread.html?id=${notif.threadId}"
              class="nav-link"
            >
              Open Thread
            </a>

          </div>

        </div>

      `).join('');

  } catch (error) {

    console.error(error);

    container.innerHTML = `
      <div class="message error">
        Failed to load notifications
      </div>
    `;
  }
}

function escapeHtml(text) {

  if (!text) return '';

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

}

function formatDate(dateString) {

  const date =
    new Date(dateString);

  return date.toLocaleString();

}
