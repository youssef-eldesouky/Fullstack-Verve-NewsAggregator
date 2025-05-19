// Global Variables
let currentUser = null;
let userInterests = [];
let allInterests = [];
let currentArticle = null;

// Test credentials for demo purposes (remove in production)
const TEST_CREDENTIALS = {
    username: 'test',
    password: 'test123',
    id: 1
};

// API URLs for backend communication
const API_URL = {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    sessionCheck: '/api/auth/session-check',
    getInterests: '/api/interests',
    getUserInterests: '/api/interests/users/',
    updateUserInterests: '/api/interests/users/',
    getFeedArticles: '/api/posts/feed',
    getUserArticles: '/api/posts/user',
    getSurpriseArticles: '/api/posts/surprise',
    createArticle: '/api/posts',
    getArticleById: '/api/posts/',  // NEW endpoint for getting an article by ID
    updateArticle: '/api/posts/',
    deleteArticle: '/api/posts/',
    getArticleComments: '/api/comments/post/',
    createComment: '/api/comments/add',
    updateComment: '/api/comments/update/',
    deleteComment: '/api/comments/delete/'
};

// DOM Elements
const DOM = {
    // Sections
    authSection: document.getElementById('auth-section'),
    homeSection: document.getElementById('home-section'),
    profileSection: document.getElementById('profile-section'),
    surpriseSection: document.getElementById('surprise-section'),
    
    // Auth Elements
    authMessageContainer: document.getElementById('auth-message-container'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    loginTab: document.getElementById('login-tab'),
    registerTab: document.getElementById('register-tab'),
    loginUsername: document.getElementById('login-username'),
    loginPassword: document.getElementById('login-password'),
    registerUsername: document.getElementById('register-username'),
    registerEmail: document.getElementById('register-email'),
    registerPassword: document.getElementById('register-password'),
    registerConfirmPassword: document.getElementById('register-confirm-password'),
    interestsContainer: document.getElementById('interests-container'),
    rememberMe: document.getElementById('remember-me'),
    goToRegisterLink: document.getElementById('go-to-register'),
    goToLoginLink: document.getElementById('go-to-login'),
    passwordStrength: document.querySelector('.password-strength'),
    passwordStrengthText: document.querySelector('.password-strength-text'),
    togglePasswordButtons: document.querySelectorAll('.toggle-password'),
    
    // Navigation
    navHome: document.getElementById('nav-home'),
    navProfile: document.getElementById('nav-profile'),
    navSurprise: document.getElementById('nav-surprise'),
    navWeather: document.getElementById('nav-weather'),
    navLogout: document.getElementById('nav-logout'),
    profileNavHome: document.getElementById('profile-nav-home'),
    profileNavProfile: document.getElementById('profile-nav-profile'),
    profileNavSurprise: document.getElementById('profile-nav-surprise'),
    profileNavWeather: document.getElementById('profile-nav-weather'),
    profileNavLogout: document.getElementById('profile-nav-logout'),
    surpriseNavHome: document.getElementById('surprise-nav-home'),
    surpriseNavProfile: document.getElementById('surprise-nav-profile'),
    surpriseNavSurprise: document.getElementById('surprise-nav-surprise'),
    surpriseNavWeather: document.getElementById('surprise-nav-weather'),
    surpriseNavLogout: document.getElementById('surprise-nav-logout'),
    
    // Feed Content
    feedContainer: document.getElementById('feed-container'),
    
    // Profile Content
    profileUsername: document.getElementById('profile-username'),
    editInterestsBtn: document.getElementById('edit-interests-btn'),
    profileInterestsSection: document.getElementById('profile-interests-section'),
    profileInterestsContainer: document.getElementById('profile-interests-container'),
    saveInterestsBtn: document.getElementById('save-interests-btn'),
    profilePostsContainer: document.getElementById('profile-posts-container'),
    createPostBtn: document.getElementById('create-post-btn'),
    
    // Surprise Content
    surpriseContainer: document.getElementById('surprise-container'),
    featuredSurpriseContainer: document.getElementById('featured-surprise-container'),
    refreshSurpriseBtn: document.getElementById('refresh-surprise-btn'),
    categoryFilter: document.getElementById('surprise-category-filter'),
    
    // Modals
    createPostModal: document.getElementById('create-post-modal'),
    articleModal: document.getElementById('article-modal'),
    createPostForm: document.getElementById('create-post-form'),
    postTitle: document.getElementById('post-title'),
    postContent: document.getElementById('post-content'),
    postInterestsContainer: document.getElementById('post-interests-container'),
    articleModalTitle: document.getElementById('article-modal-title'),
    articleModalMetadata: document.getElementById('article-modal-metadata'),
    articleModalContent: document.getElementById('article-modal-content'),
    commentsContainer: document.getElementById('comments-container'),
    commentForm: document.getElementById('comment-form'),
    commentContent: document.getElementById('comment-content'),
    
    // Date Display
    currentDate: document.getElementById('current-date'),
    homeCurrentDate: document.getElementById('home-current-date'),
    profileCurrentDate: document.getElementById('profile-current-date'),
    surpriseCurrentDate: document.getElementById('surprise-current-date'),
    
    // Close Modal Buttons
    closeModalButtons: document.querySelectorAll('.close-modal')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// Initialize Application Function
function initApp() {
    // Set Current Date
    setCurrentDate();
    
    // Add Event Listeners
    addEventListeners();
    
    // Load Interests for Registration
    loadInterests();
    
    // Check if user is already logged in
    checkAuth();
}

// Set Current Date
function setCurrentDate() {
    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    
    DOM.currentDate.textContent = formattedDate;
    DOM.homeCurrentDate.textContent = formattedDate;
    DOM.profileCurrentDate.textContent = formattedDate;
    DOM.surpriseCurrentDate.textContent = formattedDate;
}

// Check Authentication Status
function checkAuth() {
    const savedUser = localStorage.getItem('user');
    
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            userInterests = JSON.parse(localStorage.getItem('userInterests') || '[]');
            
            // Connect to notification stream if needed
            if (notificationHandler) {
                console.log('Connecting to SSE from checkAuth for user:', currentUser.id);
                notificationHandler.connectSSE();
                
                // Set up user notification observer
                if (typeof UserNotificationObserverFrontend !== 'undefined') {
                    const observer = new UserNotificationObserverFrontend();
                    observer.setUserId(currentUser.id);
                }
            }
            
            showSection(DOM.homeSection);
            loadFeed();
        } catch (error) {
            console.error('Error parsing saved user data:', error);
            localStorage.removeItem('user');
            localStorage.removeItem('userInterests');
            showSection(DOM.authSection);
        }
    } else {
        showSection(DOM.authSection);
    }
}

