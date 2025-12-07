// API Configuration
const API_BASE_URL = window.location.origin; // Same origin - no CORS issues

// API Helper Functions
const api = {
    // POST request
    async post(endpoint, data) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Important for cookies
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            return { ok: response.ok, status: response.status, data: result };
        } catch (error) {
            console.error('API Error:', error);
            return { ok: false, status: 0, data: { error: 'Không thể kết nối đến server' } };
        }
    },

    // GET request
    async get(endpoint) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
            
            const result = await response.json();
            return { ok: response.ok, status: response.status, data: result };
        } catch (error) {
            console.error('API Error:', error);
            return { ok: false, status: 0, data: { error: 'Không thể kết nối đến server' } };
        }
    }
};

// Show error message
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'flex';
    }
}

// Hide error message
function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

// Show success message
function showSuccess(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.className = 'success-message';
        errorElement.style.display = 'flex';
    }
}

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('user') !== null;
}

// Save user to localStorage
function saveUser(userData) {
    localStorage.setItem('user', JSON.stringify(userData));
}

// Get user from localStorage
function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Clear user from localStorage
function clearUser() {
    localStorage.removeItem('user');
}

// Redirect to dashboard if logged in
function redirectIfLoggedIn() {
    if (isLoggedIn()) {
        window.location.href = 'dashboard.html';
    }
}

// Redirect to login if not logged in
function requireLogin() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
    }
}
