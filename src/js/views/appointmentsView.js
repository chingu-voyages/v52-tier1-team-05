// AppointmentsView.js
import { saveAppointmentsToLocalStorage } from '../helpers';
import newAptView from './newAptView';

class AppointmentsView {
  _tableBody;
  _appointmentsPerPage = 5;
  _currentPage = 1;
  _currentFilter = 'all';
  _paginationContainer;

  constructor() {
    this._tableBody = document.querySelector('#appointments-tbody');
    this._paginationContainer = document.querySelector('#pagination-controls');
    this.displayAppointments();
    this._addNavigationEventListeners();
  }

  _addNavigationEventListeners() {
    document
      .getElementById('all-appointments')
      .addEventListener('click', () => {
        this._currentFilter = 'all';
        this._currentPage = 1; // Reset to page 1 when a new filter is selected
        this.displayAppointments();
      });

    document
      .getElementById('todays-appointments')
      .addEventListener('click', () => {
        this._currentFilter = 'today';
        this._currentPage = 1;
        this.displayAppointments('today');
      });

    document.getElementById('next-7-days').addEventListener('click', () => {
      this._currentFilter = 'next7days';
      this._currentPage = 1;
      this.displayAppointments('next7days');
    });

    document.getElementById('next-30-days').addEventListener('click', () => {
      this._currentFilter = 'next30days';
      this._currentPage = 1;
      this.displayAppointments('next30days');
    });
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
      const today = new Date();
      const randomizer = Math.random();
      let randomDate;

      if (randomizer < 0.3) {
        // 30% chance for appointments today
        randomDate = new Date(today);
      } else if (randomizer < 0.7) {
        // 40% chance for appointments in the next 7 days
        const daysAhead = Math.floor(Math.random() * 7) + 1;
        randomDate = new Date(today);
        randomDate.setDate(today.getDate() + daysAhead);
      } else {
        // 30% chance for appointments in the next 30 days
        const daysAhead = Math.floor(Math.random() * 30) + 8;
        randomDate = new Date(today);
        randomDate.setDate(today.getDate() + daysAhead);
      }

      const year = randomDate.getFullYear();
      const month = ('0' + (randomDate.getMonth() + 1)).slice(-2);
      const day = ('0' + randomDate.getDate()).slice(-2);
      return `${year}-${month}-${day}`;
    }

    function getRandomTimeslot() {
      const randomIndex = Math.floor(Math.random() * timeslots.length);
      return timeslots[randomIndex];
    }
    //  prettier-ignore
    const validZipCodes = [
      '90001',
      '90002',
      '90003',
      '90004',
      '90005',
      '90006',
      '90007',
      '90008',
      '90009',
      '90010',
      '90011',
      '90012',
      '90013',
      '90014',
      '90015',
      '90016',
      '90017',
      '90018',
      '90019',
      '90020',
      '90021',
      '90022',
      '90023',
      '90024',
      '90025',
      '90026',
      '90027',
      '90028',
      '90029',
      '90030',
      '90031',
      '90032',
      '90033',
      '90034',
      '90035',
      '90036',
      '90037',
      '90038',
      '90039',
      '90040',
      // Add more as needed.
    ];
    for (let i = 0; i < 66; i++) {
      const appointment = {
        fullName: names[Math.floor(Math.random() * names.length)],
        id: Math.random().toString(),
        email: `user${i}@example.com`,
        streetAddress: `${Math.floor(Math.random() * 1000)} ${
          ['S', 'W', 'E', 'N'][Math.floor(Math.random() * 4)]
        } Bentley`,
        zipCode:
          validZipCodes[Math.floor(Math.random() * validZipCodes.length)],
        secondLineAddress: Math.floor(Math.random() * 200) + 1,
        aptDate: getRandomDate(),
        aptTimeslot: getRandomTimeslot(),
        status: 'confirmed',
      };

      appointments.push(appointment);
    }

    saveAppointmentsToLocalStorage(appointments);
    this.displayAppointments();

    return appointments;
  }

  displayAppointments(filter = this._currentFilter) {
    let appointments = this._getAppointmentsFromLocalStorage();
    if (
      !appointments ||
      (Array.isArray(appointments) && appointments.length === 0)
    ) {
      appointments = this.generateMockAppointments();
    }

    // Apply the selected filter
    if (filter === 'today') {
      appointments = this._filterAppointmentsForToday(appointments);
    } else if (filter === 'next7days') {
      appointments = this._filterAppointmentsNext7Days(appointments);
    } else if (filter === 'next30days') {
      appointments = this._filterAppointmentsNext30Days(appointments);
    }

    // Calculate paginated results
    const start = (this._currentPage - 1) * this._appointmentsPerPage;
    const end = start + this._appointmentsPerPage;
    const paginatedAppointments = appointments.slice(start, end);

    // Check if there are appointments to display
    if (!appointments || appointments.length === 0) {
      this._tableBody.innerHTML =
        '<tr><td colspan="6">No appointments available</td></tr>';
      this._paginationContainer.style.display = 'none';
      return;
    }

    if (!paginatedAppointments || paginatedAppointments.length === 0) {
      this._tableBody.innerHTML =
        '<tr><td colspan="6">No appointments available for this page</td></tr>';
    } else {
      // Generate table rows
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
    }

    // Render pagination if more than one page of results
    if (appointments.length > this._appointmentsPerPage) {
      this._paginationContainer.style.display = 'flex';
      this._renderPagination(appointments.length);
    } else {
      this._paginationContainer.style.display = 'none';
    }
  }

  _filterAppointmentsForToday(appointments) {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    return appointments.filter(appt => appt.aptDate === today);
  }

  _filterAppointmentsNext7Days(appointments) {
    const today = new Date();
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);

    return appointments.filter(appt => {
      const appointmentDate = new Date(appt.aptDate);
      return appointmentDate >= today && appointmentDate <= next7Days;
    });
  }

  _filterAppointmentsNext30Days(appointments) {
    const today = new Date();
    const next30Days = new Date(today);
    next30Days.setDate(today.getDate() + 30);

    return appointments.filter(appt => {
      const appointmentDate = new Date(appt.aptDate);
      return appointmentDate >= today && appointmentDate <= next30Days;
    });
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
    prevButton.disabled = this._currentPage === 1;

    prevButton.addEventListener('click', () => {
      if (this._currentPage > 1) {
        this._currentPage--;
        this.displayAppointments(this._currentFilter); // Pass current filter
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
        this.displayAppointments(this._currentFilter); // Pass current filter
      });

      this._paginationContainer.appendChild(button);
    }

    // Create Next button
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.classList.add('pagination-btn', 'pagination-next');
    nextButton.disabled = this._currentPage === totalPages;

    nextButton.addEventListener('click', () => {
      if (this._currentPage < totalPages) {
        this._currentPage++;
        this.displayAppointments(this._currentFilter); // Pass current filter
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