// Add Event Listeners
function addEventListeners() {
    // Auth Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const tabId = btn.getAttribute('data-tab');
            if (tabId === 'login') {
                DOM.loginTab.classList.remove('hidden');
                DOM.registerTab.classList.add('hidden');
            } else {
                DOM.loginTab.classList.add('hidden');
                DOM.registerTab.classList.remove('hidden');
            }
            
            // Clear any messages when switching tabs
            clearAuthMessages();
        });
    });
    
    // Go to Register/Login Links
    if (DOM.goToRegisterLink) {
        DOM.goToRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector('.tab-btn[data-tab="register"]').click();
        });
    }
    
    if (DOM.goToLoginLink) {
        DOM.goToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector('.tab-btn[data-tab="login"]').click();
        });
    }
    
    // Show/Hide Password
    DOM.togglePasswordButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            if (input.type === 'password') {
                input.type = 'text';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            }
        });
    });
    
    // Password Strength Meter
    if (DOM.registerPassword) {
        DOM.registerPassword.addEventListener('input', checkPasswordStrength);
    }
    
    // Auth Forms
    DOM.loginForm.addEventListener('submit', handleLogin);
    DOM.registerForm.addEventListener('submit', handleRegister);
    
    // Navigation
    DOM.navHome.addEventListener('click', () => showSection(DOM.homeSection));
    DOM.navProfile.addEventListener('click', () => {
        showSection(DOM.profileSection);
        loadProfile();
    });
    DOM.navSurprise.addEventListener('click', () => {
        showSection(DOM.surpriseSection);
        loadSurpriseArticles();
    });
    // Add weather navigation
    if (DOM.navWeather) {
        DOM.navWeather.addEventListener('click', () => {
            window.location.href = 'weather.html';
        });
    }
    DOM.navLogout.addEventListener('click', handleLogout);
    
    DOM.profileNavHome.addEventListener('click', () => showSection(DOM.homeSection));
    DOM.profileNavProfile.addEventListener('click', () => {
        showSection(DOM.profileSection);
        loadProfile();
    });
    DOM.profileNavSurprise.addEventListener('click', () => {
        showSection(DOM.surpriseSection);
        loadSurpriseArticles();
    });
    // Add weather navigation from profile page
    if (DOM.profileNavWeather) {
        DOM.profileNavWeather.addEventListener('click', () => {
            window.location.href = 'weather.html';
        });
    }
    DOM.profileNavLogout.addEventListener('click', handleLogout);
    
    DOM.surpriseNavHome.addEventListener('click', () => showSection(DOM.homeSection));
    DOM.surpriseNavProfile.addEventListener('click', () => {
        showSection(DOM.profileSection);
        loadProfile();
    });
    DOM.surpriseNavSurprise.addEventListener('click', () => {
        showSection(DOM.surpriseSection);
        loadSurpriseArticles();
    });
    // Add weather navigation from surprise page
    if (DOM.surpriseNavWeather) {
        DOM.surpriseNavWeather.addEventListener('click', () => {
            window.location.href = 'weather.html';
        });
    }
    DOM.surpriseNavLogout.addEventListener('click', handleLogout);
    
    // Profile Interactions
    DOM.editInterestsBtn.addEventListener('click', toggleEditInterests);
    DOM.saveInterestsBtn.addEventListener('click', saveUpdatedInterests);
    DOM.createPostBtn.addEventListener('click', showCreatePostModal);
    
    // Modal Interactions
    DOM.createPostForm.addEventListener('submit', handleCreatePost);
    DOM.commentForm.addEventListener('submit', handleAddComment);
    
    // Close Modals
    DOM.closeModalButtons.forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    // Close Modal on Outside Click
    window.addEventListener('click', (e) => {
        if (e.target === DOM.createPostModal) {
            closeAllModals();
        }
        if (e.target === DOM.articleModal) {
            closeAllModals();
        }
    });
    
    // Surprise Me Interactions
    if (DOM.refreshSurpriseBtn) {
        DOM.refreshSurpriseBtn.addEventListener('click', loadSurpriseArticles);
    }
    
    if (DOM.categoryFilter) {
        DOM.categoryFilter.addEventListener('change', filterSurpriseArticles);
    }
}

// Load Interests for Registration
function loadInterests() {
    // Fetch interests from the API
    fetch(API_URL.getInterests)
    .then(response => response.json())
    .then(interests => {
        // Map the interests to the expected format
        allInterests = interests.map((name, index) => ({
            id: index + 1,
            name: name
        }));
        
        // Populate the interests containers
        populateInterestsContainers(allInterests);
    })
    .catch(error => {
        console.error('Error loading interests:', error);
        // No fallback to mock data - display error message
        DOM.interestsContainer.innerHTML = '<p class="error-message">Unable to load interests. Please refresh the page to try again.</p>';
    });
}

// Populate Interests Containers
function populateInterestsContainers(interests) {
    // Clear existing containers
    DOM.interestsContainer.innerHTML = '';
    DOM.profileInterestsContainer.innerHTML = '';
    DOM.postInterestsContainer.innerHTML = '';
    
    // Populate all containers with the interests
    interests.forEach(interest => {
        const registerInterestHTML = `
            <label class="interest-checkbox" data-id="${interest.id}">
                <input type="checkbox" value="${interest.id}"> ${interest.name}
            </label>
        `;
        DOM.interestsContainer.insertAdjacentHTML('beforeend', registerInterestHTML);
        
        const profileInterestHTML = `
            <label class="interest-checkbox ${userInterests.includes(interest.id) ? 'selected' : ''}" data-id="${interest.id}">
                <input type="checkbox" value="${interest.id}" ${userInterests.includes(interest.id) ? 'checked' : ''}> ${interest.name}
            </label>
        `;
        DOM.profileInterestsContainer.insertAdjacentHTML('beforeend', profileInterestHTML);
        
        const postInterestHTML = `
            <label class="interest-checkbox" data-id="${interest.id}">
                <input type="checkbox" value="${interest.id}"> ${interest.name}
            </label>
        `;
        DOM.postInterestsContainer.insertAdjacentHTML('beforeend', postInterestHTML);
    });
    
    // Add event listeners to the interest checkboxes
    document.querySelectorAll('.interest-checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', function() {
            const input = this.querySelector('input');
            if (input) {
                input.checked = !input.checked;
                this.classList.toggle('selected', input.checked);
            }
        });
    });
}

// Password Strength Check
function checkPasswordStrength() {
    const password = DOM.registerPassword.value;
    let strength = 0;
    let message = '';
    
    // Clear if empty
    if (password.length === 0) {
        DOM.passwordStrength.className = 'password-strength';
        DOM.passwordStrengthText.textContent = '';
        return;
    }
    
    // Length check
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    
    // Character type checks
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    // Set UI based on strength
    if (strength < 2) {
        DOM.passwordStrength.className = 'password-strength password-weak';
        message = 'Weak password';
    } else if (strength < 4) {
        DOM.passwordStrength.className = 'password-strength password-medium';
        message = 'Medium strength password';
    } else {
        DOM.passwordStrength.className = 'password-strength password-strong';
        message = 'Strong password';
    }
    
    DOM.passwordStrengthText.textContent = message;
}

