const apiUrl = 'http://localhost:3000/pets';

document.getElementById('add-pet-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const pet = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pet),
        });

        if (response.ok) {
            alert('Pet added successfully!');
            event.target.reset();
        } else {
            alert('Error adding pet!');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to connect to the server!');
    }
});
