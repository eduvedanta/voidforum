// =========================================
// auth.js
// =========================================

async function logIn(email, password) {

  try {

    await account.createEmailPasswordSession(
      email,
      password
    );

    return true;

  } catch (error) {

    console.error(error);

    return false;

  }
}

async function register(
  name,
  email,
  password
) {

  try {

    await account.create(
      ID.unique(),
      email,
      password,
      name
    );

    await logIn(email, password);

    return true;

  } catch (error) {

    console.error(error);

    return false;

  }
}

async function logout() {

  try {

    await account.deleteSession('current');

    window.location.href = 'index.html';

  } catch (error) {

    console.error(error);

  }
}

async function getCurrentUser() {

  try {

    return await account.get();

  } catch {

    return null;

  }
}

async function requireAuth() {

  const user =
    await getCurrentUser();

  if (!user) {

    window.location.href =
      '/login.html';

    return null;
  }

  return user;
}

function updateNavbar(user) {

  const navRight =
    document.getElementById(
      'nav-right'
    );

  if (!navRight) return;

  if (!user) {

    navRight.innerHTML = `

      <a
        href="login.html"
        class="btn btn-outline"
      >
        Login
      </a>

    `;

    return;
  }

  navRight.innerHTML = `

    <a
      href="forum.html"
      class="nav-link"
    >
      Forum
    </a>

    <a
      href="notifications.html"
      class="nav-link notification-link"
    >
      ⬢

      <span
        id="notification-count"
        class="notification-count"
        style="display:none;"
      >
        0
      </span>

    </a>

    <span
  class="nav-user"
  style="color:#00d4ff;"
>
  ${user.name}
</span>

    <button
      class="btn btn-outline"
      onclick="logout()"
    >
      Logout
    </button>

  `;

  loadNotificationCount();

}

async function loadNotificationCount() {

  try {

    const user =
      await getCurrentUser();

    if (!user) return;

    const response =
      await databases.listDocuments(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION_ID,
        [
          Query.equal(
            'userId',
            user.$id
          ),
          Query.equal(
            'isRead',
            false
          ),
          Query.limit(100)
        ]
      );

    const count =
      response.total;

    const counter =
      document.getElementById(
        'notification-count'
      );

    if (!counter) return;

    counter.textContent =
      count;

    counter.style.display =
      count > 0
        ? 'inline-flex'
        : 'none';

  } catch (error) {

    console.error(
      'Notification counter error:',
      error
    );

  }
}
async function handleForgotPassword(){

const email =
document.getElementById(
'login-email'
).value.trim();

if(!email){

```
alert(
  'Enter your email first.'
);

return;
```

}

try{

```
await account.createRecovery(
  email,
  'https://voidforum.vf.xo.je/reset.html'
);

alert(
  'Password reset link sent to your email.'
);
```

}catch(err){

```
console.error(err);

alert(
  err.message ||
  'Failed to send reset email.'
);
```

}

}

