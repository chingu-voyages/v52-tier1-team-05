// controller.js

import { formatDate, loginAdminUISwitch, notyf } from './helpers';
import { optimizedValidateAddress } from './databaseUtility.js';

import * as model from './model';

import adminLoginModal from './views/adminLoginModal';
import newAptView from './views/newAptView';
import customerSlider from './views/customerSlider.js';
import { adminCredentials } from './config.js';

async function controlAppointmentFormSubmit(formData) {
  console.log('controlAppointmentFormSubmit running');
  try {
    // Save form data to localStorage for persistence
    localStorage.setItem('pendingAppointment', JSON.stringify(formData));

    // Show loading spinner or feedback to the user
    newAptView.renderSpinner(
      'Processing your appointment... Feel free to check out the rest of the page in the meantime!'
    );

    // 1) Fetch and validate the address
    const { streetAddress, zipCode } = formData;
    const isValidAddress = await optimizedValidateAddress(
      zipCode,
      streetAddress
    );

    if (!isValidAddress)
      throw new Error(
        'Your address could not be found in our database. Please try again and select a valid address from the suggestions pop-up!'
      );

    // 4) Process form submission (e.g., update database or state)
    model.AppState.addAppointment(formData);
    setTimeout(() => {
      loginAdminUISwitch(document.querySelector('.toggle-login-btn'));
      notyf.open({
        type: 'success',
        message: `Your appointment is confirmed for ${
          formData.aptTimeslot
        } on ${formatDate(formData.aptDate)} !`,
      });
    }, 7000);
    // 5) Render success message
  } catch (err) {
    console.error(err);
    notyf.error(`Could not create your appointment. ${err.message}.`);
  } finally {
    newAptView.cancelSpinner(); // Ensure the spinner is stopped in the finally block
    localStorage.removeItem('pendingAppointment');
    newAptView.handleToggleModal(); // Close modal window
  }
}

async function controlAdminLogin(formData) {
  try {
    // Show loading spinner or feedback to the user
    adminLoginModal.renderSpinner('Checking your credentials...');

    // Credentials check
    const credentialsGood =
      formData.username === adminCredentials.username &&
      formData.password === adminCredentials.password;

    if (!credentialsGood)
      notyf.error('Wrong username or password... please try again');

    // Success - make it current account
    model.AppState.currentAdminAccount = formData;
  } catch (error) {
  } finally {
    setTimeout(() => {
      adminLoginModal._form.reset();
      adminLoginModal.handleToggleModal(); // Close modal window
      adminLoginModal.cancelSpinner();
      notyf.success('Login successful!');
    }, 3000);

    // adminLoginModal._form.reset();
    // setTimeout;
    // adminLoginModal.handleToggleModal(); // Close modal window
  }

  // success message
}

async function init() {
  model.AppState.initializeState();

  // * check for pending requests and finish them
  if (model.AppState.pendingAppointmentObject)
    controlAppointmentFormSubmit(model.AppState.pendingAppointmentObject);

  newAptView.addHandlerSubmitForm(controlAppointmentFormSubmit);
  adminLoginModal.addHandlerSubmitForm(controlAdminLogin);
}

init();

// // ! testing sela's table
// function loadAppointments() {
//   console.log('running loadAppointments');
//   const tbody = document.getElementById('appointments-tbody');

//   const appointments = model.AppState.appointments;

//   console.log(appointments);
//   // .then(appointments => {
//   //   const tbody = document.getElementById('appointments-tbody');
//   //   tbody.innerHTML = ''; // Clear any existing content

//   appointments.forEach((appointment, index) => {
//     const row = document.createElement('tr');
//     row.innerHTML = `
//           <td>${appointment.fullName}</td>
//           <td>${appointment.streetAddress}</td>
//           <td>${appointment.aptDate}</td>
//           <td>${appointment.aptTimeslot}</td>
//           <td>${appointment.status}</td>
//           <td>
//             <button class="confirm" onclick="confirmAppointment(${index})">Confirm</button>
//             <button class="cancel" onclick="cancelAppointment(${index})">Cancel</button>
//           </td>
//         `;
//     tbody.appendChild(row);
//   });
// }

// // Load appointments when the page is loaded
// window.onload = loadAppointments;
