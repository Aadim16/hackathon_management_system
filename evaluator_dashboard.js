document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    fetchTeams();
    fetchMessages();

    async function fetchTeams() {
        try {
            const response = await fetch('/teams', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                const teamList = document.getElementById('teamList');
                teamList.innerHTML = data.data.map(team => `
                    <div class="team">
                        <h3>${team.name}</h3>
                        <p><strong>Category:</strong> ${team.category}</p>
                        <p><strong>Current Score:</strong> ${team.marking}</p>
                        <input type="number" id="score-${team.id}" value="${team.marking}">
                        <button onclick="updateScore('${team.id}')">Update Score</button>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error fetching teams:', error);
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

    window.updateScore = async function(teamId) {
        const newScore = document.getElementById(`score-${teamId}`).value;
        try {
            const response = await fetch('/teams', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ id: teamId, marking: newScore })
            });
            const result = await response.json();
            if (result.success) {
                alert('Score updated successfully');
                fetchTeams();
            } else {
                alert('Failed to update score');
            }
        } catch (error) {
            console.error('Error updating score:', error);
            alert('An error occurred. Please try again.');
        }
    };
});