const apiUrl = 'http://localhost:3000/pets';
let sortOrder = 'age_asc';
let activeFilters = ['dog', 'cat', 'bunny'];

async function fetchPets() {
    const query = new URLSearchParams({
        sortBy: sortOrder,
        type: activeFilters.join(',')
    }).toString();

    const response = await fetch(`${apiUrl}?${query}`);
    const pets = await response.json();
    const tableBody = document.getElementById('pets-table-body');
    tableBody.innerHTML = pets.map(pet => `
        <tr>
            <td>${pet.name}</td>
            <td>${pet.type}</td>
            <td>${pet.age}</td>
        </tr>
    `).join('');
}

document.getElementById('age-header').addEventListener('click', () => {
    sortOrder = sortOrder === 'age_asc' ? 'age_dsc' : 'age_asc';
    document.getElementById('age-header').textContent = sortOrder === 'age_asc' ? 'Age (asc)' : 'Age (dsc)';
    fetchPets();
});

document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', () => {
        const type = button.getAttribute('data-type');
        if (activeFilters.includes(type)) {
            activeFilters = activeFilters.filter(filter => filter !== type);
            button.classList.remove('active');
        } else {
            activeFilters.push(type);
            button.classList.add('active');
        }
        fetchPets();
    });
});

fetchPets();