// Show Auth Message
function showAuthMessage(message, type = 'error') {
    // Clear any existing messages
    clearAuthMessages();
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `message-alert ${type}`;
    messageElement.innerHTML = `
        ${message}
        <span class="message-close">&times;</span>
    `;
    
    // Add close button functionality
    const closeBtn = messageElement.querySelector('.message-close');
    closeBtn.addEventListener('click', () => {
        messageElement.remove();
    });
    
    // Add to DOM
    DOM.authMessageContainer.appendChild(messageElement);
    
    // Auto-hide after 8 seconds
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.remove();
        }
    }, 8000);
}

// Clear Auth Messages
function clearAuthMessages() {
    DOM.authMessageContainer.innerHTML = '';
}

// Handle Login
function handleLogin(e) {
    e.preventDefault();
    
    const username = DOM.loginUsername.value.trim();
    const password = DOM.loginPassword.value;
    
    if (!username || !password) {
        showAuthMessage('Please enter both username and password');
        return;
    }
    
    // Show loading state
    const submitBtn = DOM.loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
    
    // Test account shortcut (remove in production)
    if (username === TEST_CREDENTIALS.username && password === TEST_CREDENTIALS.password) {
        // Create a mock user
        currentUser = {
            id: TEST_CREDENTIALS.id,
            username: TEST_CREDENTIALS.username
        };
        
        // Mock interests
        userInterests = allInterests.slice(0, 3).map(i => i.id);
        
        // Save to localStorage if remember me is checked
        if (DOM.rememberMe && DOM.rememberMe.checked) {
            localStorage.setItem('user', JSON.stringify(currentUser));
            localStorage.setItem('userInterests', JSON.stringify(userInterests));
        }
        
        // Show home section
        showSection(DOM.homeSection);
        loadFeed();
        
        // Reset form
        DOM.loginForm.reset();
        
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        
        return;
    }
    
    fetch(API_URL.login, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username,
            password
        }),
        credentials: 'include'
    })
    .then(handleApiResponse)
    .then(data => {
        if (data.success) {
            // Store user data
            currentUser = {
                id: data.data.id,
                username: data.data.username
            };
            
            // Need to fetch interests separately since login doesn't return them
            return fetch(API_URL.getUserInterests + data.data.id, {
                credentials: 'include'
            })
            .then(handleApiResponse)
            .then(interestsData => {
                userInterests = interestsData.data || [];
                
                // Save to localStorage for client-side persistence if remember me is checked
                if (DOM.rememberMe && DOM.rememberMe.checked) {
                    localStorage.setItem('user', JSON.stringify(currentUser));
                    localStorage.setItem('userInterests', JSON.stringify(userInterests));
                } else {
                    // Clear localStorage in case it was previously set
                    localStorage.removeItem('user');
                    localStorage.removeItem('userInterests');
                }
                
                // Connect to notification stream
                if (notificationHandler) {
                    notificationHandler.connectSSE();
                    
                    // Set up user notification observer
                    if (typeof UserNotificationObserverFrontend !== 'undefined') {
                        const observer = new UserNotificationObserverFrontend();
                        observer.setUserId(currentUser.id);
                    }
                }
                
                // Show home section
                showSection(DOM.homeSection);
                loadFeed();
                
                // Reset form
                DOM.loginForm.reset();
            });
        } else {
            // Handle login error
            showAuthMessage(data.message || 'Login failed. Please check your credentials.');
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        showAuthMessage('An error occurred while logging in. Please try again later.');
    })
    .finally(() => {
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    });
}

// Handle Register
function handleRegister(e) {
    e.preventDefault();
    
    const username = DOM.registerUsername.value.trim();
    const email = DOM.registerEmail.value.trim();
    const password = DOM.registerPassword.value;
    const confirmPassword = DOM.registerConfirmPassword.value;
    
    // Basic validation
    if (!username || !email || !password || !confirmPassword) {
        showAuthMessage('Please fill out all registration fields');
        return;
    }
    
    if (password !== confirmPassword) {
        showAuthMessage('Passwords do not match');
        return;
    }
    
    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(username)) {
        showAuthMessage('Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAuthMessage('Please enter a valid email address');
        return;
    }
    
    // Password validation
    if (password.length < 6) {
        showAuthMessage('Password must be at least 6 characters long');
        return;
    }
    
    // Get selected interests
    const selectedInterests = [];
    DOM.interestsContainer.querySelectorAll('input:checked').forEach(input => {
        selectedInterests.push(parseInt(input.value, 10));
    });
    
    if (selectedInterests.length === 0) {
        showAuthMessage('Please select at least one interest');
        return;
    }
    
    // Map interest IDs to names for the backend
    const interestNames = selectedInterests.map(id => {
        const interest = allInterests.find(i => i.id === id);
        return interest ? interest.name : null;
    }).filter(name => name !== null);
    
    // Registration data
    const registerData = {
        username,
        email,
        password,
        interests: interestNames
    };
    
    // Show loading state
    const submitBtn = DOM.registerForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';
    
    // Call Register API
    fetch(API_URL.register, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerData),
        credentials: 'include'
    })
    .then(handleApiResponse)
    .then(data => {
        if (data.success) {
            // Now we need to login with the new credentials
            showAuthMessage('Registration successful! Logging you in...', 'success');
            
            return fetch(API_URL.login, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password
                }),
                credentials: 'include'
            })
            .then(handleApiResponse);
        } else {
            throw new Error(data.message || 'Registration failed. Please try again.');
        }
    })
    .then(data => {
        if (data.success) {
            // Store user data
            currentUser = {
                id: data.data.id,
                username: data.data.username
            };
            
            // Set interests from what we just registered with
            userInterests = interestNames;
            
            // Save to localStorage for client-side persistence
            localStorage.setItem('user', JSON.stringify(currentUser));
            localStorage.setItem('userInterests', JSON.stringify(userInterests));
            
            // Connect to notification stream
            if (notificationHandler) {
                notificationHandler.connectSSE();
                
                // Set up user notification observer
                if (typeof UserNotificationObserverFrontend !== 'undefined') {
                    const observer = new UserNotificationObserverFrontend();
                    observer.setUserId(currentUser.id);
                }
            }
            
            // Show home section
            showSection(DOM.homeSection);
            loadFeed();
            
            // Reset form
            DOM.registerForm.reset();
            
            // Show welcome message via toast
            if (typeof UserNotificationObserverFrontend !== 'undefined') {
                const observer = new UserNotificationObserverFrontend();
                observer.showToast('Welcome to Verve! Your account has been created successfully.');
            }
        } else {
            showAuthMessage(data.message || 'Login failed after registration. Please try manually.');
        }
    })
    .catch(error => {
        console.error('Registration error:', error);
        showAuthMessage(error.message || 'An error occurred during registration. Please try again later.');
    })
    .finally(() => {
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    });
}

