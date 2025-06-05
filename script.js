const toggleBtn = document.getElementById('darkModeToggle');
const greeting = document.getElementById('greeting');
const newsletterModal = document.getElementById('newsletterModal');
const emailInput = document.getElementById("modalEmailInput");

// Load dark mode from localStorage
if (localStorage.getItem('darkMode') === 'enabled') {
  document.body.classList.add('dark-mode');
  toggleBtn.textContent = '☀️';
}

// Dark mode toggle
toggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const darkEnabled = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', darkEnabled ? 'enabled' : 'disabled');
  toggleBtn.textContent = darkEnabled ? '☀️' : '🌙';
});

// Time-based greeting
const hour = new Date().getHours();
greeting.textContent =
  hour < 12 ? "🌅 Good morning!" :
  hour < 18 ? "☀️ Good afternoon!" :
  "🌙 Good evening!";

// Modal control
function openNewsletterModal() {
  newsletterModal.style.display = "flex";
}

function closeNewsletterModal() {
  newsletterModal.style.display = "none";
}

function handleSubscribe(e) {
  e.preventDefault();
  const email = emailInput.value;
  if (email) {
    alert(`🎉 Thanks for subscribing, ${email}`);
    emailInput.value = "";
    closeNewsletterModal();
  }
}
//news letter form model
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("newsletterForm");
  const emailInput = document.getElementById("newsletterEmail");
  const messageEl = document.getElementById("formMessage");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(form);
    const email = formData.get("email");

    messageEl.textContent = "Submitting...";
    messageEl.classList.remove("error");

    try {
      const response = await fetch("https://formspree.io/f/YOUR_FORM_ID", {
        method: "POST",
        headers: {
          Accept: "application/json"
        },
        body: formData
      });

      if (response.ok) {
        messageEl.textContent = "🎉 Thanks for subscribing!";
        form.reset();
      } else {
        const data = await response.json();
        if (data.errors) {
          messageEl.textContent = data.errors.map(err => err.message).join(", ");
        } else {
          messageEl.textContent = "Something went wrong. Please try again.";
        }
        messageEl.classList.add("error");
      }
    } catch (err) {
      messageEl.textContent = "Network error. Please try again.";
      messageEl.classList.add("error");
    }
  });
});

