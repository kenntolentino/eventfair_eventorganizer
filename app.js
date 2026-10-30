function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("hidden");
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("hidden");
}

function fillForm(formId, encoded) {
  const form = document.getElementById(formId);
  if (!form) return;
  const data = JSON.parse(decodeURIComponent(encoded));
  for (const [key, value] of Object.entries(data)) {
    const field = form.elements.namedItem(key);
    if (!field || field.type === "file") continue;
    if (field.type === "checkbox") {
      field.checked = value === true || value === "true";
    } else if (value !== undefined && value !== null) {
      field.value = typeof value === "boolean" ? String(value) : value;
    }
  }
  setContestantImagePreview(form, data.imageUrl);
}

function openEdit(modalId, formId, encoded, action) {
  const form = document.getElementById(formId);
  if (form && action) form.setAttribute("action", action);
  const imageInput = form?.querySelector('input[type="file"][name="image"]');
  if (imageInput) imageInput.value = "";
  fillForm(formId, encoded);
  openModal(modalId);
}

function setContestantImagePreview(form, imageUrl) {
  const preview = form.querySelector("[data-contestant-image-preview]");
  const placeholder = form.querySelector("[data-contestant-image-placeholder]");
  if (!preview || !placeholder) return;

  if (imageUrl) {
    preview.src = imageUrl;
    preview.classList.remove("hidden");
    placeholder.classList.add("hidden");
  } else {
    preview.removeAttribute("src");
    preview.classList.add("hidden");
    placeholder.classList.remove("hidden");
  }
}

function previewContestantImage(input) {
  const form = input.closest("form");
  const preview = form?.querySelector("[data-contestant-image-preview]");
  const placeholder = form?.querySelector("[data-contestant-image-placeholder]");
  const file = input.files?.[0];
  if (!preview || !placeholder || !file) return;

  const objectUrl = URL.createObjectURL(file);
  preview.onload = () => URL.revokeObjectURL(objectUrl);
  preview.src = objectUrl;
  preview.classList.remove("hidden");
  placeholder.classList.add("hidden");
}

function openDelete(modalId, formId, action, encodedLabel) {
  const form = document.getElementById(formId);
  const message = document.getElementById("deleteModalMessage");
  const title = document.getElementById("deleteModalTitle");
  const submitButton = form?.querySelector('button[type="submit"]');
  if (!form || !message) return;
  const label = JSON.parse(decodeURIComponent(encodedLabel));
  const archiveAction = /^\/admin\/(?:users|events|settings|homepage\/videos)\//.test(action);
  form.setAttribute("action", action);
  if (title) title.textContent = archiveAction ? "Move this record to the archive?" : "Delete this record?";
  message.textContent = archiveAction
    ? `Move "${label}" to the archive? You can restore it later.`
    : `Delete "${label}"? This action cannot be undone.`;
  if (submitButton) submitButton.textContent = archiveAction ? "Move to archive" : "Delete record";
  openModal(modalId);
}

function openConfirmAction(modalId, formId, action, encodedLabel, actionName) {
  const form = document.getElementById(formId);
  const message = document.getElementById("confirmActionMessage");
  const button = document.getElementById("confirmActionButton");
  if (!form || !message || !button) return;
  const label = JSON.parse(decodeURIComponent(encodedLabel));
  form.setAttribute("action", action);
  message.textContent = `Confirm ${actionName} for "${label}"?`;
  button.textContent = actionName;
  openModal(modalId);
}

function confirmDelete(formId) {
  const form = document.getElementById(formId);
  if (form) form.submit();
}

function toggleSidebar(id, overlayId = "sidebarOverlay") {
  const sidebar = document.getElementById(id);
  const overlay = document.getElementById(overlayId);
  if (!sidebar || !overlay) return;
  sidebar.classList.toggle("hidden");
  overlay.classList.toggle("hidden");
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-password-toggle]");
  if (!button) return;

  const field = button.closest("[data-password-field]");
  const input = field?.querySelector('input[type="password"], input[type="text"]');
  if (!input) return;

  const isVisible = input.type === "password";
  input.type = isVisible ? "text" : "password";
  button.setAttribute("aria-label", isVisible ? "Hide password" : "Show password");
  button.setAttribute("aria-pressed", String(isVisible));
  field.querySelector("[data-password-eye]")?.classList.toggle("hidden", isVisible);
  field.querySelector("[data-password-eye-off]")?.classList.toggle("hidden", !isVisible);
});

document.querySelectorAll("[data-section-order]").forEach((section) => {
  const order = Number(section.dataset.sectionOrder);
  if (Number.isInteger(order) && order >= 1 && order <= 3) {
    section.style.order = String(order);
  }
});

document.querySelectorAll("[data-chart-width]").forEach((bar) => {
  const width = Number(bar.dataset.chartWidth);
  if (Number.isFinite(width)) {
    bar.style.width = `${Math.min(100, Math.max(0, width))}%`;
  }
});

document.querySelectorAll("[data-chart-height]").forEach((bar) => {
  const height = Number(bar.dataset.chartHeight);
  if (Number.isFinite(height)) {
    bar.style.height = `${Math.min(100, Math.max(0, height))}%`;
  }
});

window.openModal = openModal;
window.closeModal = closeModal;
window.openEdit = openEdit;
window.previewContestantImage = previewContestantImage;
window.openDelete = openDelete;
window.openConfirmAction = openConfirmAction;
window.confirmDelete = confirmDelete;
window.toggleSidebar = toggleSidebar;