// Handle Logout
function handleLogout() {
    fetch(API_URL.logout, {
        method: 'POST',
        credentials: 'include'
    })
    .then(() => {
        // Clear local storage
        localStorage.removeItem('user');
        localStorage.removeItem('userInterests');
        
        // Disconnect notification SSE
        if (notificationHandler) {
            notificationHandler.disconnectSSE();
        }
        
        // Reset current user
        currentUser = null;
        userInterests = [];
        
        // Show auth section
        showSection(DOM.authSection);
    })
    .catch(error => {
        console.error('Logout error:', error);
        
        // Even if logout fails on server, clear client state
        localStorage.removeItem('user');
        localStorage.removeItem('userInterests');
        currentUser = null;
        userInterests = [];
        
        // Disconnect notification SSE
        if (notificationHandler) {
            notificationHandler.disconnectSSE();
        }
        
        // Show auth section
        showSection(DOM.authSection);
    });
}

// Load Feed
function loadFeed() {
    DOM.feedContainer.innerHTML = '<p class="loading">Loading articles...</p>';
    
    // Fetch feed articles from the API
    fetch(API_URL.getFeedArticles, {
        credentials: 'include'
    })
    .then(handleApiResponse)
    .then(articles => {
        renderArticles(DOM.feedContainer, articles);
    })
    .catch(error => {
        handleApiError(error, DOM.feedContainer, loadFeed, 'Unable to load feed articles.');
    });
}

// Load User Profile
function loadProfile() {
    if (!currentUser) return;
    
    // Set username
    DOM.profileUsername.textContent = `${currentUser.username}'s Profile`;
    
    // Fetch user articles from the API
    fetch(API_URL.getUserArticles, {
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load user articles');
        }
        return response.json();
    })
    .then(articles => {
        // Set a flag to always show edit/delete buttons in profile view
        const isUserProfile = true;
        renderArticles(DOM.profilePostsContainer, articles, isUserProfile);
    })
    .catch(error => {
        console.error('Error loading user articles:', error);
        DOM.profilePostsContainer.innerHTML = '<p class="no-articles">Unable to load your articles. Please try again later.</p>';
    });
}

// Load Surprise Articles
function loadSurpriseArticles() {
    // Show loading state
    DOM.featuredSurpriseContainer.innerHTML = '<p class="loading">Finding featured content...</p>';
    DOM.surpriseContainer.innerHTML = '<p class="loading">Loading surprising content...</p>';
    
    // Fetch surprise articles using the backend filter strategy
    fetch(API_URL.getSurpriseArticles, {
        credentials: 'include'
    })
    .then(handleApiResponse)
    .then(articles => {
        // Populate category filter
        populateCategoryFilter(articles);
        
        if (articles.length === 0) {
            DOM.featuredSurpriseContainer.innerHTML = `
                <div class="no-articles">
                    <h3>No surprise content found</h3>
                    <p>We couldn't find any articles outside your interest areas. Try again later!</p>
                </div>
            `;
            DOM.surpriseContainer.innerHTML = '';
        } else {
            // Split into featured and regular articles
            const featuredArticle = articles[0]; // Use the first article as featured
            const regularArticles = articles.slice(1); // Rest of the articles
            
            // Render featured article
            renderFeaturedArticle(featuredArticle);
            
            // Render regular articles
            if (regularArticles.length > 0) {
                renderArticles(DOM.surpriseContainer, regularArticles);
            } else {
                DOM.surpriseContainer.innerHTML = '<p>No additional articles to display.</p>';
            }
        }
    })
    .catch(error => {
        handleApiError(error, DOM.surpriseContainer, loadSurpriseArticles, 'Unable to load surprise content.');
        DOM.featuredSurpriseContainer.innerHTML = '<p class="error-message">Failed to load featured content.</p>';
    });
}

// Render Featured Article
function renderFeaturedArticle(article) {
    if (!article) {
        DOM.featuredSurpriseContainer.innerHTML = '<p>No featured article available.</p>';
        return;
    }
    
    // Determine publisher username - handle different response formats
    let publisherName = 'Unknown';
    if (article.publisher && article.publisher.username) {
        publisherName = article.publisher.username;
    } else if (article.username) {
        publisherName = article.username;
    } else if (article.publisherName) {
        publisherName = article.publisherName;
    } else if (article.publisherUsername) {
        publisherName = article.publisherUsername;
    }
    
    // Get all categories
    const categories = article.category ? [article.category] : [];
    
    const previewLength = 300; // Longer preview for featured article
    const contentPreview = article.content.length > previewLength
        ? article.content.substring(0, previewLength) + '...'
        : article.content;
    
    const featuredHTML = `
        <div class="featured-article" data-id="${article.id}">
            <h2 class="article-title">${article.title}</h2>
            <p class="article-metadata">By ${publisherName} on ${formatDate(article.createdAt || new Date())}</p>
            <p class="article-preview">${contentPreview}</p>
            <div class="article-categories">
                ${categories.map(name => `<span class="article-category">${name}</span>`).join('')}
            </div>
            <a href="#" class="read-more">Continue Reading &raquo;</a>
        </div>
    `;
    
    DOM.featuredSurpriseContainer.innerHTML = featuredHTML;
    
    // Add event listener to the featured article
    const featuredElement = DOM.featuredSurpriseContainer.querySelector('.featured-article');
    if (featuredElement) {
        featuredElement.addEventListener('click', (e) => {
            if (e.target.classList.contains('read-more') || e.target.tagName !== 'A') {
                const articleId = parseInt(featuredElement.getAttribute('data-id'), 10);
                showArticleDetails(articleId);
            }
        });
    }
}

// Populate Category Filter
function populateCategoryFilter(articles) {
    if (!DOM.categoryFilter) return;
    
    // Clear previous options except "All Categories"
    const allOption = DOM.categoryFilter.querySelector('option[value="all"]');
    DOM.categoryFilter.innerHTML = '';
    DOM.categoryFilter.appendChild(allOption);
    
    // Extract unique categories
    const categories = Array.from(new Set(
        articles.map(article => article.category).filter(Boolean)
    ));
    
    // Add options
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        DOM.categoryFilter.appendChild(option);
    });
}

