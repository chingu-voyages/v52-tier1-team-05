import { adminCredentials } from '../config';
import { notyf } from '../helpers';
import ModalView from './ModalView';
import JustValidate from 'just-validate';

class AdminLoginModal extends ModalView {
  _form = document.querySelector('.adminLoginModal'); // Form element for login
  _formOverlay = document.querySelector('.login-overlay'); // Modal overlay
  _submitButton = document.querySelector('.login-submit-btn'); // Submit button
  _toggleLoginButton = document.querySelector('.toggle-login-btn');
  _spinnerDiv = document.querySelector('.spinner-div'); // Spinner container
  _spinner = document.querySelector('.spinner'); // Spinner
  _validator;

  constructor() {
    super(
      '.adminLoginModal',
      '.login-overlay',
      '.toggle-login-btn',
      'login-submit-btn'
    ); // Pass selectors to parent class

    // Initialize validation
    this._initValidation();
  }

  // Initialize validation rules
  _initValidation() {
    if (!this._form) {
      return;
    }

    this._validator = new JustValidate(this._form, {
      errorLabelCssClass: 'error-message',
      tooltip: { position: 'top' },
      lockForm: true,
    });

    this._validator
      .addField('#username', [
        { rule: 'required', errorMessage: 'Username is required' },
        {
          rule: 'minLength',
          value: 3,
          errorMessage: 'Username must be at least 3 characters',
        },
      ])
      .addField('#password', [
        { rule: 'required', errorMessage: 'Password is required' },
        {
          rule: 'minLength',
          value: 6,
          errorMessage: 'Password must be at least 6 characters',
        },
      ]);
  }

  // ! TO DELETE THIS CODE
  // async _handleSuccess() {
  //   console.log('HANDLE RUNNING');
  //   const formData = this._getFormData();

  //   try {
  //     console.log('starting try block');
  //     // Mock login validation (replace with API call or backend logic)
  //     if (
  //       formData.username === adminCredentials.username &&
  //       formData.password === adminCredentials.password
  //     ) {
  //       notyf.success('Login successful!');
  //       this._form.reset(); // Reset the form
  //       this.handleToggleModal(); // Close the modal
  //     }
  //   } catch (error) {
  //     console.error('Login Error:', error);
  //     notyf.error('Invalid username or password. Please try again');
  //   } finally {
  //   }
  // }
  // ! TO DELETE THIS CODE ABOVE

  // Handle successful form submission

  // async handleFormSubmit(e, onSuccess) {
  //   console.log('form submit running');
  //   e.preventDefault();

  //   try {
  //     this._submitButton.disabled = true;

  //     const isValid = await this._validator.isValid; // Ensure this works as intended
  //     console.log('Is the form valid:', isValid);

  //     if (isValid) {
  //       const formData = this._getFormData();
  //       if (
  //         formData.username === adminCredentials.username &&
  //         formData.password === adminCredentials.password
  //       ) {
  //         notyf.success('Login successful!');
  //         this._form.reset(); // Reset the form
  //         this.handleToggleModal(); // Close the modal
  //       }

  //       if (onSuccess) {
  //         console.log('Calling onSuccess...');
  //         await onSuccess(formData);
  //       }
  //     } else {
  //       this._handleFailure();
  //     }
  //   } catch (error) {
  //     console.error('Form submission error:', error);
  //     notyf.error('An error occurred during form submission.');
  //   } finally {
  //     this._submitButton.disabled = false;
  //   }
  // }

  // Handle validation failure
  _handleFailure() {
    // Focus on the first invalid field
    const firstInvalidField = document.querySelector('.is-invalid');
    if (firstInvalidField) firstInvalidField.focus();
  }

  // Get form data
  _getFormData() {
    return {
      username: document.getElementById('username').value,
      password: document.getElementById('password').value,
    };
  }

  // Display spinner
  renderSpinner(message = '') {
    // Hide form elements while keeping them in the DOM
    this._form
      .querySelectorAll('h2, label, input, button')
      .forEach(el => (el.style.display = 'none'));

    // Show the spinner

    this._spinnerDiv.style.display = 'flex';
    this._spinnerDiv.style.flexDirection = 'column';
    this._spinnerDiv.style.gap = '1rem';

    this._spinnerDiv.classList.remove('hidden'); // Remove hidden class if previously set
    this._spinnerDiv.classList.add('visible');

    this._spinnerDiv.querySelector('p').textContent = message || 'Loading...';
  }

  // Hide spinner
  cancelSpinner() {
    // Restore visibility of form elements
    this._form
      .querySelectorAll('h2, label, input, button')
      .forEach(el => (el.style.display = 'block'));

    // Hide the spinner
    this._spinnerDiv.style.display = 'none';
    this._spinnerDiv.classList.remove('visible');
    this._spinnerDiv.classList.add('hidden');
  }
}

export default new AdminLoginModal();
