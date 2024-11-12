document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    fetchTeamInfo();
    fetchMessages();

    async function fetchTeamInfo() {
        try {
            const response = await fetch('/teams', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                const user = JSON.parse(localStorage.getItem('user'));
                const team = data.data.find(t => t.leader.id === user.id);
                if (team) {
                    document.getElementById('teamDetails').innerHTML = `
                        <p><strong>Team Name:</strong> ${team.name}</p>
                        <p><strong>Category:</strong> ${team.category}</p>
                        <p><strong>Status:</strong> ${team.status}</p>
                        <p><strong>Current Score:</strong> ${team.marking}</p>
                    `;
                }
            }
        } catch (error) {
            console.error('Error fetching team info:', error);
        }
    }

    async function fetchMessages() {
        try {
            const response = await fetch('/messages', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                const messageList = document.getElementById('messageList');
                messageList.innerHTML = data.data.map(message => `
                    <div class="message">
                        <p><strong>${message.sender.name}:</strong> ${message.content}</p>
                        <small>${new Date(message.timestamp).toLocaleString()}</small>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }
});