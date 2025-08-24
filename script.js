// ==================== Auth JS (frontend) ====================

// ✅ Language Modal Functions
function openLanguageModal() {
  document.getElementById('languageModal').style.display = 'block';
}

function closeLanguageModal() {
  document.getElementById('languageModal').style.display = 'none';
}

function selectLanguage(language) {
  document.querySelector('.language-toggle').innerHTML = language + ' &#x25BC;';
  closeLanguageModal();
}

// ==================== Login Function ====================
async function loginUser() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    alert("Please fill in all fields.");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/save-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!data.success) {
      alert("Invalid credentials or server error");
      return;
    }

    // Save logged-in user locally
    localStorage.setItem("loggedInUser", username);
    alert("Login successful");
    window.location.href = "home.html";
  } catch (err) {
    console.error("Login error:", err);
    alert("Login failed. Check console for details.");
  }
}

// ==================== Register Function ====================
async function registerUser() {
  const username = document.getElementById("newUsername").value.trim();
  const password = document.getElementById("newPassword").value.trim();

  if (!username || !password) {
    alert("Please fill in all fields.");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/save-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!data.success) {
      alert("Registration failed: " + (data.error || ""));
      return;
    }

    alert("Registration successful");
    window.location.href = "index.html";
  } catch (err) {
    console.error("Registration error:", err);
    alert("Registration failed. Check console for details.");
  }
}

// ==================== Logout Function ====================
function logoutUser() {
  localStorage.removeItem("loggedInUser");
  alert("Logged out");
  window.location.href = "index.html";
}

// ==================== Check if user is logged in ====================
function checkLoggedIn() {
  const user = localStorage.getItem("loggedInUser");
  if (!user) {
    window.location.href = "index.html";
  }
}
