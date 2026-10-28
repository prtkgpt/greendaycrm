const API_URL = '';

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = e.target.dataset.page;
        showPage(page);
    });
});

function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    document.getElementById(`${page}-page`).classList.add('active');
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    
    if (page === 'dashboard') loadDashboard();
    else if (page === 'customers') loadCustomers();
    else if (page === 'services') loadServices();
    else if (page === 'staff') loadStaff();
    else if (page === 'jobs') loadJobs();
    else if (page === 'invoices') loadInvoices();
}

// Dashboard
async function loadDashboard() {
    try {
        const stats = await fetch(`${API_URL}/api/dashboard/stats`).then(r => r.json());
        document.getElementById('stat-customers').textContent = stats.totalCustomers;
        document.getElementById('stat-jobs').textContent = stats.scheduledJobs;
        document.getElementById('stat-revenue').textContent = `$${stats.totalRevenue.toFixed(2)}`;
        document.getElementById('stat-invoices').textContent = stats.pendingInvoices;
        
        const todayJobs = await fetch(`${API_URL}/api/jobs/today`).then(r => r.json());
        const todayJobsEl = document.getElementById('today-jobs');
        
        if (todayJobs.length === 0) {
            todayJobsEl.innerHTML = '<div class="empty-state"><p>No jobs scheduled for today</p></div>';
        } else {
            todayJobsEl.innerHTML = todayJobs.map(job => `
                <div class="job-item">
                    <h3>${job.customer_name}</h3>
                    <p><strong>Service:</strong> ${job.service_name}</p>
                    <p><strong>Staff:</strong> ${job.staff_name || 'Unassigned'}</p>
                    <p><strong>Address:</strong> ${job.customer_address || 'N/A'}</p>
                    <p><strong>Notes:</strong> ${job.notes || 'None'}</p>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Customers
async function loadCustomers() {
    try {
        const customers = await fetch(`${API_URL}/api/customers`).then(r => r.json());
        const tbody = document.getElementById('customers-table');
        
        if (customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><p>No customers yet</p></td></tr>';
        } else {
            tbody.innerHTML = customers.map(customer => `
                <tr>
                    <td>${customer.name}</td>
                    <td>${customer.email || 'N/A'}</td>
                    <td>${customer.phone || 'N/A'}</td>
                    <td>${customer.address || 'N/A'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-secondary" onclick="editCustomer(${customer.id})">Edit</button>
                            <button class="btn btn-danger" onclick="deleteCustomer(${customer.id})">Delete</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

function showCustomerModal(id = null) {
    const modal = document.getElementById('customer-modal');
    const form = document.getElementById('customer-form');
    form.reset();
    
    if (id) {
        document.getElementById('customer-modal-title').textContent = 'Edit Customer';
        fetch(`${API_URL}/api/customers/${id}`)
            .then(r => r.json())
            .then(customer => {
                document.getElementById('customer-id').value = customer.id;
                document.getElementById('customer-name').value = customer.name;
                document.getElementById('customer-email').value = customer.email || '';
                document.getElementById('customer-phone').value = customer.phone || '';
                document.getElementById('customer-address').value = customer.address || '';
                document.getElementById('customer-notes').value = customer.notes || '';
            });
    } else {
        document.getElementById('customer-modal-title').textContent = 'Add Customer';
        document.getElementById('customer-id').value = '';
    }
    
    modal.classList.add('active');
}

async function editCustomer(id) {
    showCustomerModal(id);
}

async function deleteCustomer(id) {
    if (confirm('Are you sure you want to delete this customer?')) {
        try {
            await fetch(`${API_URL}/api/customers/${id}`, { method: 'DELETE' });
            loadCustomers();
        } catch (error) {
            console.error('Error deleting customer:', error);
        }
    }
}

document.getElementById('customer-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('customer-id').value;
    const data = {
        name: document.getElementById('customer-name').value,
        email: document.getElementById('customer-email').value,
        phone: document.getElementById('customer-phone').value,
        address: document.getElementById('customer-address').value,
        notes: document.getElementById('customer-notes').value
    };
    
    try {
        if (id) {
            await fetch(`${API_URL}/api/customers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            await fetch(`${API_URL}/api/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        
        closeModal('customer-modal');
        loadCustomers();
    } catch (error) {
        console.error('Error saving customer:', error);
    }
});

// Services
async function loadServices() {
    try {
        const services = await fetch(`${API_URL}/api/services`).then(r => r.json());
        const tbody = document.getElementById('services-table');
        
        if (services.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><p>No services yet</p></td></tr>';
        } else {
            tbody.innerHTML = services.map(service => `
                <tr>
                    <td>${service.name}</td>
                    <td>${service.description || 'N/A'}</td>
                    <td>$${service.base_price ? service.base_price.toFixed(2) : 'N/A'}</td>
                    <td>${service.duration || 'N/A'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-secondary" onclick="editService(${service.id})">Edit</button>
                            <button class="btn btn-danger" onclick="deleteService(${service.id})">Delete</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

function showServiceModal(id = null) {
    const modal = document.getElementById('service-modal');
    const form = document.getElementById('service-form');
    form.reset();
    
    if (id) {
        document.getElementById('service-modal-title').textContent = 'Edit Service';
        fetch(`${API_URL}/api/services/${id}`)
            .then(r => r.json())
            .then(service => {
                document.getElementById('service-id').value = service.id;
                document.getElementById('service-name').value = service.name;
                document.getElementById('service-description').value = service.description || '';
                document.getElementById('service-price').value = service.base_price || '';
                document.getElementById('service-duration').value = service.duration || '';
            });
    } else {
        document.getElementById('service-modal-title').textContent = 'Add Service';
        document.getElementById('service-id').value = '';
    }
    
    modal.classList.add('active');
}

async function editService(id) {
    showServiceModal(id);
}

async function deleteService(id) {
    if (confirm('Are you sure you want to delete this service?')) {
        try {
            await fetch(`${API_URL}/api/services/${id}`, { method: 'DELETE' });
            loadServices();
        } catch (error) {
            console.error('Error deleting service:', error);
        }
    }
}

document.getElementById('service-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('service-id').value;
    const data = {
        name: document.getElementById('service-name').value,
        description: document.getElementById('service-description').value,
        base_price: parseFloat(document.getElementById('service-price').value) || null,
        duration: parseInt(document.getElementById('service-duration').value) || null
    };
    
    try {
        if (id) {
            await fetch(`${API_URL}/api/services/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            await fetch(`${API_URL}/api/services`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        
        closeModal('service-modal');
        loadServices();
    } catch (error) {
        console.error('Error saving service:', error);
    }
});

// Staff
async function loadStaff() {
    try {
        const staff = await fetch(`${API_URL}/api/staff`).then(r => r.json());
        const tbody = document.getElementById('staff-table');
        
        if (staff.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><p>No staff members yet</p></td></tr>';
        } else {
            tbody.innerHTML = staff.map(member => `
                <tr>
                    <td>${member.name}</td>
                    <td>${member.email || 'N/A'}</td>
                    <td>${member.phone || 'N/A'}</td>
                    <td>${member.specialization || 'N/A'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-secondary" onclick="editStaff(${member.id})">Edit</button>
                            <button class="btn btn-danger" onclick="deleteStaff(${member.id})">Delete</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading staff:', error);
    }
}

function showStaffModal(id = null) {
    const modal = document.getElementById('staff-modal');
    const form = document.getElementById('staff-form');
    form.reset();
    
    if (id) {
        document.getElementById('staff-modal-title').textContent = 'Edit Staff Member';
        fetch(`${API_URL}/api/staff/${id}`)
            .then(r => r.json())
            .then(member => {
                document.getElementById('staff-id').value = member.id;
                document.getElementById('staff-name').value = member.name;
                document.getElementById('staff-email').value = member.email || '';
                document.getElementById('staff-phone').value = member.phone || '';
                document.getElementById('staff-specialization').value = member.specialization || '';
            });
    } else {
        document.getElementById('staff-modal-title').textContent = 'Add Staff Member';
        document.getElementById('staff-id').value = '';
    }
    
    modal.classList.add('active');
}

async function editStaff(id) {
    showStaffModal(id);
}

async function deleteStaff(id) {
    if (confirm('Are you sure you want to delete this staff member?')) {
        try {
            await fetch(`${API_URL}/api/staff/${id}`, { method: 'DELETE' });
            loadStaff();
        } catch (error) {
            console.error('Error deleting staff member:', error);
        }
    }
}

document.getElementById('staff-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('staff-id').value;
    const data = {
        name: document.getElementById('staff-name').value,
        email: document.getElementById('staff-email').value,
        phone: document.getElementById('staff-phone').value,
        specialization: document.getElementById('staff-specialization').value
    };
    
    try {
        if (id) {
            await fetch(`${API_URL}/api/staff/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            await fetch(`${API_URL}/api/staff`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        
        closeModal('staff-modal');
        loadStaff();
    } catch (error) {
        console.error('Error saving staff member:', error);
    }
});

// Jobs
async function loadJobs() {
    try {
        const jobs = await fetch(`${API_URL}/api/jobs`).then(r => r.json());
        const tbody = document.getElementById('jobs-table');
        
        if (jobs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>No jobs yet</p></td></tr>';
        } else {
            tbody.innerHTML = jobs.map(job => `
                <tr>
                    <td>${job.customer_name}</td>
                    <td>${job.service_name}</td>
                    <td>${job.staff_name || 'Unassigned'}</td>
                    <td>${job.scheduled_date}</td>
                    <td><span class="status-badge status-${job.status}">${job.status.replace('_', ' ')}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-secondary" onclick="editJob(${job.id})">Edit</button>
                            <button class="btn btn-danger" onclick="deleteJob(${job.id})">Delete</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading jobs:', error);
    }
}

async function showJobModal(id = null) {
    const modal = document.getElementById('job-modal');
    const form = document.getElementById('job-form');
    form.reset();
    
    // Load dropdown options
    const customers = await fetch(`${API_URL}/api/customers`).then(r => r.json());
    const services = await fetch(`${API_URL}/api/services`).then(r => r.json());
    const staff = await fetch(`${API_URL}/api/staff`).then(r => r.json());
    
    document.getElementById('job-customer').innerHTML = '<option value="">Select Customer</option>' + 
        customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    document.getElementById('job-service').innerHTML = '<option value="">Select Service</option>' + 
        services.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    document.getElementById('job-staff').innerHTML = '<option value="">Select Staff</option>' + 
        staff.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    
    if (id) {
        document.getElementById('job-modal-title').textContent = 'Edit Job';
        fetch(`${API_URL}/api/jobs/${id}`)
            .then(r => r.json())
            .then(job => {
                document.getElementById('job-id').value = job.id;
                document.getElementById('job-customer').value = job.customer_id;
                document.getElementById('job-service').value = job.service_id;
                document.getElementById('job-staff').value = job.staff_id || '';
                document.getElementById('job-date').value = job.scheduled_date;
                document.getElementById('job-status').value = job.status;
                document.getElementById('job-notes').value = job.notes || '';
            });
    } else {
        document.getElementById('job-modal-title').textContent = 'Schedule Job';
        document.getElementById('job-id').value = '';
        document.getElementById('job-status').value = 'scheduled';
    }
    
    modal.classList.add('active');
}

async function editJob(id) {
    await showJobModal(id);
}

async function deleteJob(id) {
    if (confirm('Are you sure you want to delete this job?')) {
        try {
            await fetch(`${API_URL}/api/jobs/${id}`, { method: 'DELETE' });
            loadJobs();
        } catch (error) {
            console.error('Error deleting job:', error);
        }
    }
}

document.getElementById('job-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('job-id').value;
    const data = {
        customer_id: parseInt(document.getElementById('job-customer').value),
        service_id: parseInt(document.getElementById('job-service').value),
        staff_id: document.getElementById('job-staff').value ? parseInt(document.getElementById('job-staff').value) : null,
        scheduled_date: document.getElementById('job-date').value,
        status: document.getElementById('job-status').value,
        notes: document.getElementById('job-notes').value
    };
    
    try {
        if (id) {
            await fetch(`${API_URL}/api/jobs/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            await fetch(`${API_URL}/api/jobs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        
        closeModal('job-modal');
        loadJobs();
    } catch (error) {
        console.error('Error saving job:', error);
    }
});

// Invoices
async function loadInvoices() {
    try {
        const invoices = await fetch(`${API_URL}/api/invoices`).then(r => r.json());
        const tbody = document.getElementById('invoices-table');
        
        if (invoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><p>No invoices yet</p></td></tr>';
        } else {
            tbody.innerHTML = invoices.map(invoice => `
                <tr>
                    <td>#${invoice.id}</td>
                    <td>${invoice.customer_name}</td>
                    <td>${invoice.service_name}</td>
                    <td>$${invoice.amount.toFixed(2)}</td>
                    <td>${invoice.due_date}</td>
                    <td><span class="status-badge status-${invoice.status}">${invoice.status}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-secondary" onclick="markInvoicePaid(${invoice.id}, '${invoice.status}')">
                                ${invoice.status === 'paid' ? 'Mark Pending' : 'Mark Paid'}
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading invoices:', error);
    }
}

async function showInvoiceModal(id = null) {
    const modal = document.getElementById('invoice-modal');
    const form = document.getElementById('invoice-form');
    form.reset();
    
    // Load jobs for dropdown
    const jobs = await fetch(`${API_URL}/api/jobs`).then(r => r.json());
    document.getElementById('invoice-job').innerHTML = '<option value="">Select Job</option>' + 
        jobs.map(j => `<option value="${j.id}">${j.customer_name} - ${j.service_name} (${j.scheduled_date})</option>`).join('');
    
    if (id) {
        document.getElementById('invoice-modal-title').textContent = 'Edit Invoice';
        document.getElementById('invoice-id').value = id;
    } else {
        document.getElementById('invoice-modal-title').textContent = 'Create Invoice';
        document.getElementById('invoice-id').value = '';
        document.getElementById('invoice-status').value = 'pending';
    }
    
    modal.classList.add('active');
}

async function markInvoicePaid(id, currentStatus) {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    const paidDate = newStatus === 'paid' ? new Date().toISOString().split('T')[0] : null;
    
    try {
        await fetch(`${API_URL}/api/invoices/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, paid_date: paidDate })
        });
        loadInvoices();
    } catch (error) {
        console.error('Error updating invoice:', error);
    }
}

document.getElementById('invoice-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('invoice-id').value;
    const data = {
        job_id: parseInt(document.getElementById('invoice-job').value),
        amount: parseFloat(document.getElementById('invoice-amount').value),
        due_date: document.getElementById('invoice-due-date').value,
        status: document.getElementById('invoice-status').value
    };
    
    try {
        if (id) {
            await fetch(`${API_URL}/api/invoices/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            await fetch(`${API_URL}/api/invoices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        
        closeModal('invoice-modal');
        loadInvoices();
    } catch (error) {
        console.error('Error saving invoice:', error);
    }
});

// Modal utilities
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Initialize
loadDashboard();
