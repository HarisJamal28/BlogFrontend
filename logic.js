document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const apiBase = 'https://blog-backend-l8og48k7e-haris-jamals-projects.vercel.app/api/';

    const apiRequest = async (endpoint, method = 'GET', body = null, auth = false) => {
        const headers = { 'Content-Type': 'application/json' };
        if (auth) {
            const token = localStorage.getItem('token');
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }

        const options = { method, headers };
        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${apiBase}${endpoint}`, options);
            const data = await response.json();
            return { ok: response.ok, data };
        } catch (err) {
            console.error(`API error: ${endpoint}`, err);
            return { ok: false, data: { message: 'Request failed' } };
        }
    };

    // Login
    if (path.includes('login.html')) {
        const loginForm = document.querySelector('form');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[type="text"]').value.trim();
            const password = loginForm.querySelector('input[type="password"]').value.trim();

            if (!email || !password) {
                alert('Please enter both email and password.');
                return;
            }

            const { ok, data } = await apiRequest('/auth/login', 'POST', { email, password });

            if (ok) {
                const token = data.token || data.data?.token;
                if (token) {
                    localStorage.setItem('token', token);
                    alert('Login successful!');
                    window.location.href = './userdashboard.html#profile';
                } else {
                    alert('Login succeeded, but token is missing.');
                }
            } else {
                alert(data.message || 'Login failed.');
            }
        });
    }

    // Register
    if (path.includes('register.html')) {
        const registerForm = document.querySelector('form');
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const inputs = registerForm.querySelectorAll('input');

            const firstName = inputs[0].value.trim();
            const lastName = inputs[1].value.trim();
            const username = inputs[2].value.trim();
            const email = inputs[3].value.trim();
            const password = inputs[4].value.trim();

            if (!firstName || !lastName || !username || !email || !password) {
                alert('Please fill in all fields.');
                return;
            }

            const { ok, data } = await apiRequest('/auth/register', 'POST', {
                firstName, lastName, username, email, password
            });

            if (ok) {
                alert('Registration successful! Redirecting to login...');
                window.location.href = './login.html';
            } else {
                const errorMessages = data.errors?.map(err => err.msg).join('\n') || data.message;
                alert(`Registration failed:\n${errorMessages}`);
            }
        });
    }

    // Dashboard
    if (path.includes('userdashboard.html')) {
        const logoutBtn = document.getElementById('logoutBtn');
        const homeSection = document.querySelector('#home .post-frame');
        const myPostsSection = document.querySelector('#myposts .post-frame');

        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                const token = localStorage.getItem('token');
                if (!token) {
                    alert('You are not logged in.');
                    return;
                }

                const { ok, data } = await apiRequest('/auth/logout', 'POST', null, true);

                if (ok) {
                    localStorage.removeItem('token');
                    alert('Logged out successfully.');
                    window.location.href = './login.html';
                } else {
                    alert(data.message || 'Logout failed.');
                }
            });
        }

        const renderPosts = async () => {
            const { ok, data } = await apiRequest('/auth/posts', 'GET', null, true);
            if (!ok) {
                homeSection.innerHTML = '<p>Failed to load posts.</p>';
                return;
            }

            const posts = Array.isArray(data) ? data : data.posts || data.data || [];

            if (!posts.length) {
                homeSection.innerHTML = '<p>No posts available.</p>';
                return;
            }

            homeSection.innerHTML = '';
            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.classList.add('post');

                const postDate = new Date(post.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric'
                });

                postElement.innerHTML = `
                    <h1 class="post-title">${post.title}</h1>
                    <i class="post-date">${postDate}</i>
                    <p class="post-content clamp-text">${post.content || ''}</p>
                    <button class="toggle-content">Show more</button>
                    <div class="post-credits">
                        <ul>
                            <li><i>${post.author?.username || 'Unknown Author'}</i></li>
                        </ul>
                        <ul>
                            <li><button><i class="fa-solid fa-heart"></i></button></li>
                            <li><button><i class="fa-solid fa-comment"></i></button></li>
                        </ul>
                    </div>
                `;

                homeSection.appendChild(postElement);

                const contentEl = postElement.querySelector('.post-content');
                const toggleBtn = postElement.querySelector('.toggle-content');

                const temp = contentEl.cloneNode(true);
                temp.style.visibility = 'hidden';
                temp.style.position = 'absolute';
                temp.style.display = 'block';
                temp.style.maxHeight = 'none';
                document.body.appendChild(temp);

                const isClamped = temp.clientHeight > contentEl.clientHeight;
                document.body.removeChild(temp);

                if (!isClamped) toggleBtn.style.display = 'none';

                toggleBtn.addEventListener('click', () => {
                    contentEl.classList.toggle('expanded');
                    toggleBtn.textContent = contentEl.classList.contains('expanded') ? 'Show less' : 'Show more';
                });
            });
        };

        const renderMyPosts = async () => {
            const { ok, data } = await apiRequest('/auth/my-posts', 'GET', null, true);
            if (!ok) {
                myPostsSection.innerHTML = '<p>Failed to load your posts.</p>';
                return;
            }

            const posts = Array.isArray(data) ? data : data.data || [];

            if (!posts.length) {
                myPostsSection.innerHTML = '<p>You have not created any posts yet.</p>';
                return;
            }

            myPostsSection.innerHTML = '';
            posts.forEach(post => {
                const postDate = new Date(post.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric'
                });

                const postElement = document.createElement('div');
                postElement.classList.add('post');

                postElement.innerHTML = `
                    <h1 class="post-title">${post.title}</h1>
                    <i class="post-date">${postDate}</i>
                    <p class="post-content clamp-text">${post.content || ''}</p>
                    <div class="post-credits">
                        <ul>
                            <li><i>${post.author?.username || 'You'}</i></li>
                        </ul>
                        <ul>
                            <li><button class="delete-btn" data-id="${post._id}"><i class="fa-solid fa-trash"></i></button></li>
                        </ul>
                    </div>
                `;

                myPostsSection.appendChild(postElement);
            });
        };

        myPostsSection.addEventListener('click', async (e) => {
            const deleteBtn = e.target.closest('.delete-btn');
            if (!deleteBtn) return;

            const postId = deleteBtn.getAttribute('data-id');
            const confirmed = confirm('Are you sure you want to delete this post?');
            if (!confirmed) return;

            const { ok, data } = await apiRequest(`/auth/posts/${postId}`, 'DELETE', null, true);

            if (ok) {
                alert('Post deleted successfully.');
                renderMyPosts();
            } else {
                alert(data.message || 'Failed to delete the post.');
            }
        });

        const createPostForm = document.getElementById('createPostForm');
        if (createPostForm) {
            createPostForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const title = createPostForm.querySelector('input[type="text"]').value.trim();
                const content = createPostForm.querySelector('textarea').value.trim();

                if (!title || !content) {
                    alert('Please fill in both title and content.');
                    return;
                }

                const { ok, data } = await apiRequest('/auth/posts', 'POST', { title, content }, true);

                if (ok) {
                    alert('Post created successfully!');
                    createPostForm.reset();
                    renderPosts();
                    renderMyPosts();
                } else {
                    const errorMessages = data.errors?.map(err => err.msg).join('\n') || data.message;
                    alert(`Post creation failed:\n${errorMessages}`);
                }
            });
        }

        // ✅ Render Profile Data
        const renderUserProfile = async () => {
            const { ok, data } = await apiRequest('/auth/profile', 'GET', null, true);
            if (!ok) {
                alert(data.message || 'Failed to load profile.');
                return;
            }

            const user = data.user || data.data?.user;
            const inputs = document.querySelectorAll('#profile input');
            if (!inputs.length || !user) return;

            inputs[0].value = user.username || '';
            inputs[1].value = user.firstName || '';
            inputs[2].value = user.lastName || '';
            inputs[3].value = user.phone || '';
            inputs[4].value = user.country || '';
            inputs[5].value = user.city || '';
            inputs[6].value = user.address1 || '';
            inputs[7].value = user.address2 || '';
        };

        // ✅ Update Profile on Form Submit
        const profileForm = document.querySelector('#profile form');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const inputs = profileForm.querySelectorAll('input');

                const updatedProfile = {
                    username: inputs[0].value.trim(),
                    firstName: inputs[1].value.trim(),
                    lastName: inputs[2].value.trim(),
                    phone: inputs[3].value.trim(),
                    country: inputs[4].value.trim(),
                    city: inputs[5].value.trim(),
                    address1: inputs[6].value.trim(),
                    address2: inputs[7].value.trim(),
                };

                const { ok, data } = await apiRequest('/auth/profile', 'PUT', updatedProfile, true);

                if (ok) {
                    alert('Profile updated successfully!');
                } else {
                    const errorMessages = data.errors?.map(err => err.msg).join('\n') || data.message;
                    alert(`Profile update failed:\n${errorMessages}`);
                }
            });
        }

        renderPosts();
        renderMyPosts();
        renderUserProfile();
    }
});
