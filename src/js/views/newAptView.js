import JustValidate from 'just-validate';
import { debounce, searchAddress } from '../databaseUtility.js';
import { notyf } from '../helpers';
import ModalView from './ModalView';
import * as model from '../model.js';

class NewAptView extends ModalView {
  _form = document.querySelector('.newAppointmentForm');
  _formOverlay = document.querySelector('.form-overlay');
  _errorMessages = document.querySelectorAll('.error-message');
  _toggleFormButton = document.querySelector('.cta-btn');
  _submitButton = document.querySelector('.form-submit-btn');
  _cancelButton = document.querySelector('.form-cancel-btn');
  _spinnerDiv = document.querySelector('.spinner-div');
  _spinner = document.querySelector('.spinner');
  _validator;
  _addressInput = document.getElementById('streetAddress');
  _suggestionsContainer = document.getElementById('suggestions');
  _zipCodeEL = document.getElementById('zipCode');
  _currentQuery = ''; // Store the current query to avoid race conditions
  _fullNameEl = document.getElementById('fullName');
  _id; // Store the ID for the editing session
  _emailEl = document.getElementById('email');
  _streetAddressEl = document.getElementById('streetAddress');
  _zipCodeEl = document.getElementById('zipCode');
  _secondLineAddressEl = document.getElementById('secondLineAddress');
  _aptDateEl = document.getElementById('aptDate');
  _aptTimeslotEl = document.getElementById('aptTimeslot');
  _editingSessionFinished = null;

  constructor() {
    super(
      '.newAppointmentForm',
      '.form-overlay',
      '.cta-btn',
      'form-submit-btn'
    ); // Pass selectors to parent class

    // Initialize validation and event listeners
    this._initValidation();
    this._initAddressSuggestions();
  }

  _handleCancel() {
    this._clear(); // Clear the form state
    localStorage.removeItem('pendingAppointment'); // Remove pending appointment data
    this._form.reset(); // Reset the form
    this.cancelSpinner(); // Hide spinner if displayed
    notyf.open({
      type: 'warning',
      message: 'Your appointment request was canceled',
    });
    this.handleToggleModal(); // Close modal window if needed
  }

  renderSpinner(message = '') {
    // Hide form elements while keeping them in the DOM
    this._form
      .querySelectorAll(
        'h2, label, input, select, button, textarea, .form-fields'
      )
      .forEach(el => {
        el.style.display = 'none';
      });

    // Show the spinner
    this._spinnerDiv.style.display = 'block'; // Show the spinner
    this._spinnerDiv.classList.remove('hidden'); // Remove hidden class if previously set
    this._spinnerDiv.classList.add('visible');

    this._spinnerDiv.querySelector('p').textContent =
      message || 'Processing...';

    const spinnerCancelButton = this._spinnerDiv.querySelector(
      '.spinner-cancel-btn'
    );
    spinnerCancelButton?.addEventListener('click', () => this._handleCancel());

    // Show the spinner
    this._spinnerDiv = this._form.querySelector('.spinner-div');
    this._spinnerDiv.style.display = 'flex';

    // Add a delay to ensure the spinner is visible for at least 2 seconds
    setTimeout(() => {
      this._form
        .querySelectorAll(
          'h2, label, input, select, button, textarea, .form-fields'
        )
        .forEach(el => {
          el.style.display = 'block';
        });
    }, 2000);
  }

  cancelSpinner() {
    if (this._spinnerDiv) {
      this._spinnerDiv.style.display = 'none'; // Hide the spinner
      this._spinnerDiv.classList.add('hidden');
      this._spinnerDiv.classList.remove('visible');
    }

    // Restore visibility of form elements
    this._form
      .querySelectorAll(
        'h2, label, input, select, button, textarea, .form-fields'
      )
      .forEach(el => el.classList.remove('hidden'));
  }

