export default class ModalView {
  _modal;
  _modalOverlay;
  _modalToggleButton;
  _submitButton;

  constructor(modalElement, overlayElement, toggleButtonEl, submitButtonEl) {
    this._modal = document.querySelector(modalElement);
    this._modalOverlay = document.querySelector(overlayElement);
    this._modalToggleButton = document.querySelector(toggleButtonEl);
    this._submitButton = document.querySelector(submitButtonEl);

    // ! Bind methods
    this.handleToggleModal = this.handleToggleModal.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.detectOutsideClickOrESCKeypress =
      this.detectOutsideClickOrESCKeypress.bind(this);
    this.preventCloseOnInsideClick = this.preventCloseOnInsideClick.bind(this);

    this._initEventListeners();
  }

  // Add event listeners for toggle, close on outside click, and ESC keypress
  _initEventListeners() {
    this.addHandlerToggleModal();
    this.addHandlerSubmitForm();
    this.addHandlerCloseOnOutsideClickOrESCKeypress();
    this.addHandlerPreventCloseOnModal();
  }

  // Handle toggling modal visibility
  handleToggleModal(e) {
    const isVisible = !this._modal.classList.contains('hidden');

    // Call toggleVisibility only once with the correct state
    if (isVisible) {
      this.toggleVisibility(this._modal, this._modalOverlay); // Close modal
    } else {
      this.toggleVisibility(this._modal, this._modalOverlay); // Open modal
    }
  }

  async handleFormSubmit(e, onSuccess) {
    e.preventDefault();
    this._submitButton.disabled = true;

    try {
      const isValid = await this._validator.isValid;
      if (isValid) {
        const formData = this._getFormData();
        if (onSuccess) onSuccess(formData);
      } else {
        this._handleFailure();
      }
    } catch (error) {
      console.error('Form submission error:', error);
      notyf.error('An error occurred during form submission.');
    } finally {
      this._submitButton.disabled = false;
    }
  }

  // Toggle visibility and add class to body
  toggleVisibility(...elements) {
    elements.forEach(el => {
      if (el.classList.contains('hidden')) {
        el.classList.remove('hidden');
        el.classList.add('visible');
        document.body.classList.add('modal-open');
      } else {
        el.classList.remove('visible');
        el.classList.add('hidden');
        document.body.classList.remove('modal-open');
      }
    });
  }

  // Handle closing modal on outside click or ESC key press
  detectOutsideClickOrESCKeypress(e) {
    const isOutsideClick =
      e.type === 'click' && e.target === this._modalOverlay;
    const isESCKeyPress = e.type === 'keydown' && e.key === 'Escape';

    if (isESCKeyPress && !this._modal.classList.contains('hidden')) {
      this.toggleVisibility(this._modal, this._modalOverlay);
    } else if (isOutsideClick) {
      this.toggleVisibility(this._modal, this._modalOverlay);
    }
  }

  // Prevent clicks inside the modal from toggling or closing it
  preventCloseOnInsideClick(e) {
    e.stopPropagation();
  }

  // Cleanup event listeners when modal is closed
  cleanupHandlers() {
    if (this._modalOverlay) {
      this._modalOverlay.removeEventListener(
        'click',
        this.detectOutsideClickOrESCKeypress
      );
    }
    document.removeEventListener(
      'keydown',
      this.detectOutsideClickOrESCKeypress
    );
    if (this._modal) {
      this._modal.removeEventListener('click', this.preventCloseOnInsideClick);
    }
  }
  // Add handler for opening/closing modal
  addHandlerToggleModal() {
    if (this._modalToggleButton) {
      this._modalToggleButton.addEventListener('click', this.handleToggleModal);
    }
  }

  // Add handler for form Submit
  addHandlerSubmitForm(handlerFunction = null) {
    if (!this._modal || !this._submitButton) {
      return;
    }

    if (!handlerFunction) {
      this._modal.addEventListener('submit', this.handleFormSubmit);
      return;
    }

    this._modal.addEventListener('submit', async e => {
      await this.handleFormSubmit(e, handlerFunction);
    });
  }

  // Add handler for closing modal on outside click or ESC key press
  addHandlerCloseOnOutsideClickOrESCKeypress() {
    if (this._modalOverlay) {
      this._modalOverlay.addEventListener(
        'click',
        this.detectOutsideClickOrESCKeypress
      );
    }
    document.addEventListener('keydown', this.detectOutsideClickOrESCKeypress);
  }

  // Prevent closing modal when clicking inside it
  addHandlerPreventCloseOnModal() {
    if (this._modal) {
      this._modal.addEventListener('click', this.preventCloseOnInsideClick);
    }
  }
}
