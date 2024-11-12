document.addEventListener('DOMContentLoaded', function() {
    const app = Vue.createApp({
        data() {
            return {
                view: 'teams',
                teams: [],
                messages: [],
                newMessage: '',
                announcement: '',
                token: localStorage.getItem('token'),
                user: JSON.parse(localStorage.getItem('user'))
            }
        },
        mounted() {
            if (!this.token || !this.user) {
                window.location.href = '/';
                return;
            }
            this.fetchTeams();
            this.fetchMessages();
            setInterval(this.fetchMessages, 5000);
            setInterval(this.fetchTeams, 10000);
        },
        methods: {
            async fetchWithAuth(url, options = {}) {
                const headers = {
                    ...options.headers,
                    'Authorization': `Bearer ${this.token}`
                };
                const response = await fetch(url, { ...options, headers });
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/';
                    return;
                }
                return response;
            },
            async fetchTeams() {
                try {
                    const response = await this.fetchWithAuth('/teams');
                    const data = await response.json();
                    if (data.success) {
                        this.teams = data.data;
                    }
                } catch (error) {
                    console.error('Error fetching teams:', error);
                }
            },
            async updateTeam(team) {
                try {
                    const response = await this.fetchWithAuth('/teams', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            id: team.id,
                            status: team.status,
                            marking: team.marking
                        })
                    });
                    const result = await response.json();
                    if (result.success) {
                        console.log('Team updated successfully');
                        this.fetchTeams();
                    } else {
                        alert(result.message || 'Failed to update team');
                    }
                } catch (error) {
                    console.error('Error updating team:', error);
                    alert('An error occurred. Please try again.');
                }
            },
            async removeTeam(teamId) {
                try {
                    const response = await this.fetchWithAuth('/teams', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ id: teamId, status: 'removed' })
                    });
                    const result = await response.json();
                    if (result.success) {
                        this.fetchTeams();
                    } else {
                        alert('Failed to remove team');
                    }
                } catch (error) {
                    console.error('Error removing team:', error);
                    alert('An error occurred. Please try again.');
                }
            },
            async fetchMessages() {
                try {
                    const response = await this.fetchWithAuth('/messages');
                    const data = await response.json();
                    if (data.success) {
                        this.messages = data.data;
                    }
                } catch (error) {
                    console.error('Error fetching messages:', error);
                }
            },
            async sendMessage() {
                if (!this.newMessage.trim()) return;

                try {
                    const response = await this.fetchWithAuth('/messages', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ content: this.newMessage })
                    });
                    const result = await response.json();
                    if (result.success) {
                        this.newMessage = '';
                        this.fetchMessages();
                    } else {
                        alert(result.message || 'Failed to send message');
                    }
                } catch (error) {
                    console.error('Error sending message:', error);
                    alert('An error occurred. Please try again.');
                }
            },
            async sendAnnouncement() {
                if (!this.announcement.trim()) return;

                try {
                    const response = await this.fetchWithAuth('/messages', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ content: this.announcement, isAnnouncement: true })
                    });
                    const result = await response.json();
                    if (result.success) {
                        alert('Announcement sent successfully');
                        this.announcement = '';
                        this.fetchMessages();
                    } else {
                        alert('Failed to send announcement');
                    }
                } catch (error) {
                    console.error('Error sending announcement:', error);
                    alert('An error occurred. Please try again.');
                }
            },
            formatDate(timestamp) {
                return new Date(timestamp).toLocaleString();
            }
        }
    });

    app.mount('#app');
});