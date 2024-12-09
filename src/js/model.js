// model.js

import {
  addAppointmentToLocalStorage,
  currentPendingAppointmentRequest,
  saveAppointmentsToLocalStorage,
} from './helpers';

export const AppState = {
  appointments: JSON.parse(localStorage.getItem('appointments')) || [],
  addresses: [],
  pendingAppointmentObject: localStorage.getItem('pendingAppointment') || null,
  currentAdminAccount: null,

  // Initialize state with local storage data
  initializeState() {
    this._finishAnyPendingRequests();
    this._initializeAppointments();
  },

  _finishAnyPendingRequests() {
    const currentRequest = currentPendingAppointmentRequest();
    if (currentRequest) this.pendingAppointmentObject = currentRequest;
  },

  async _initializeAddresses() {
    const db = await openDatabase();
    const fetchAddresses = new Promise((resolve, reject) => {
      const transaction = db.transaction('addresses', 'readonly');
      const store = transaction.objectStore('addresses');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    const addresses = await fetchAddresses;

    if (!addresses || addresses.length === 0) {
      console.log('IndexedDB is empty. Need to fetch data.');
      return false; // Database is not initialized
    }

    // console.log('Addresses fetched from IndexedDB:', addresses);
    this.addresses = addresses;
    return true; // Database is initialized
  },

  _initializeAppointments() {
    const storedAppointments =
      JSON.parse(localStorage.getItem('appointments')) || [];
    this.appointments = storedAppointments;
  },

  // Add appointment and update localStorage
  addAppointment(newAppointment) {
    // add 'status: confirmed'
    const aptWithStatusFlag = { ...newAppointment, status: 'confirmed' };
    this.appointments.push(aptWithStatusFlag);
    addAppointmentToLocalStorage(aptWithStatusFlag);
    console.log('Added appointment:', aptWithStatusFlag);
  },

  // Delete appointment and update localStorage
  cancelAppointment(appointmentId) {
    this.appointments = this.appointments.filter(a => a.id !== appointmentId);
    saveAppointmentsToLocalStorage(this.appointments);
    console.log('Deleted appointment with ID:', appointmentId);
  },

  // Modify appointment and update localStorage
  modifyAppointment(appointmentId, updatedObject) {
    const appointmentIndex = this.appointments.findIndex(
      a => a.id === appointmentId
    );
    if (appointmentIndex !== -1) {
      this.appointments[appointmentIndex] = {
        ...this.appointments[appointmentIndex],
        ...updatedObject,
      };

      saveAppointmentsToLocalStorage(this.appointments);
      console.log('Modified appointment:', updatedObject);
    }
  },
};