  // Initialize validation rules once
  _initValidation() {
    this._validator = new JustValidate(this._form, {
      errorLabelCssClass: 'error-message',
      tooltip: { position: 'top' },
      lockForm: true,
    });

    this._validator
      .addField('#fullName', [
        { rule: 'required', errorMessage: 'Full Name is required' },
        {
          rule: 'minLength',
          value: 3,
          errorMessage: 'Full Name must be at least 3 characters',
        },
        {
          validator: value => value.trim().split(' ').length >= 2,
          errorMessage: 'Full Name must contain at least two words',
        },
      ])
      .addField('#email', [
        { rule: 'required', errorMessage: 'Email is required' },
        { rule: 'email', errorMessage: 'Email format is incorrect' },
      ])
      .addField('#streetAddress', [
        { rule: 'required', errorMessage: 'Street Address is required' },
      ])
      .addField('#zipCode', [
        { rule: 'required', errorMessage: 'Zip Code is required' },
        {
          rule: 'number',
          errorMessage: 'Must be a 5 digit LA county Zip Code',
        },
        {
          rule: 'minLength',
          value: 5,
          errorMessage: 'Zip Code must be exactly 5 digits',
        },
        {
          rule: 'maxLength',
          value: 5,
          errorMessage: 'Zip Code must be exactly 5 digits',
        },
      ])
      .addField('#aptDate', [
        { rule: 'required', errorMessage: 'Appointment Date is required' },
        {
          validator: value => new Date(value) >= new Date(),
          errorMessage: 'Please choose a future date',
        },
      ])
      .addField('#aptTimeslot', [
        { rule: 'required', errorMessage: '2h timeslot must be selected' },
      ]);

    return this._validator;
  }

  // Initialize address suggestion functionality
  _initAddressSuggestions() {
    const displaySuggestions = matches => {
      this._suggestionsContainer.innerHTML = '';

      if (!matches.length) {
        const noMatch = document.createElement('div');
        noMatch.className = 'suggestion-item';
        noMatch.textContent = 'No matches found';
        this._suggestionsContainer.appendChild(noMatch);
        return;
      }

      matches.forEach(match => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.textContent = `${match.streetNumber || ''} ${
          match.streetDirection || ''
        } ${match.streetName} ${match.streetType || ''}, ${
          match.zipCode || ''
        }`.trim();

        suggestionItem.dataset.address = JSON.stringify(match);

        suggestionItem.addEventListener('click', () => {
          const addressText = suggestionItem.textContent.trim();
          const addressWithoutZip = addressText
            .replace(/\s*\d{5}(\s*\-\s*\d{4})?(\s*,\s*)?$/, '')
            .trim();

          this._addressInput.value = addressWithoutZip.replace(',', '');
          this._suggestionsContainer.innerHTML = '';
          this._suggestionsContainer.style.display = 'none';
        });

        this._suggestionsContainer.appendChild(suggestionItem);
      });
    };

    const handleAddressInput = async () => {
      const query = this._addressInput.value.trim();
      const zipCode = this._zipCodeEL.value.trim();

      if (query.length < 2) {
        this._suggestionsContainer.innerHTML = '';
        return;
      }

      if (query === this._currentQuery) return;

      this._currentQuery = query;

      this._suggestionsContainer.innerHTML = '<p>Loading suggestions...</p>';

      try {
        const matches =
          zipCode.length >= 5
            ? await searchAddress(zipCode, query)
            : await searchAddress(query);
        displaySuggestions(matches);
      } catch (err) {
        console.error('Error fetching address suggestions:', err);
      }
    };

    this._addressInput.addEventListener(
      'input',
      debounce(handleAddressInput, 300)
    );
    this._zipCodeEL.addEventListener(
      'input',
      debounce(handleAddressInput, 300)
    );

    document.addEventListener('click', event => {
      if (
        !this._suggestionsContainer.contains(event.target) &&
        event.target !== this._addressInput
      ) {
        this._suggestionsContainer.innerHTML = '';
        this._suggestionsContainer.style.display = 'none';
      }
    });

