// controller.js

import {
  formatDate,
  loginAdminUISwitch,
  loginAdminHeaderSwitch,
  notyf,
  saveAppointmentsToLocalStorage,
} from './helpers';
import { optimizedValidateAddress } from './databaseUtility.js';

import * as model from './model';

import adminLoginModal from './views/adminLoginModal';
import newAptView from './views/newAptView';
import appointmentsView from './views/appointmentsView.js';
import customerSlider from './views/customerSlider.js';

import { adminCredentials } from './config.js';

// ! weird stuff going on on submit - with the spinner especially
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

    if (!isValidAddress) {
      throw new Error(
        'Your address could not be found in our database. Please try again and select a valid address from the suggestions pop-up!'
      );
    }

    // ! address is valid
    // 4) Process form submission (e.g., update database or state)
    model.AppState.addAppointment(formData);
    localStorage.removeItem('pendingAppointment');

    setTimeout(() => {
      notyf.open({
        type: 'success',
        message: `Your appointment is confirmed for ${
          formData.aptTimeslot
        } on ${formatDate(formData.aptDate)} !`,
      });
    }, 3000);
    // 5) Render success message
  } catch (err) {
    console.error(err.message || err);
    notyf.error(`Could not create your appointment. ${err.message}.`);
  } finally {
    localStorage.removeItem('pendingAppointment');
    newAptView.cancelSpinner(); // Ensure the spinner is stopped in the finally block
    newAptView.handleToggleModal(); // Close modal window
    newAptView._form.reset();
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
    model.AppState.currentAdminAccount = formData;
  } catch (error) {
    console.error(error.message || err);
  } finally {
    adminLoginModal._form.reset(); // reset form
  }
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

  // newAptView._addSubmitEditHandler();
}

init();
