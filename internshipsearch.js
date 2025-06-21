document.addEventListener('DOMContentLoaded', function() {
    console.log('page loaded, starting to load data...');
    loadInternships();
    loadCompanies();
    loadLocations();
});

async function loadInternships() {
    console.log('loading internships...');
    try {
        const response = await fetch('http://localhost:3000/internships', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('internships response status:', response.status);

        if (!response.ok) {
            throw new Error('failed to load internships');
        }

        const internships = await response.json();
        console.log('internships loaded:', internships);
        displayInternships(internships);
    } catch (error) {
        console.error('error loading internships:', error);
        document.getElementById('internshipsTableBody').innerHTML = 
            '<tr><td colspan="8" align="center">error loading internships</td></tr>';
    }
}

async function loadCompanies() {
    console.log('loading companies...');
    try {
        const response = await fetch('http://localhost:3000/companies', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('companies response status:', response.status);

        if (!response.ok) {
            throw new Error('failed to load companies');
        }

        const companies = await response.json();
        console.log('companies loaded:', companies);
        populateCompanyDropdown(companies);
    } catch (error) {
        console.error('error loading companies:', error);
    }
}

async function loadLocations() {
    console.log('loading locations...');
    try {
        const response = await fetch('http://localhost:3000/locations', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('locations response status:', response.status);

        if (!response.ok) {
            throw new Error('failed to load locations');
        }

        const locations = await response.json();
        console.log('locations loaded:', locations);
        populateLocationDropdown(locations);
    } catch (error) {
        console.error('error loading locations:', error);
    }
}

function populateCompanyDropdown(companies) {
    const dropdown = document.getElementById('companyDropdown');
    if (!dropdown) {
        console.error('company dropdown not found');
        return;
    }
    
    console.log('populating company dropdown with:', companies);
    dropdown.innerHTML = '<option value="" disabled selected hidden>select...</option>';
    companies.forEach(company => {
        const option = document.createElement('option');
        option.value = company;
        option.textContent = company;
        dropdown.appendChild(option);
    });
}

function populateLocationDropdown(locations) {
    const dropdown = document.getElementById('locationDropdown');
    if (!dropdown) {
        console.error('location dropdown not found');
        return;
    }
    
    console.log('populating location dropdown with:', locations);
    dropdown.innerHTML = '<option value="" disabled selected hidden>select...</option>';
    locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        dropdown.appendChild(option);
    });
}

function displayInternships(internships) {
    const container = document.getElementById('internshipsTableBody');
    if (!container) {
        console.error('internships table body not found');
        return;
    }
    
    console.log('displaying internships:', internships);
    
    if (internships.length === 0) {
        console.log('no internships found, showing empty message');
        container.innerHTML = '<tr><td colspan="8" align="center">no internships found</td></tr>';
        return;
    }
    
    const html = internships.map(internship => `
        <tr>
            <td align="center">${internship.company_name || 'n/a'}</td>
            <td align="center">${internship.title || 'n/a'}</td>
            <td align="center">${internship.type || 'n/a'}</td>
            <td align="center">${internship.skills || 'n/a'}</td>
            <td align="center">${internship.salary ? internship.salary + ' aed' : 'n/a'}</td>
            <td align="center">${formatDate(internship.start_date)} - ${formatDate(internship.end_date)}</td>
            <td align="center">${formatDate(internship.deadline)}</td>
            <td align="center">${internship.description || 'n/a'}</td>
        </tr>
    `).join('');
    
    container.innerHTML = html;
    console.log('internships displayed successfully');
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.ligformmid');
    if (form) {
        form.addEventListener('submit', async function(event) {
            event.preventDefault();
            console.log('filter form submitted');
            
            const formData = new FormData(event.target);
            const company = formData.get('company') || '';
            const type = formData.get('seartype') || '';
            const location = formData.get('searloc') || '';
            const salary = document.getElementById('searsal')?.value || '';
            
            console.log('filter values:', { company, type, location, salary });
            
            if (!company && !type && !location && (!salary || salary === '1000')) {
                console.log('no filters selected, loading all internships');
                loadInternships();
                return;
            }
            
            try {
                let url = 'http://localhost:3000/internships/filter?';
                const params = new URLSearchParams();
                
                if (company) params.append('company', company);
                if (type) params.append('type', type);
                if (location) params.append('location', location);
                if (salary && salary !== '1000') params.append('salary', salary);
                
                console.log('filtering with URL:', url + params.toString());
                
                const response = await fetch(url + params.toString(), {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('failed to filter internships');
                }

                const internships = await response.json();
                console.log('filtered internships:', internships);
                displayInternships(internships);
            } catch (error) {
                console.error('error filtering internships:', error);
                alert('error filtering internships');
            }
        });
    } else {
        console.error('filter form not found');
    }
});

function getSalary(value) {
    const numberElement = document.getElementById('number');
    if (numberElement) {
        numberElement.textContent = value + '+ aed';
    }
}

function formatDate(dateString) {
    if (!dateString) return 'n/a';
    return new Date(dateString).toLocaleDateString();
}

document.addEventListener('DOMContentLoaded', function() {
    const logoutLink = document.querySelector('a[href="home.html"]');
    if (logoutLink) {
        logoutLink.addEventListener('click', async function(event) {
            event.preventDefault();
            try {
                const response = await fetch('http://localhost:3000/student/logout', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    console.log('logged out successfully');
                } else {
                    console.error('logout failed');
                }
            } catch (error) {
                console.error('logout error:', error);
            }
            
            window.location.href = 'home.html';
        });
    }
});