    this._addressInput.addEventListener('focus', () => {
      if (this._suggestionsContainer.innerHTML.trim()) {
        this._suggestionsContainer.style.display = 'block';
      }
    });

    this._suggestionsContainer.addEventListener('mousedown', event => {
      event.preventDefault();
    });

    this._addressInput.addEventListener('blur', () => {
      setTimeout(() => {
        this._suggestionsContainer.style.display = 'none';
      }, 200);
    });
  }

  _handleFailure() {
    const firstInvalidField = document.querySelector('.is-invalid');
    if (firstInvalidField) firstInvalidField.focus();
  }

  populateFormWithExistingData(appointment) {
    this._id = appointment.id; // save id in this._id

    this._form.classList.add('edit-session');
    this._submitButton.textContent = 'Save changes';
    this._submitButton.classList.add('edit-session');
    this._submitButton.classList.remove('form-submit-btn');
    this._submitButton.removeAttribute('type');
    const titleEl = this._form.querySelector('h2');
    titleEl.textContent = 'Editing Appointment... ';

    // Update the form input fields with the existing appointment data
    this._fullNameEl.value = appointment.fullName || '';
    this._emailEl.value = appointment.email || '';
    this._streetAddressEl.value = appointment.streetAddress || '';
    this._zipCodeEl.value = appointment.zipCode || '';
    this._secondLineAddressEl.value = appointment.secondLineAddress || '';
    this._aptDateEl.value = appointment.aptDate || '';
    this._aptTimeslotEl.value = appointment.aptTimeslot || '';
  }

  async _saveEditedAppointment() {
    const updatedAppointment = this.getFormData(true);

    // Update the appointment in the appointments array (find by ID or other identifier)
    const index = model.AppState.appointments.findIndex(
      appt => +appt.id === +updatedAppointment.id
    );
    console.log(index, 'index');

    if (index !== -1) {
      model.AppState.appointments[index] = updatedAppointment; // Update appointment
      notyf.success('Appointment successfully updated!');
    } else {
      notyf.error('Appointment not found for updating!');
    }

    // Resolve the editing session promise
    if (this._editingSessionFinished) {
      this._editingSessionFinished(true); // Notify that editing is finished
    }

    this._resetEditSession();
  }

  _resetEditSession() {
    // Reset after editing
    this.handleToggleModal();
    this._form.classList.remove('edit-session'); // Reset form to "create" mode
    this._submitButton.classList.remove('edit-session');
    this._submitButton.classList.add('form-submit-btn');
    this._submitButton.type = 'submit';
    this._submitButton.textContent = 'Create Appointment'; // Restore button text
  }

  async isEditingFinished() {
    return new Promise(resolve => {
      this._editingSessionFinished = resolve; // Store the resolve function to call it later when editing is finished
    });
  }

  async getUpdatedFormData() {
    // Check if the editing is finished
    const isFinished = await this.isEditingFinished();

    if (isFinished) {
      // Retrieve and return the form data
      return this.getFormData(true); // or any other form data fetching logic
    }

    return null; // Return null if editing is not finished
  }

  getFormData(isEditingSession) {
    if (isEditingSession) {
      return {
        fullName: this._fullNameEl.value,
        id: this._id,
        secondLineAddress: this._secondLineAddressEl.value,
        aptDate: this._aptDateEl.value,
        aptTimeslot: this._aptTimeslotEl.value,
        zipCode: this._zipCodeEl.value,
        streetAddress: this._streetAddressEl.value,
        email: this._emailEl.value,
      };
    } else {
      return {
        fullName: this._fullNameEl.value,
        id: Math.random().toString(36).substr(2, 9),
        email: this._emailEl.value,
        streetAddress: this._streetAddressEl.value,
        secondLineAddress: this._secondLineAddressEl.value,
        aptDate: this._aptDateEl.value,
        aptTimeslot: this._aptTimeslotEl.value,
        zipCode: this._zipCodeEl.value,
      };
    }
  }
}

export default new NewAptView();
