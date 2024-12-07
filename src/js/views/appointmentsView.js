import { saveAppointmentsToLocalStorage } from '../helpers';

class AppointmentsView {
  _tableBody;

  constructor() {
    this._tableBody = document.querySelector('#appointments-tbody');
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

    // Helper function to generate a random date within the next 90 days
    function getRandomDate() {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 90); // 90 days from now

      const randomDate = new Date(
        startDate.getTime() +
          Math.random() * (endDate.getTime() - startDate.getTime())
      );

      const year = randomDate.getFullYear();
      const month = ('0' + (randomDate.getMonth() + 1)).slice(-2); // Ensure two digits for month
      const day = ('0' + randomDate.getDate()).slice(-2); // Ensure two digits for day
      return `${year}-${month}-${day}`;
    }

    // Helper function to generate a random timeslot
    function getRandomTimeslot() {
      const randomIndex = Math.floor(Math.random() * timeslots.length);
      return timeslots[randomIndex];
    }

    // Generate 100 appointments
    for (let i = 0; i < 100; i++) {
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

  // Method to display appointments from localStorage
  displayAppointments() {
    const appointments = this._getAppointmentsFromLocalStorage();
    console.log(appointments);

    if (!appointments || appointments.length === 0) {
      this._tableBody.innerHTML =
        '<tr><td colspan="6">No appointments available</td></tr>';
      return;
    }

    const rows = appointments.map(
      appt => `
      <tr>
        <td>${appt.fullName}</td>
        <td>${appt.streetAddress}</td>
        <td>${appt.aptDate}</td>
        <td>${appt.aptTimeslot}</td>
        <td>${appt.status}</td>
        <td><button class="action-button" data-id="${appt.id}">Modify</button></td>
      </tr>
    `
    );

    this._tableBody.innerHTML = rows.join('');
  }

  // Fetch appointments from localStorage
  _getAppointmentsFromLocalStorage() {
    const appointmentsJSON = localStorage.getItem('appointments');
    const appointments = appointmentsJSON ? JSON.parse(appointmentsJSON) : [];
    console.log(appointments);
    return appointments;
  }

  // Add handler for action buttons in the table
  addHandlerActionButton(handlerFunction) {
    this._tableBody.addEventListener('click', function (e) {
      const button = e.target.closest('.action-button');
      if (!button) return;

      const appointmentId = button.dataset.id;
      handlerFunction(appointmentId);
    });
  }
}

export default new AppointmentsView();