// Filter Surprise Articles
function filterSurpriseArticles() {
    const selectedCategory = DOM.categoryFilter.value;
    
    // Fetch all surprise articles again
    fetch(API_URL.getSurpriseArticles, {
        credentials: 'include'
    })
    .then(handleApiResponse)
    .then(articles => {
        // Filter by selected category if not "all"
        const filteredArticles = selectedCategory === 'all'
            ? articles
            : articles.filter(article => article.category === selectedCategory);
        
        if (filteredArticles.length === 0) {
            DOM.featuredSurpriseContainer.innerHTML = `
                <div class="no-articles">
                    <h3>No articles found</h3>
                    <p>No articles match the selected category. Try a different filter.</p>
                </div>
            `;
            DOM.surpriseContainer.innerHTML = '';
        } else {
            // Split into featured and regular articles
            const featuredArticle = filteredArticles[0];
            const regularArticles = filteredArticles.slice(1);
            
            // Render featured article
            renderFeaturedArticle(featuredArticle);
            
            // Render regular articles
            if (regularArticles.length > 0) {
                renderArticles(DOM.surpriseContainer, regularArticles);
            } else {
                DOM.surpriseContainer.innerHTML = '<p>No additional articles to display.</p>';
            }
        }
    })
    .catch(error => {
        console.error('Error filtering articles:', error);
        showAuthMessage('Failed to filter articles. Please try again.', 'error');
    });
}

// Toggle Edit Interests
function toggleEditInterests() {
    DOM.profileInterestsSection.classList.toggle('hidden');
}

// Save Updated Interests
function saveUpdatedInterests() {
    // Get selected interests
    const selectedInterests = [];
    DOM.profileInterestsContainer.querySelectorAll('input:checked').forEach(input => {
        selectedInterests.push(parseInt(input.value, 10));
    });
    
    if (selectedInterests.length === 0) {
        alert('Please select at least one interest');
        return;
    }
    
    // Map interest IDs to names
    const interestNames = selectedInterests.map(id => {
        const interest = allInterests.find(i => i.id === id);
        return interest ? interest.name : null;
    }).filter(name => name !== null);
    
    // Update user interests in the backend
    fetch(`${API_URL.updateUserInterests}${currentUser.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(interestNames),
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update interests');
        }
        
        // Update local interests
        userInterests = selectedInterests;
        
        // Save to localStorage
        localStorage.setItem('userInterests', JSON.stringify(userInterests));
        
        // Hide interests section
        DOM.profileInterestsSection.classList.add('hidden');
        
        // Reload feed with the new interests
        loadFeed();
    })
    .catch(error => {
        console.error('Error updating interests:', error);
        alert('Failed to update interests: ' + error.message);
        
        // Fallback to local update if API fails
        userInterests = selectedInterests;
        localStorage.setItem('userInterests', JSON.stringify(userInterests));
        DOM.profileInterestsSection.classList.add('hidden');
        loadFeed();
    });
}

// Show Create Post Modal
function showCreatePostModal() {
    DOM.createPostModal.classList.remove('hidden');
    DOM.createPostForm.reset();
}

// Handle Create Post
function handleCreatePost(e) {
    e.preventDefault();
    
    // Check if user is still logged in
    if (!currentUser) {
        alert('Your session has expired. Please log in again.');
        showSection(DOM.authSection);
        return;
    }
    
    const title = DOM.postTitle.value.trim();
    const content = DOM.postContent.value.trim();
    
    if (!title || !content) {
        alert('Please fill in all fields');
        return;
    }
    
    // Get selected interests
    const selectedCategories = [];
    DOM.postInterestsContainer.querySelectorAll('input:checked').forEach(input => {
        selectedCategories.push(parseInt(input.value, 10));
    });
    
    if (selectedCategories.length === 0) {
        alert('Please select at least one category');
        return;
    }
    
    // Get category name from the first selected interest
    const firstInterest = allInterests.find(i => i.id === selectedCategories[0]);
    const category = firstInterest ? firstInterest.name : 'Uncategorized';
    
    // Log request data for debugging
    console.log('Creating article with data:', { title, content, category });
    
    // Call the actual create article API
    fetch(API_URL.createArticle, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title,
            content,
            category
        }),
        credentials: 'include'
    })
    .then(response => {
        // Log raw response for debugging
        console.log('Article creation response status:', response.status);
        
        if (!response.ok) {
            // Session expired
            if (response.status === 401) {
                showSection(DOM.authSection);
                throw new Error('Your session has expired. Please log in again.');
            }
            
            // Try to get more detailed error message
            return response.text().then(text => {
                try {
                    // Try to parse as JSON
                    const json = JSON.parse(text);
                    throw new Error(json.message || 'Failed to create article');
                } catch (e) {
                    // If not JSON, use the raw text
                    throw new Error(`Failed to create article (${response.status}): ${text || 'Unknown error'}`);
                }
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Article created successfully:', data);
        
        // Close modal
        closeAllModals();
        
        // If on profile page, reload profile
        if (!DOM.profileSection.classList.contains('hidden')) {
            loadProfile();
        } else {
            // Otherwise reload the feed to show the new article
            loadFeed();
        }
    })
    .catch(error => {
        console.error('Error creating article:', error);
        alert(error.message);
    });
}

// Show Article Details
function showArticleDetails(articleId) {
    DOM.articleModal.classList.remove('hidden');
    
    // Remove any existing article action buttons
    const existingActions = DOM.articleModal.querySelector('.article-modal-actions');
    if (existingActions) {
        existingActions.remove();
    }
    
    // Fetch article details from the API
    fetch(API_URL.getArticleById + articleId, {
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Failed to load article: ${response.status}`);
        }
        return response.json();
    })
    .then(article => {
        currentArticle = article;
        
        console.log('Article details loaded:', article);
        console.log('Current user:', currentUser);
        
        // Determine publisher username - handle different response formats
        let publisherName = 'Unknown';
        if (article.publisher && article.publisher.username) {
            publisherName = article.publisher.username;
        } else if (article.username) {
            publisherName = article.username;
        } else if (article.publisherName) {
            publisherName = article.publisherName;
        } else if (article.publisherUsername) {
            publisherName = article.publisherUsername;
        }
        
        // Check if current user is the author
        const isAuthor = currentUser && (
            (article.publisherId && article.publisherId === currentUser.id) || 
            (article.publisherUsername === currentUser.username)
        );
        
        console.log('Is author check:', { 
            isAuthor, 
            publisherId: article.publisherId, 
            currentUserId: currentUser?.id,
            publisherUsername: article.publisherUsername,
            currentUsername: currentUser?.username
        });
        
        // Populate modal
        DOM.articleModalTitle.textContent = article.title || 'Untitled';
        DOM.articleModalMetadata.textContent = `By ${publisherName} on ${formatDate(article.createdAt || new Date())}`;
        DOM.articleModalContent.textContent = article.content || 'No content';
        
        // Add edit and delete buttons if user is the author
        if (isAuthor) {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'article-modal-actions';
            actionsDiv.innerHTML = `
                <button class="edit-article-btn" data-id="${article.id}">Edit</button>
                <button class="delete-article-btn" data-id="${article.id}">Delete</button>
            `;
            DOM.articleModalContent.after(actionsDiv);
            
            // Add event listeners
            actionsDiv.querySelector('.edit-article-btn').addEventListener('click', () => {
                closeAllModals();
                showEditArticleModal(article.id);
            });
            
            actionsDiv.querySelector('.delete-article-btn').addEventListener('click', () => {
                closeAllModals();
                confirmDeleteArticle(article.id);
            });
        }
        
        // Load comments
        loadComments(articleId);
    })
    .catch(error => {
        console.error('Error loading article details:', error);
        
        // Show error message but keep modal open
        DOM.articleModalTitle.textContent = 'Error';
        DOM.articleModalContent.textContent = 'Unable to load article details. Please try again later.';
        DOM.commentsContainer.innerHTML = '';
    });
}

