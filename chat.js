document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user) {
        window.location.href = '/';
        return;
    }

    const chatMessages = document.getElementById('chatMessages');
    const chatForm = document.getElementById('chatForm');
    const messageInput = document.getElementById('messageInput');
    const teamList = document.getElementById('teamList');

    function addMessage(username, role, content, timestamp) {
        const messageElement = document.createElement('div');
        messageElement.className = 'mb-2 p-2 rounded';
        if (role === 'evaluator') {
            messageElement.className += ' bg-yellow-100';
        }
        messageElement.innerHTML = `<strong>${username} (${role}):</strong> ${content} <small class="text-gray-500">(${new Date(timestamp).toLocaleString()})</small>`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function fetchWithAuth(url, options = {}) {
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
            return;
        }
        return response;
    }

    async function fetchMessages() {
        try {
            const response = await fetchWithAuth('/api/messages');
            const messages = await response.json();
            chatMessages.innerHTML = '';
            messages.sort((a, b) => {
                if (a.role === 'evaluator' && b.role !== 'evaluator') return -1;
                if (b.role === 'evaluator' && a.role !== 'evaluator') return 1;
                return new Date(b.timestamp) - new Date(a.timestamp);
            });
            messages.forEach(msg => addMessage(msg.username, msg.role, msg.content, msg.timestamp));
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }

    async function fetchTeams() {
        try {
            const response = await fetchWithAuth('/api/teams');
            const teams = await response.json();
            teamList.innerHTML = '';
            teams.forEach(team => {
                const teamElement = document.createElement('div');
                teamElement.className = 'mb-4 p-2 bg-gray-100 rounded';
                teamElement.innerHTML = `
                    <h3 class="font-bold">${team.name}</h3>
                    <p>Topic: ${team.topic}</p>
                    <p>Status: ${team.status}</p>
                    <p>Score: ${team.score}</p>
                `;
                
                if (user.role === 'evaluator') {
                    const scoreInput = document.createElement('input');
                    scoreInput.type = 'number';
                    scoreInput.min = '0';
                    scoreInput.max = '100';
                    scoreInput.value = team.score;
                    scoreInput.className = 'w-full p-1 mb-2 border rounded';
                    
                    const updateButton = document.createElement('button');
                    updateButton.textContent = 'Update Score';
                    updateButton.className = 'bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600';
                    updateButton.addEventListener('click', () => updateTeam(team.id, { score: scoreInput.value }));
                    
                    teamElement.appendChild(scoreInput);
                    teamElement.appendChild(updateButton);
                }
                
                if (user.role === 'admin') {
                    const disqualifyButton = document.createElement('button');
                    disqualifyButton.textContent = team.status === 'active' ? 'Disqualify' : 'Reactivate';
                    disqualifyButton.className = 'bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600';
                    disqualifyButton.addEventListener('click', () => updateTeam(team.id, { status: team.status === 'active' ? 'disqualified' : 'active' }));
                    
                    teamElement.appendChild(disqualifyButton);
                }
                
                teamList.appendChild(teamElement);
            });
        } catch (error) {
            console.error('Error fetching teams:', error);
        }
    }

    async function updateTeam(teamId, data) {
        try {
            const response = await fetchWithAuth('/api/teams', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ team_id: teamId, ...data })
            });
            const result = await response.json();
            if (result.success) {
                fetchTeams();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Error updating team:', error);
            alert('An error occurred. Please try again.');
        }
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = messageInput.value.trim();
        if (content) {
            try {
                const response = await fetchWithAuth('/api/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ content })
                });
                const result = await response.json();
                if (result.success) {
                    messageInput.value = '';
                    fetchMessages();
                } else {
                    alert(result.message);
                }
            } catch (error) {
                console.error('Error sending message:', error);
                alert('An error occurred. Please try again.');
            }
        }
    });

    fetchMessages();
    fetchTeams();
    setInterval(fetchMessages, 5000);
    setInterval(fetchTeams, 10000);
});