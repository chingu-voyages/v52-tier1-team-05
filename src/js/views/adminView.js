// AdminView.js
import { saveAppointmentsToLocalStorage } from '../helpers';
import newAptView from './newAptView';

class AdminView {
  _tableBody;
  _appointmentsPerPage = 5;
  _currentPage = 1;
  _paginationContainer;

  constructor() {
    console.log('AdminView class initialized');
    this._tableBody = document.querySelector('#appointments-tbody');
    this._paginationContainer = document.querySelector('#pagination-controls');
    this.displayAppointments();
    this._addNavigationEventListeners();
  }

  _addNavigationEventListeners() {
    document
      .getElementById('all-appointments')
      .addEventListener('click', () => {
        this.displayAppointments(); // Display all appointments
      });

    document
      .getElementById('todays-appointments')
      .addEventListener('click', () => {
        this.displayAppointments('today');
      });

    document.getElementById('next-7-days').addEventListener('click', () => {
      this.displayAppointments('next7days');
    });

    document.getElementById('next-30-days').addEventListener('click', () => {
      this.displayAppointments('next30days');
    });
  }

  handleModifyButtonClick(appointmentId) {
    const appointment = this._getAppointmentsFromLocalStorage().find(
      appt => appt.id === appointmentId
    );
    if (appointment) {
      this.renderEditForm(appointment);
    }
  }

  renderEditForm(appointment) {
    newAptView.toggleVisibility(
      document.querySelector('.newAppointmentForm'),
      document.querySelector('.form-overlay')
    );
    newAptView.populateFormWithExistingData(appointment);
  }

  handleToggleModal() {
    const formContainer = document.querySelector('.edit-form-container');
    if (formContainer) {
      formContainer.remove();
    }
  }

  generateMockAppointments() {
    const appointments = [];
    const names = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Brown'];
    const timeslots = ['7AM-9AM', '9AM-11AM', '11AM-1PM', '1PM-3PM'];

    function getRandomDate() {
      const today = new Date();
      const randomDays = Math.floor(Math.random() * 30) + 1;
      const randomDate = new Date(today.setDate(today.getDate() + randomDays));
      return randomDate.toISOString().split('T')[0];
    }

    for (let i = 0; i < 66; i++) {
      const appointment = {
        fullName: names[Math.floor(Math.random() * names.length)],
        id: Math.random().toString(),
        aptDate: getRandomDate(),
        aptTimeslot: timeslots[Math.floor(Math.random() * timeslots.length)],
        status: 'confirmed',
      };
      appointments.push(appointment);
    }

    saveAppointmentsToLocalStorage(appointments);
    this.displayAppointments();

    return appointments;
  }

  displayAppointments(filter = 'all') {
    let appointments = this._getAppointmentsFromLocalStorage();

    if (!appointments || appointments.length === 0) {
      appointments = this.generateMockAppointments();
    }

    if (filter === 'today') {
      appointments = this._filterAppointmentsForToday(appointments);
    } else if (filter === 'next7days') {
      appointments = this._filterAppointmentsNext7Days(appointments);
    } else if (filter === 'next30days') {
      appointments = this._filterAppointmentsNext30Days(appointments);
    }

    const start = (this._currentPage - 1) * this._appointmentsPerPage;
    const end = start + this._appointmentsPerPage;
    const paginatedAppointments = appointments.slice(start, end);

    if (!paginatedAppointments.length) {
      this._tableBody.innerHTML =
        '<tr><td colspan="6">No appointments available</td></tr>';
      return;
    }

    const rows = paginatedAppointments.map(
      appt => `
      <tr>
        <td>${appt.fullName}</td>
        <td>${appt.streetAddress || 'N/A'}</td>
        <td>${appt.aptDate}</td>
        <td>${appt.aptTimeslot}</td>
        <td>${appt.status}</td>
        <td>
          <button class="action-button modify-button" data-id="${
            appt.id
          }">Modify</button>
          <button class="action-button cancel-button" data-id="${
            appt.id
          }">Cancel</button>
        </td>
      </tr>`
    );

    this._tableBody.innerHTML = rows.join('');
    this._renderPagination(appointments.length);
  }

  _filterAppointmentsForToday(appointments) {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(appt => appt.aptDate === today);
  }

  _filterAppointmentsNext7Days(appointments) {
    const today = new Date();
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);

    return appointments.filter(appt => {
      const date = new Date(appt.aptDate);
      return date >= today && date <= next7Days;
    });
  }

  _filterAppointmentsNext30Days(appointments) {
    const today = new Date();
    const next30Days = new Date(today);
    next30Days.setDate(today.getDate() + 30);

    return appointments.filter(appt => {
      const date = new Date(appt.aptDate);
      return date >= today && date <= next30Days;
    });
  }

  _renderPagination(totalAppointments) {
    const totalPages = Math.ceil(totalAppointments / this._appointmentsPerPage);
    this._paginationContainer.innerHTML = '';

    const prevButton = document.createElement('button');
    prevButton.textContent = 'Prev';
    prevButton.disabled = this._currentPage === 1;

    prevButton.addEventListener('click', () => {
      if (this._currentPage > 1) {
        this._currentPage--;
        this.displayAppointments();
      }
    });

    this._paginationContainer.appendChild(prevButton);

    for (let i = 1; i <= totalPages; i++) {
      const button = document.createElement('button');
      button.textContent = i;
      button.classList.add(i === this._currentPage ? 'active' : '');
      button.addEventListener('click', () => {
        this._currentPage = i;
        this.displayAppointments();
      });
      this._paginationContainer.appendChild(button);
    }

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.disabled = this._currentPage === totalPages;

    nextButton.addEventListener('click', () => {
      if (this._currentPage < totalPages) {
        this._currentPage++;
        this.displayAppointments();
      }
    });

    this._paginationContainer.appendChild(nextButton);
  }

  _getAppointmentsFromLocalStorage() {
    return JSON.parse(localStorage.getItem('appointments')) || [];
  }

  addHandlerActionButton(handler) {
    this._tableBody.addEventListener('click', e => {
      const button = e.target.closest('.action-button');
      if (!button) return;
      handler(e, button.dataset.id);
    });
  }
}

export default new AdminView();