// Load article comments
function loadComments(articleId) {
    DOM.commentsContainer.innerHTML = '<p>Loading comments...</p>';
    
    const commentsUrl = `${API_URL.getArticleComments}${articleId}`;
    console.log('Fetching comments from URL:', commentsUrl);
    
    fetch(commentsUrl, {
        credentials: 'include'
    })
    .then(response => {
        console.log('Comments response status:', response.status);
        if (!response.ok) {
            throw new Error(`Failed to load comments: ${response.status}`);
        }
        return response.json();
    })
    .then(comments => {
        console.log('Comments loaded:', comments);
        renderComments(comments);
    })
    .catch(error => {
        console.error('Error loading comments:', error);
        DOM.commentsContainer.innerHTML = '<p class="error-message">Unable to load comments. Please try again later.</p>';
    });
}

// Render Articles
function renderArticles(container, articles, isUserProfile = false) {
    container.innerHTML = '';
    
    if (articles.length === 0) {
        container.innerHTML = '<p class="no-articles">No articles found.</p>';
        return;
    }
    
    console.log('Rendering articles:', articles);
    
    articles.forEach(article => {
        // Handle the different data structure from the API
        const categories = article.category ? [article.category] : [];
        
        // Determine publisher username - handle different response formats
        let publisherName = 'Unknown';
        if (article.publisher && article.publisher.username) {
            publisherName = article.publisher.username;
        } else if (article.username) {
            publisherName = article.username;
        } else if (article.publisherName) {
            publisherName = article.publisherName;
        } else if (article.publisherUsername) {
            publisherName = article.publisherUsername;
        }
        
        // Check if the current user is the author of this article
        const isAuthor = isUserProfile || (currentUser && (
            (article.publisherId && article.publisherId === currentUser.id) || 
            (article.publisherUsername === currentUser.username)
        ));
        
        const articleHTML = `
            <div class="article-card" data-id="${article.id}">
                <h3 class="article-title">${article.title}</h3>
                <p class="article-metadata">By ${publisherName} on ${formatDate(article.createdAt || new Date())}</p>
                <p class="article-preview">${article.content.substring(0, 150)}${article.content.length > 150 ? '...' : ''}</p>
                <div class="article-categories">
                    ${categories.map(name => `<span class="article-category">${name}</span>`).join('')}
                </div>
                ${isAuthor ? `
                <div class="article-actions">
                    <button class="edit-article-btn" data-id="${article.id}">Edit</button>
                    <button class="delete-article-btn" data-id="${article.id}">Delete</button>
                </div>
                ` : ''}
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', articleHTML);
    });
    
    // Add event listeners to the article cards
    container.querySelectorAll('.article-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Only handle click if it's not on a button
            if (e.target.tagName !== 'BUTTON') {
                const articleId = parseInt(card.getAttribute('data-id'), 10);
                showArticleDetails(articleId);
            }
        });
    });
    
    // Add event listeners for edit and delete buttons
    container.querySelectorAll('.edit-article-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent article card click
            const articleId = parseInt(btn.getAttribute('data-id'), 10);
            showEditArticleModal(articleId);
        });
    });
    
    container.querySelectorAll('.delete-article-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent article card click
            const articleId = parseInt(btn.getAttribute('data-id'), 10);
            confirmDeleteArticle(articleId);
        });
    });
}

// Render Comments
function renderComments(comments, append = false) {
    if (!append) {
        DOM.commentsContainer.innerHTML = '';
    }
    
    if (comments.length === 0 && !append) {
        DOM.commentsContainer.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
        return;
    }
    
    console.log('Rendering comments:', comments);
    
    comments.forEach(comment => {
        // The backend returns username directly at the top level, not inside a user object
        const username = comment.username || (comment.user ? comment.user.username : currentUser.username || 'Unknown');
        
        // Check if the current user is the author of this comment
        const isAuthor = currentUser && (
            (comment.userId === currentUser.id) || 
            (username === currentUser.username)
        );
        
        const commentHTML = `
            <div class="comment" data-id="${comment.id}">
                <div class="comment-header">
                    <span class="comment-author">${username}</span>
                    <span class="comment-date">${formatDate(comment.createdAt || new Date())}</span>
                </div>
                <p class="comment-content">${comment.content}</p>
                ${isAuthor ? `
                <div class="comment-actions">
                    <button class="edit-comment-btn" data-id="${comment.id}">Edit</button>
                    <button class="delete-comment-btn" data-id="${comment.id}">Delete</button>
                </div>
                ` : ''}
            </div>
        `;
        
        DOM.commentsContainer.insertAdjacentHTML(append ? 'beforeend' : 'afterbegin', commentHTML);
    });
    
    // Add event listeners for edit and delete comment buttons
    DOM.commentsContainer.querySelectorAll('.edit-comment-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const commentId = parseInt(btn.getAttribute('data-id'), 10);
            const commentElement = btn.closest('.comment');
            const commentContent = commentElement.querySelector('.comment-content').textContent;
            showEditCommentForm(commentId, commentContent, commentElement);
        });
    });
    
    DOM.commentsContainer.querySelectorAll('.delete-comment-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const commentId = parseInt(btn.getAttribute('data-id'), 10);
            confirmDeleteComment(commentId);
        });
    });
}

// Show Section (hide others)
function showSection(section) {
    document.querySelectorAll('.section').forEach(s => {
        s.classList.add('hidden');
    });
    
    section.classList.remove('hidden');
}

// Close All Modals
function closeAllModals() {
    DOM.createPostModal.classList.add('hidden');
    DOM.articleModal.classList.add('hidden');
}

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Handle Add Comment - Add currentUser's username for immediate display
function handleAddComment(e) {
    e.preventDefault();
    
    // Check if user is still logged in
    if (!currentUser) {
        alert('Your session has expired. Please log in again.');
        showSection(DOM.authSection);
        return;
    }
    
    if (!currentArticle) {
        alert('Cannot add comment: No article selected');
        return;
    }
    
    const content = DOM.commentContent.value.trim();
    
    if (!content) {
        alert('Please enter a comment');
        return;
    }
    
    // Add a "posting..." indicator
    const submitBtn = DOM.commentForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Posting...';
    submitBtn.disabled = true;
    
    // Log request data for debugging
    console.log('Creating comment with data:', { content, postId: currentArticle.id });
    
    // Call the actual create comment API
    fetch(API_URL.createComment, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            content,
            postId: currentArticle.id
        }),
        credentials: 'include'
    })
    .then(response => {
        // Log raw response for debugging
        console.log('Comment creation response status:', response.status);
        
        if (!response.ok) {
            // Session expired
            if (response.status === 401) {
                showSection(DOM.authSection);
                throw new Error('Your session has expired. Please log in again.');
            }
            
            // Try to get more detailed error message
            return response.text().then(text => {
                try {
                    // Try to parse as JSON
                    const json = JSON.parse(text);
                    throw new Error(json.message || 'Failed to post comment');
                } catch (e) {
                    // If not JSON, use the raw text
                    throw new Error(`Failed to post comment (${response.status}): ${text || 'Unknown error'}`);
                }
            });
        }
        return response.json();
    })
    .then(comment => {
        console.log('Comment created successfully:', comment);
        
        // Reset form
        DOM.commentForm.reset();
        
        // Reload all comments to make sure we have the correct order
        loadComments(currentArticle.id);
    })
    .catch(error => {
        console.error('Error posting comment:', error);
        alert(error.message);
    })
    .finally(() => {
        // Restore button state
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    });
}

// Show Edit Article Modal
function showEditArticleModal(articleId) {
    // If we have the current article and it matches the ID
    if (currentArticle && currentArticle.id === articleId) {
        showEditArticleForm(currentArticle);
    } else {
        // Otherwise fetch the article details first
        fetch(API_URL.getArticleById + articleId, {
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch article details');
            }
            return response.json();
        })
        .then(article => {
            currentArticle = article;
            showEditArticleForm(article);
        })
        .catch(error => {
            console.error('Error fetching article:', error);
            alert('Unable to edit article at this time. Please try again later.');
        });
    }
}

// Show Edit Article Form
function showEditArticleForm(article) {
    // Repurpose the create post modal for editing
    DOM.createPostModal.classList.remove('hidden');
    
    // Update the form title
    const modalTitle = DOM.createPostModal.querySelector('h2');
    if (modalTitle) {
        modalTitle.textContent = 'Edit Post';
    }
    
    console.log('Editing article:', article);
    
    // Fill in the form with existing article data
    DOM.postTitle.value = article.title;
    DOM.postContent.value = article.content;
    
    // Remove any existing submit handler and add a new one for updating
    const form = DOM.createPostForm;
    const clonedForm = form.cloneNode(true);
    form.parentNode.replaceChild(clonedForm, form);
    
    // Update DOM reference
    DOM.createPostForm = clonedForm;
    
    // Add event listener for article update
    clonedForm.addEventListener('submit', (e) => {
        e.preventDefault();
        updateArticle(article.id);
    });
    
    // Make sure interests are loaded before setting checkboxes
    if (allInterests.length === 0) {
        // If interests haven't loaded yet, fetch them first
        fetch(API_URL.getInterests, {
            credentials: 'include'
        })
        .then(response => response.json())
        .then(interests => {
            // Map the interests to the expected format
            allInterests = interests.map((name, index) => ({
                id: index + 1,
                name: name
            }));
            
            // Now populate interest containers
            populateInterestsContainers(allInterests);
            
            // Then set the correct category
            setArticleCategory(article.category);
        })
        .catch(error => {
            console.error('Error loading interests for edit form:', error);
        });
    } else {
        // Interests already loaded, just set the correct category
        setArticleCategory(article.category);
    }
    
    // Helper function to set the article category in the form
    function setArticleCategory(category) {
        console.log('Setting article category:', category);
        
        // Clear any existing selections
        DOM.postInterestsContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
            checkbox.parentElement.classList.remove('selected');
        });
        
        // Find the matching interest and check it
        if (category) {
            const matchingCheckbox = Array.from(DOM.postInterestsContainer.querySelectorAll('input[type="checkbox"]'))
                .find(checkbox => {
                    const interestName = checkbox.parentElement.textContent.trim();
                    return interestName.toLowerCase() === category.toLowerCase();
                });
            
            if (matchingCheckbox) {
                matchingCheckbox.checked = true;
                matchingCheckbox.parentElement.classList.add('selected');
                console.log('Found and checked matching interest:', category);
            } else {
                console.warn('Could not find matching interest for category:', category);
            }
        }
    }
}

// Update Article
function updateArticle(articleId) {
    const title = DOM.postTitle.value.trim();
    const content = DOM.postContent.value.trim();
    
    if (!title || !content) {
        alert('Please enter both title and content');
        return;
    }
    
    // Get selected interests
    const selectedInterests = [];
    DOM.postInterestsContainer.querySelectorAll('input:checked').forEach(input => {
        selectedInterests.push(parseInt(input.value, 10));
    });
    
    if (selectedInterests.length === 0) {
        alert('Please select at least one interest');
        return;
    }
    
    // Prepare update data
    const updateData = {
        title,
        content,
        category: selectedInterests.map(id => {
            const interest = allInterests.find(i => i.id === id);
            return interest ? interest.name : null;
        }).filter(name => name !== null)[0] // Use first selected interest as category
    };
    
    // Debug log the request data
    console.log('Updating article ID:', articleId);
    console.log('Update data:', updateData);
    console.log('API URL:', `${API_URL.updateArticle}${articleId}`);
    
    // Call the update article API
    fetch(`${API_URL.updateArticle}${articleId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(updateData),
        credentials: 'include'
    })
    .then(response => {
        console.log('Update response status:', response.status);
        console.log('Update response headers:', [...response.headers.entries()]);
        
        if (!response.ok) {
            if (response.status === 401) {
                showSection(DOM.authSection);
                throw new Error('Your session has expired. Please log in again.');
            } else if (response.status === 403) {
                throw new Error('You do not have permission to edit this article');
            }
            
            // Try to get more detailed error message
            return response.text().then(text => {
                console.error('Error response body:', text);
                throw new Error(`Failed to update article: ${response.status} ${response.statusText}`);
            });
        }
        
        return response.json();
    })
    .then(updatedArticle => {
        console.log('Article updated successfully:', updatedArticle);
        
        // Update the current article reference
        if (currentArticle && currentArticle.id === articleId) {
            currentArticle = updatedArticle;
        }
        
        // Close modal
        closeAllModals();
        
        // Reload the current view
        if (!DOM.profileSection.classList.contains('hidden')) {
            loadProfile();
        } else {
            loadFeed();
        }
    })
    .catch(error => {
        console.error('Error updating article:', error);
        alert(error.message);
    });
}

// Confirm Delete Article
function confirmDeleteArticle(articleId) {
    if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
        deleteArticle(articleId);
    }
}

