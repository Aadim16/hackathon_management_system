document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const message = document.getElementById('message');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        message.textContent = '';
        message.className = 'mt-4 text-center text-sm';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.user));
                message.textContent = 'Login successful! Redirecting...';
                message.className += ' text-green-500';
                setTimeout(() => {
                    window.location.href = '/chat';
                }, 1000);
            } else {
                message.textContent = data.message || 'Login failed';
                message.className += ' text-red-500';
            }
        } catch (error) {
            console.error('Error:', error);
            message.textContent = 'An error occurred. Please try again.';
            message.className += ' text-red-500';
        }
    });
});