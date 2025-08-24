// Initialize Supabase client
const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";  // Replace with your Supabase project URL
const SUPABASE_KEY = "YOUR_PUBLIC_ANON_KEY"; // Replace with your Supabase anon/public API key
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =================== LANGUAGE TOGGLE ===================
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

// =================== LOGIN ===================
async function loginUser() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    alert("Please enter username and password");
    return;
  }

  // Check user in Supabase
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .eq("password", password)  // NOTE: plain text for demo, not secure!
    .single();

  if (error || !data) {
    alert("Invalid credentials");
  } else {
    alert("Login successful!");
    localStorage.setItem("currentUser", JSON.stringify(data));
    window.location.href = "home.html";
  }
}

// =================== REGISTER ===================
async function registerUser() {
  const username = document.getElementById("newUsername").value.trim();
  const password = document.getElementById("newPassword").value.trim();

  if (!username || !password) {
    alert("Please enter username and password");
    return;
  }

  // Insert into Supabase
  const { data, error } = await supabase
    .from("users")
    .insert([{ username, password }]);

  if (error) {
    alert("Error registering: " + error.message);
  } else {
    alert("Registration successful!");
    window.location.href = "index.html";
  }
}

// =================== LOGOUT ===================
function logoutUser() {
  localStorage.removeItem("currentUser");
  alert("Logged out");
  window.location.href = "index.html";
}
