// controller.js

import {
  formatDate,
  loginAdminUISwitch,
  loginAdminHeaderSwitch,
  notyf,
  saveAppointmentsToLocalStorage,
  reverseLoginLogic,
  reverseLoginAdminHeaderSwitch,
  reverseLoginAdminUISwitch,
} from './helpers';
import { optimizedValidateAddress } from './databaseUtility.js';
import html2pdf from 'html2pdf.js';

import * as model from './model';

import adminLoginModal from './views/adminLoginModal';
import newAptView from './views/newAptView';
import appointmentsView from './views/appointmentsView.js';
import customerSlider from './views/customerSlider.js';

import { adminCredentials } from './config.js';

// ! weird stuff going on on submit - with the spinner especially
async function controlAppointmentFormSubmit(formData) {
  console.log('controlAppointmentFormSubmit running');
  let err; // Declare a variable to store error if it occurs
  try {
    // Save form data to localStorage for persistence
    localStorage.setItem('pendingAppointment', JSON.stringify(formData));

    // Show loading spinner or feedback to the user
    newAptView.renderSpinner(
      'Processing your appointment... Feel free to check out the rest of the page in the meantime!'
    );

    // Dynamically add "Processing appointment" to the header nav list
    const processingNavItem = document.createElement('li');
    processingNavItem.classList.add('header-nav-item');
    processingNavItem.id = 'processing-appointment';
    processingNavItem.innerHTML =
      '<span>Appointment is being processed...</span>';
    document.querySelector('.header-nav-list').appendChild(processingNavItem);

    // 1) Fetch and validate the address
    const { streetAddress, zipCode } = formData;
    const isValidAddress = await optimizedValidateAddress(
      zipCode,
      streetAddress
    );

    if (!isValidAddress) {
      throw new Error(
        'Your address could not be found in our database. Please try again and select a valid address from the suggestions pop-up!'
      );
    }

    // Address is valid, proceed to add the appointment
    model.AppState.addAppointment(formData);

    // Remove pending appointment from localStorage
    model.AppState.clearPendingAppointment();

    // Render success message after the appointment is confirmed
    notyf.open({
      type: 'confirmation',
      message: `Your appointment is confirmed for ${formData.aptTimeslot
        } on ${formatDate(formData.aptDate)}!`,
    });
  } catch (error) {
    err = error; // Assign error to the err variable
    console.error(err.message || err);
    notyf.error(`Could not create your appointment. ${err.message}.`);
  } finally {
    // Cleanup: Remove pendingAppointment from localStorage, cancel spinner, and reset form
    model.AppState.clearPendingAppointment();
    newAptView.cancelSpinner();
    newAptView._form.reset();

    // Remove the "Processing appointment" message
    const processingNavItem = document.getElementById('processing-appointment');
    if (processingNavItem) {
      processingNavItem.remove();
    }

    // Close modal window if no error occurred
    if (!err) {
      newAptView.handleToggleModal(); // Close modal window
    }
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

    if (credentialsGood) {
      setTimeout(() => {
        loginAdminHeaderSwitch(document.querySelector('.toggle-login-btn a')); // header switch
        loginAdminUISwitch(document.querySelectorAll('section')); // content / UI switch
        adminLoginModal.handleToggleModal(); // Close modal window
        adminLoginModal.cancelSpinner();
        notyf.success('Login successful!');
      }, 1000);
    } else {
      adminLoginModal.cancelSpinner();
      notyf.error('Wrong username or password... please try again');
    }
    // Success - make it current account
    model.AppState.setAdminAccount(formData);
  } catch (error) {
    console.error(error.message || err);
  } finally {
    adminLoginModal._form.reset(); // reset form
  }
}
function controlAdminLogout() {
  const isLogoutConfirmed = window.confirm(
    'Are you sure you want to log out of your admin account?'
  );
  if (!isLogoutConfirmed) return notyf.error('Log out cancelled by the admin');
  // Reset the login state (Hide admin login UI and show the login button)
  reverseLoginAdminHeaderSwitch(document.querySelector('.toggle-login-btn a')); // Reset header to "Admin Login"
  reverseLoginAdminUISwitch(document.querySelectorAll('section')); // Reset content/UI

  // Optionally, clear out current admin account info
  model.AppState.clearAdminAccount();

  // Reset form
  adminLoginModal._form.reset(); // Reset the login form
  adminLoginModal.cancelSpinner(); // Hide the spinner if it's visible

  // Ensure the "Processing" state is removed
  const processingNavItem = document.getElementById('processing-appointment');
  if (processingNavItem) {
    processingNavItem.remove();
  }

  notyf.success('Successfully logged out');
}

