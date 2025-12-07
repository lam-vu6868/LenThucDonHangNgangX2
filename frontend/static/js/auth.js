// Authentication JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Clear all storage to prevent loop
    sessionStorage.clear();
    localStorage.clear();
    
    // Don't check if logged in on login/register page - causes loop
    // redirectIfLoggedIn();

    // Register Form Handler
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError('errorMessage');
            
            // Get form data
            const formData = new FormData(registerForm);
            const data = {
                username: formData.get('username'),
                email: formData.get('email'),
                password: formData.get('password'),
                height: formData.get('height') ? parseFloat(formData.get('height')) : null,
                weight: formData.get('weight') ? parseFloat(formData.get('weight')) : null,
                dietary_preferences: formData.get('dietary_preferences') || null
            };

            // Validate
            if (!data.username || !data.email || !data.password) {
                showError('errorMessage', 'Vui lòng điền đầy đủ thông tin bắt buộc!');
                return;
            }

            if (data.password.length < 6) {
                showError('errorMessage', 'Mật khẩu phải có ít nhất 6 ký tự!');
                return;
            }

            // Show loading
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;

            // Call API
            const response = await api.post('/api/auth/register', data);

            // Remove loading
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;

            if (response.ok) {
                showSuccess('errorMessage', 'Đăng ký thành công! Đang chuyển đến trang đăng nhập...');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } else {
                showError('errorMessage', response.data.error || 'Đăng ký thất bại!');
            }
        });
    }

    // Login Form Handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError('errorMessage');
            
            // Get form data
            const formData = new FormData(loginForm);
            const data = {
                username: formData.get('username'),
                password: formData.get('password')
            };

            // Validate
            if (!data.username || !data.password) {
                showError('errorMessage', 'Vui lòng điền đầy đủ thông tin!');
                return;
            }

            // Show loading
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;

            // Call API
            const response = await api.post('/api/auth/login', data);

            // Remove loading
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;

            if (response.ok) {
                // Save user info
                saveUser(response.data.user);
                
                // Kiểm tra nếu là admin thì redirect đến admin panel
                const redirectUrl = response.data.redirect || 'dashboard.html';
                const message = response.data.is_admin 
                    ? 'Chào mừng Admin! Đang chuyển đến trang quản trị...'
                    : 'Đăng nhập thành công! Đang chuyển hướng...';
                
                showSuccess('errorMessage', message);
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 1000);
            } else {
                showError('errorMessage', response.data.error || 'Đăng nhập thất bại!');
            }
        });
    }
});
