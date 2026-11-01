import {
  requireAuth,
  getUserProfile,
  updateAccountName,
  sendPasswordReset,
  authErrorMessage,
  formatTaka
} from "../firebase.js";

const user = await requireAuth();

if (user) {
  init(user);
}

function init(user) {
  const form = document.getElementById("profileForm");
  const nameInput = document.getElementById("profileName");
  const emailInput = document.getElementById("profileEmailInput");
  const displayName = document.getElementById("profileDisplayName");
  const emailLabel = document.getElementById("profileEmail");
  const avatar = document.getElementById("profileAvatar");
  const saveButton = document.getElementById("saveProfileButton");
  const profileMessage = document.getElementById("profileMessage");
  const resetButton = document.getElementById("resetPasswordButton");
  const securityMessage = document.getElementById("securityMessage");

  function setMessage(element, text, type = "") {
    element.textContent = text;
    element.className = `profile-message${type ? ` is-${type}` : ""}`;
  }

  function initials(name) {
    return String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "U";
  }

  function renderProfile(profile) {
    const name = profile?.name || user.displayName || user.email?.split("@")[0] || "HomeMate member";
    const email = user.email || profile?.email || "";
    nameInput.value = name;
    emailInput.value = email;
    displayName.textContent = name;
    emailLabel.textContent = email;
    avatar.textContent = initials(name);
    document.getElementById("profileBudget").textContent = formatTaka(profile?.monthlyBudget || 0);

    const createdAt = profile?.createdAt;
    const createdDate = typeof createdAt?.toDate === "function"
      ? createdAt.toDate()
      : createdAt
        ? new Date(createdAt)
        : user.metadata.creationTime
          ? new Date(user.metadata.creationTime)
          : null;
    document.getElementById("profileCreated").textContent = createdDate && !Number.isNaN(createdDate.getTime())
      ? new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(createdDate)
      : "—";
  }

  getUserProfile()
    .then(renderProfile)
    .catch((error) => {
      console.error(error);
      setMessage(profileMessage, "Could not load your profile. Please refresh the page.", "error");
      renderProfile(null);
    });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    if (!name) {
      setMessage(profileMessage, "Please enter your display name.", "error");
      nameInput.focus();
      return;
    }

    saveButton.disabled = true;
    setMessage(profileMessage, "");
    try {
      await updateAccountName(name);
      displayName.textContent = name;
      avatar.textContent = initials(name);
      setMessage(profileMessage, "Your profile has been updated.", "success");
    } catch (error) {
      console.error(error);
      setMessage(profileMessage, authErrorMessage(error), "error");
    } finally {
      saveButton.disabled = false;
    }
  });

  resetButton.addEventListener("click", async () => {
    resetButton.disabled = true;
    setMessage(securityMessage, "");
    try {
      if (!user.email) throw new Error("Your account does not have an email address.");
      await sendPasswordReset(user.email);
      setMessage(securityMessage, `Password reset instructions sent to ${user.email}.`, "success");
    } catch (error) {
      console.error(error);
      setMessage(securityMessage, authErrorMessage(error), "error");
    } finally {
      resetButton.disabled = false;
    }
  });
}