// Delete Article
function deleteArticle(articleId) {
    fetch(`${API_URL.deleteArticle}${articleId}`, {
        method: 'DELETE',
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                showSection(DOM.authSection);
                throw new Error('Your session has expired. Please log in again.');
            } else if (response.status === 403) {
                throw new Error('You do not have permission to delete this article');
            }
            throw new Error('Failed to delete article');
        }
        return response.text().then(text => text ? JSON.parse(text) : {});
    })
    .then(() => {
        console.log('Article deleted successfully');
        
        // Close modal if open
        closeAllModals();
        
        // Reload the current view
        if (!DOM.profileSection.classList.contains('hidden')) {
            loadProfile();
        } else {
            loadFeed();
        }
    })
    .catch(error => {
        console.error('Error deleting article:', error);
        alert(error.message);
    });
}

// Show Edit Comment Form
function showEditCommentForm(commentId, commentContent, commentElement) {
    // Remove any existing edit form
    const existingForm = DOM.commentsContainer.querySelector('.edit-comment-form');
    if (existingForm) {
        existingForm.parentNode.replaceChild(existingForm.previousSibling, existingForm);
    }
    
    // Create edit form
    const editForm = document.createElement('form');
    editForm.className = 'edit-comment-form';
    editForm.innerHTML = `
        <textarea class="edit-comment-content">${commentContent}</textarea>
        <div class="form-actions">
            <button type="submit" class="save-comment-btn">Save</button>
            <button type="button" class="cancel-comment-btn">Cancel</button>
        </div>
    `;
    
    // Hide the comment content
    const contentElement = commentElement.querySelector('.comment-content');
    const actionsElement = commentElement.querySelector('.comment-actions');
    
    if (contentElement) {
        contentElement.style.display = 'none';
    }
    
    if (actionsElement) {
        actionsElement.style.display = 'none';
    }
    
    // Add form after the content
    contentElement.after(editForm);
    
    // Add event listeners for save and cancel
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newContent = editForm.querySelector('.edit-comment-content').value.trim();
        if (!newContent) {
            alert('Comment cannot be empty');
            return;
        }
        
        updateComment(commentId, newContent, commentElement, editForm);
    });
    
    editForm.querySelector('.cancel-comment-btn').addEventListener('click', () => {
        // Remove the form and show the content again
        commentElement.removeChild(editForm);
        contentElement.style.display = '';
        if (actionsElement) {
            actionsElement.style.display = '';
        }
    });
    
    // Focus on the textarea
    editForm.querySelector('.edit-comment-content').focus();
}