// modify appointment
// modify appointment
async function controlModifyAppointment(appointmentId) {
  try {
    // Retrieve the existing appointment data from the model
    const appointment = model.AppState.appointments.find(
      appt => appt.id === appointmentId
    );

    if (!appointment) {
      throw new Error('Appointment not found.');
    }

    // Open the appointment modification form with the current data
    appointmentsView.renderEditForm(appointment);

    // Ensure the form has finished editing before we continue
    const updatedAppointment = await newAptView.getUpdatedFormData();
    if (!updatedAppointment) {
      throw new Error('Failed to retrieve updated appointment data.');
    }

    // Modify the appointment in the model
    model.AppState.modifyAppointment(appointmentId, updatedAppointment);

    // Update appointments view
    appointmentsView.displayAppointments();

    console.log('Editing finished. Appointment updated in the state.');

    // Display success message
    notyf.success('Appointment successfully updated!');

    // Optionally, close the form/modal
    appointmentsView.handleToggleModal();
    console.log('controlModifyAppointment ending...');
  } catch (err) {
    console.error(err);
    notyf.error(`Failed to modify the appointment. ${err.message}`);
  } finally {
    // Ensure the form/modal is closed
    appointmentsView.handleToggleModal();
  }
}

// cancel appointment
async function controlCancelAppointment(appointmentId) {
  try {
    // Retrieve the existing appointment data from the model
    const appointment = model.AppState.appointments.find(
      appt => appt.id === appointmentId
    );

    if (!appointment) {
      throw new Error('Appointment not found.');
    }

    // Confirm cancellation
    const confirmCancel = window.confirm(
      'Are you sure you want to cancel this appointment?'
    );
    if (!confirmCancel) return;

    // Cancel the appointment in the model
    model.AppState.cancelAppointment(appointmentId);

    // Display a success message
    notyf.success('Appointment successfully cancelled!');

    // Refresh the appointment list
    appointmentsView.displayAppointments();
  } catch (err) {
    console.error(err);
    notyf.error(`Failed to cancel the appointment. ${err.message}`);
  }
}

async function init() {
  model.AppState.initializeState();

  // * check for pending requests and finish them
  if (model.AppState.pendingAppointmentObject)
    controlAppointmentFormSubmit(model.AppState.pendingAppointmentObject);

  newAptView.addHandlerSubmitForm(controlAppointmentFormSubmit);
  adminLoginModal.addHandlerSubmitForm(controlAdminLogin);

  //* Add event listener for action buttons (modify/cancel)
  appointmentsView.addHandlerActionButton((button, appointmentId) => {
    if (button.classList.contains('modify-button')) {
      controlModifyAppointment(appointmentId);
    } else if (button.classList.contains('cancel-button')) {
      controlCancelAppointment(appointmentId);
    }
  });
}

init();

// ! Attach event listener to the home button
document.querySelector('.home-btn').addEventListener('click', () => {
  if (model.AppState.currentAdminAccount) {
    controlAdminLogout();
  }
});


// Export to PDF
function exportTableToPDF() {
  const element = document.getElementById('appointments-table');
  const options = {
    margin: 1,
    filename: 'appointments.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 4 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
  };


  html2pdf().from(element).set(options).save();

}
document.getElementById('export-btn').addEventListener('click', exportTableToPDF);



