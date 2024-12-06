import { AppState } from '../js/model';

function loadAppointments() {
  try {
    console.log('loadAppointments running');
    const appointments = AppState.appointments;

    if (!appointments || !Array.isArray(appointments)) {
      throw new Error('Appointments data is missing or invalid');
    }

    console.log(appointments);

    const tbody = document.getElementById('appointments-tbody');
    if (!tbody) {
      throw new Error('Could not find the tbody element');
    }

    tbody.innerHTML = ''; // Clear any existing content

    appointments.forEach((appointment, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${appointment.fullName}</td>
        <td>${appointment.streetAddress}</td>
        <td>${appointment.aptDate}</td>
        <td>${appointment.aptTimeslot}</td>
        <td>${appointment.status}</td>
        <td>
          <button class="confirm" onclick="confirmAppointment(${index})">Confirm</button>
          <button class="cancel" onclick="cancelAppointment(${index})">Cancel</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading appointments:', error);
  }
}

// Confirm an appointment
function confirmAppointment(index) {
  alert(`Appointment ${index + 1} confirmed!`);
  // Logic to update status could go here
}

// Cancel an appointment
function cancelAppointment(index) {
  alert(`Appointment ${index + 1} canceled!`);
  // Logic to update status could go here
}

// Load appointments when the page is loaded
window.onload = loadAppointments;
