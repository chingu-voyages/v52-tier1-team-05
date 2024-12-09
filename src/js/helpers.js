// helpers.js

import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';
import { AppState } from './model';

// Example of saving generated appointments to localStorage
export function saveAppointmentsToLocalStorage(appointmentsArray = null) {
  if (appointmentsArray)
    localStorage.setItem('appointments', JSON.stringify(appointmentsArray));
  else {
    const appointments = generateMockAppointments();
    localStorage.setItem('appointments', JSON.stringify(appointments));
  }
}

export function addAppointmentToLocalStorage(newAppointment) {
  // Step 1: Retrieve the current appointments from localStorage (if any)
  let appointments = JSON.parse(localStorage.getItem('appointments')) || [];

  // Normalize input: trim spaces, convert to lowercase for comparison
  const normalizeText = text => (text ? text.trim().toLowerCase() : '');

  // Step 2: Make sure it isn't a duplicate (criteria: fullName and streetAddress are the same)
  const isDuplicate = appointments?.some(
    apt =>
      normalizeText(apt.fullName) === normalizeText(newAppointment.fullName) &&
      normalizeText(apt.streetAddress) ===
        normalizeText(newAppointment.streetAddress) &&
      apt.zipCode === newAppointment.zipCode
  );

  console.log('isDuplicate:', isDuplicate);

  // * improvement to implement: show the previous appointment screen (or a link to cancel it)!
  if (isDuplicate)
    throw new Error(
      "You've already made an appointment with us! Please cancel it before we can book a new one for you!"
    );

  console.log('adding to local storage (success)');
  // Step 3: Add the new appointment to the array
  appointments.push(newAppointment);

  // Step 3: Store the updated array back into localStorage
  localStorage.setItem('appointments', JSON.stringify(appointments));
}
export function currentPendingAppointmentRequest() {
  try {
    // Check for any pending appointment submission
    const pendingAppointment = localStorage.getItem('pendingAppointment');
    if (!pendingAppointment) return false;

    const formData = JSON.parse(pendingAppointment);

    // Show spinner and retry processing
    notyf.open({
      type: 'warning',
      message: 'Resuming your previous appointment request...',
    });

    return formData;
  } catch (err) {
    console.error('Error resuming pending appointment:', err);
  } finally {
    localStorage.removeItem('pendingAppointment'); // Clean up if there's an issue
  }
}

export function loginAdminHeaderSwitch(headerElement) {
  console.log('loginAdminHeaderSwitch running');
  if (!AppState.currentAdminAccount)
    throw new Error("account couldn't be found in AppState");
  else {
    // Remove the "Sign up" button
    const signUpButton = document.querySelector('.cta-btn');
    if (signUpButton) signUpButton.remove();

    // Update button text
    headerElement.textContent = `${
      AppState.currentAdminAccount.username[0].toUpperCase() +
      AppState.currentAdminAccount.username.slice(1)
    } logged in`;

    // Update styles
    headerElement.style.color = 'var(--color-secondary)';
    headerElement.style.cursor = 'not-allowed';
    headerElement.style.pointerEvents = 'none';

    // Disable its parent container if needed
    const toggleLoginContainer = headerElement.closest('.toggle-login-btn');
    if (toggleLoginContainer) {
      toggleLoginContainer.style.pointerEvents = 'none';
    }
  }
}

export function loginAdminUISwitch(sectionsToHide) {
  // first add hiddenSection class to all
  sectionsToHide.forEach(section => section.classList.add('hideSection'));
  const adminSectionElement = document.querySelector('.admin-section');
  // then remove it from the adminSection
  adminSectionElement.classList.remove('hideSection');
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  }).format(new Date(date));
}

// * notifications
export const notyf = new Notyf({
  duration: 5000,
  position: {
    x: 'center',
    y: 'top',
  },
  types: [
    {
      type: 'warning',
      background: 'orange',
      icon: {
        className: 'material-icons',
        tagName: 'i',
        text: 'warning',
      },
    },
    {
      type: 'success',
      background: 'green',
      duration: 3000,
      dismissible: true,
    },
    {
      type: 'error',
      background: 'indianred',
      duration: 7000,
      dismissible: true,
    },
    {
      type: 'confirmation',
      background: 'green',
      duration: 8000, // Longer duration for confirmation
      dismissible: false,
      message:
        "Appointment Successfully booked! Confirmation email is on it's way!",
      icon: {
        className: 'material-icons',
        tagName: 'i',
        text: 'check_circle',
      },

      className: 'notyf-confirmation',
    },
  ],
});
