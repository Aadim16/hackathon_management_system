document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const message = document.getElementById('message');
    const roleSelect = document.getElementById('role');
    const teamFields = document.getElementById('teamFields');
    const teamNameInput = document.getElementById('teamName');
    const teamTopicSelect = document.getElementById('teamTopic');

    // Show/hide team fields based on role selection
    roleSelect.addEventListener('change', function() {
        if (this.value === 'student') {
            teamFields.classList.remove('hidden');
            teamNameInput.required = true;
            teamTopicSelect.required = true;
        } else {
            teamFields.classList.add('hidden');
            teamNameInput.required = false;
            teamTopicSelect.required = false;
        }
    });

    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        message.textContent = '';
        message.className = 'mt-4 text-center text-sm';

        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            role: roleSelect.value
        };

        if (roleSelect.value === 'student') {
            formData.teamName = teamNameInput.value;
            formData.teamTopic = teamTopicSelect.value;
            
            if (!formData.teamName || !formData.teamTopic) {
                message.textContent = 'Please fill in all team information';
                message.className += ' text-red-500';
                return;
            }
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                message.textContent = 'Registration successful! Redirecting to login...';
                message.className += ' text-green-500';
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                message.textContent = data.message || 'Registration failed';
                message.className += ' text-red-500';
            }
        } catch (error) {
            console.error('Error:', error);
            message.textContent = 'An error occurred. Please try again.';
            message.className += ' text-red-500';
        }
    });

    // Set initial state of team fields based on default role
    if (roleSelect.value === 'student') {
        teamFields.classList.remove('hidden');
        teamNameInput.required = true;
        teamTopicSelect.required = true;
    }
});