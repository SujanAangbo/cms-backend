// Base URL for API requests
const API_BASE_URL = '/api';

// DOM Elements
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const loginContainer = document.getElementById('login-container');
const dashboard = document.getElementById('dashboard');
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const userRole = document.getElementById('user-role');
const logoutBtn = document.getElementById('logout-btn');

// Check if user is already logged in (has valid cookie)
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            credentials: 'include', // Important for cookies
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            // If we can refresh the token, user is logged in
            const userData = localStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                showDashboard(user);
            } else {
                // We have a valid token but no user data, fetch user profile
                await fetchUserProfile();
            }
        }
    } catch (error) {
        console.error('Error checking authentication status:', error);
    }
});

// Login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            credentials: 'include', // Important for cookies
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store user data in localStorage for convenience
            localStorage.setItem('user', JSON.stringify(data.data.user));
            showDashboard(data.data.user);
        } else {
            loginError.textContent = data.message || 'Login failed';
            loginError.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = 'An error occurred during login';
        loginError.classList.remove('hidden');
    }
});

// Logout button click
logoutBtn.addEventListener('click', async () => {
    try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include' // Important for cookies
        });
        
        // Clear local storage
        localStorage.removeItem('user');
        
        // Show login form
        showLoginForm();
    } catch (error) {
        console.error('Logout error:', error);
    }
});

// Fetch user profile based on role
async function fetchUserProfile() {
    try {
        // First, we need to know the user's role
        const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!userResponse.ok) {
            throw new Error('Failed to fetch user data');
        }

        const userData = await userResponse.json();
        const user = userData.data;
        
        // Store user data and show dashboard
        localStorage.setItem('user', JSON.stringify(user));
        showDashboard(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        showLoginForm();
    }
}

// Show dashboard with user info
function showDashboard(user) {
    // Update user info
    userName.textContent = `${user.firstName} ${user.lastName}`;
    userEmail.textContent = user.email;
    userRole.textContent = user.role;

    // Hide login, show dashboard
    loginContainer.classList.add('hidden');
    dashboard.classList.remove('hidden');
}

// Show login form
function showLoginForm() {
    loginContainer.classList.remove('hidden');
    dashboard.classList.add('hidden');
    loginForm.reset();
}