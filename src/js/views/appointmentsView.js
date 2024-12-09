// AppointmentsView.js
import { saveAppointmentsToLocalStorage } from '../helpers';
import newAptView from './newAptView';

class AppointmentsView {
  _tableBody;
  _appointmentsPerPage = 5;
  _currentPage = 1;
  _paginationContainer;

  constructor() {
    console.log('AppointmentsView class initialized');
    this._tableBody = document.querySelector('#appointments-tbody');
    this._paginationContainer = document.querySelector('#pagination-controls');
    this.displayAppointments();
  }

  handleModifyButtonClick(appointmentId) {
    const appointment = this._getAppointmentsFromLocalStorage().find(
      appt => appt.id === appointmentId
    );
    if (appointment) {
      this.renderEditForm(appointment); // Pass the appointment with the existing ID
    }
  }

  renderEditForm(appointment) {
    // Open the modal
    newAptView.toggleVisibility(
      document.querySelector('.newAppointmentForm'),
      document.querySelector('.form-overlay')
    );
    newAptView.populateFormWithExistingData(appointment); // Populate the form with existing data
  }

  // Handle modal toggle
  handleToggleModal() {
    const formContainer = document.querySelector('.edit-form-container');
    if (formContainer) {
      formContainer.remove();
    }
  }

  generateMockAppointments() {
    const appointments = [];
    const names = [
      'Bogdan Terzic',
      'John Doe',
      'Jane Smith',
      'Alice Johnson',
      'Bob Brown',
    ];
    const timeslots = [
      '7AM-9AM',
      '9AM-11AM',
      '11AM-1PM',
      '1PM-3PM',
      '3PM-5PM',
      '5PM-7PM',
    ];

    function getRandomDate() {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 90);
      const randomDate = new Date(
        startDate.getTime() +
          Math.random() * (endDate.getTime() - startDate.getTime())
      );

      const year = randomDate.getFullYear();
      const month = ('0' + (randomDate.getMonth() + 1)).slice(-2);
      const day = ('0' + randomDate.getDate()).slice(-2);
      return `${year}-${month}-${day}`;
    }

    function getRandomTimeslot() {
      const randomIndex = Math.floor(Math.random() * timeslots.length);
      return timeslots[randomIndex];
    }

    for (let i = 0; i < 20; i++) {
      const appointment = {
        fullName: names[Math.floor(Math.random() * names.length)],
        id: Math.random().toString(),
        email: `user${i}@example.com`,
        streetAddress: `${Math.floor(Math.random() * 1000)} ${
          ['S', 'W', 'E', 'N'][Math.floor(Math.random() * 4)]
        } Bentley`,
        zipCode: '90025',
        secondLineAddress: Math.floor(Math.random() * 200) + 1,
        aptDate: getRandomDate(),
        aptTimeslot: getRandomTimeslot(),
        status: ['confirmed', 'pending', 'cancelled'][
          Math.floor(Math.random() * 3)
        ],
      };

      appointments.push(appointment);
    }

    saveAppointmentsToLocalStorage(appointments);
    this.displayAppointments();

    return appointments;
  }

  displayAppointments() {
    let appointments = this._getAppointmentsFromLocalStorage();
    if (
      !appointments ||
      (Array.isArray(appointments) && appointments.length === 0)
    )
      appointments = this.generateMockAppointments();

    const start = (this._currentPage - 1) * this._appointmentsPerPage;
    const end = start + this._appointmentsPerPage;
    const paginatedAppointments = appointments.slice(start, end);

    if (!paginatedAppointments || paginatedAppointments.length === 0) {
      this._tableBody.innerHTML =
        '<tr><td colspan="6">No appointments available</td></tr>';
      return;
    }

    const rows = paginatedAppointments.map(
      appt => `
  <tr>
    <td>${appt.fullName}</td>
    <td>${appt.streetAddress}</td>
    <td>${appt.aptDate}</td>
    <td>${appt.aptTimeslot}</td>
    <td>${appt.status}</td>
    <td>
      <button class="action-button modify-button" data-id="${appt.id}">Modify</button>
      <button class="action-button cancel-button" data-id="${appt.id}">Cancel</button>
    </td>
  </tr>
`
    );

    this._tableBody.innerHTML = rows.join('');
    this._renderPagination(appointments.length);
  }

  _renderPagination(totalNumAppointments) {
    const totalPages = Math.ceil(
      totalNumAppointments / this._appointmentsPerPage
    );
    this._paginationContainer.innerHTML = ''; // Clear existing pagination

    // Create Prev button
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Prev';
    prevButton.classList.add('pagination-btn', 'pagination-prev');
    prevButton.disabled = this._currentPage === 1; // Disable if on the first page

    prevButton.addEventListener('click', () => {
      if (this._currentPage > 1) {
        this._currentPage--;
        this.displayAppointments();
      }
    });
    this._paginationContainer.appendChild(prevButton);

    // Create Page buttons
    for (let i = 1; i <= totalPages; i++) {
      const button = document.createElement('button');
      button.textContent = i;
      button.classList.add('pagination-button');
      if (i === this._currentPage) button.classList.add('active');

      button.addEventListener('click', () => {
        this._currentPage = i;
        this.displayAppointments();
      });

      this._paginationContainer.appendChild(button);
    }

    // Create Next button
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.classList.add('pagination-btn', 'pagination-next');
    nextButton.disabled = this._currentPage === totalPages; // Disable if on the last page

    nextButton.addEventListener('click', () => {
      if (this._currentPage < totalPages) {
        this._currentPage++;
        this.displayAppointments();
      }
    });
    this._paginationContainer.appendChild(nextButton);

    // Update pagination info (e.g., "Page 1 / 14")
    const paginationInfo = document.createElement('span');
    paginationInfo.classList.add('pagination-info');
    paginationInfo.textContent = `Page ${this._currentPage} / ${totalPages}`;
    this._paginationContainer.appendChild(paginationInfo);
  }

  _getAppointmentsFromLocalStorage() {
    const appointmentsJSON = localStorage.getItem('appointments');
    return appointmentsJSON ? JSON.parse(appointmentsJSON) : [];
  }

  addHandlerActionButton(handlerFunction) {
    this._tableBody.addEventListener('click', function (e) {
      const button = e.target.closest('.action-button');
      if (!button) return;

      const appointmentId = button.dataset.id;
      handlerFunction(e, appointmentId);
    });
  }
}

export default new AppointmentsView();