// Update Comment
function updateComment(commentId, content, commentElement, editForm) {
    fetch(`${API_URL.updateComment}${commentId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                showSection(DOM.authSection);
                throw new Error('Your session has expired. Please log in again.');
            }
            throw new Error('Failed to update comment');
        }
        return response.json();
    })
    .then(updatedComment => {
        console.log('Comment updated successfully:', updatedComment);
        
        // Update the comment content
        const contentElement = commentElement.querySelector('.comment-content');
        contentElement.textContent = content;
        
        // Remove the form and show updated content
        commentElement.removeChild(editForm);
        contentElement.style.display = '';
        
        // Show actions
        const actionsElement = commentElement.querySelector('.comment-actions');
        if (actionsElement) {
            actionsElement.style.display = '';
        }
    })
    .catch(error => {
        console.error('Error updating comment:', error);
        alert(error.message);
    });
}

// Confirm Delete Comment
function confirmDeleteComment(commentId) {
    if (confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
        deleteComment(commentId);
    }
}

// Delete Comment
function deleteComment(commentId) {
    fetch(`${API_URL.deleteComment}${commentId}`, {
        method: 'DELETE',
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                showSection(DOM.authSection);
                throw new Error('Your session has expired. Please log in again.');
            }
            throw new Error('Failed to delete comment');
        }
        return response.text().then(text => text ? JSON.parse(text) : {});
    })
    .then(() => {
        console.log('Comment deleted successfully');
        
        // Remove comment element from DOM
        const commentElement = DOM.commentsContainer.querySelector(`.comment[data-id="${commentId}"]`);
        if (commentElement) {
            commentElement.remove();
        }
        
        // If no more comments, show "no comments" message
        if (DOM.commentsContainer.children.length === 0) {
            DOM.commentsContainer.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
        }
    })
    .catch(error => {
        console.error('Error deleting comment:', error);
        alert(error.message);
    });
}

// Utility function to handle API errors consistently
function handleApiError(error, container, retryFunction, customMessage = null) {
    console.error('API Error:', error);
    
    const errorMessage = customMessage || error.message || 'An unexpected error occurred';
    
    // If container is provided, show error in container
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <p>${errorMessage}</p>
                ${retryFunction ? '<button class="retry-btn btn btn-secondary">Retry</button>' : ''}
            </div>
        `;
        
        // Add retry button functionality if provided
        if (retryFunction) {
            container.querySelector('.retry-btn').addEventListener('click', retryFunction);
        }
    } else {
        // Otherwise use alert
        alert(errorMessage);
    }
    
    // If error is authentication related, redirect to login
    if (error.message?.includes('session') || error.message?.includes('log in') || 
        (error.status && error.status === 401)) {
        localStorage.removeItem('user');
        localStorage.removeItem('userInterests');
        
        // Disconnect SSE
        if (notificationHandler) {
            notificationHandler.disconnectSSE();
        }
        
        showSection(DOM.authSection);
    }
}

// Handle API Response
function handleApiResponse(response) {
    if (response.ok) {
        return response.json();
    }
    
    // Special handling for auth errors
    if (response.status === 401) {
        // Clear user session
        localStorage.removeItem('user');
        localStorage.removeItem('userInterests');
        currentUser = null;
        userInterests = [];
        
        // Show login form if not already there
        if (!DOM.authSection.classList.contains('active')) {
            showSection(DOM.authSection);
            showAuthMessage('Your session has expired. Please log in again.');
        }
    }
    
    // For all responses, try to parse JSON if possible to get error message
    return response.json().catch(() => {
        // If we can't parse JSON, create a generic error object
        return {
            success: false,
            message: `Error: ${response.statusText || response.status}`
        };
    }).then(data => {
        if (data && data.success === false) {
            return data; // Already in our expected format
        }
        
        // Otherwise return a standardized error format
        return {
            success: false,
            message: data.message || `Error: ${response.statusText || response.status}`,
            data: null
        };
    });
} 