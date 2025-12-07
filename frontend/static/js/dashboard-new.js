// Dashboard New JavaScript

let currentDate = new Date();

// Load user info on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadUserInfo();
    setDateInput(currentDate);
    await loadMenuByDate(currentDate);
    setupEventListeners();
});

function setupEventListeners() {
    // Date navigation
    document.getElementById('prevDayBtn').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        setDateInput(currentDate);
        loadMenuByDate(currentDate);
        if (typeof window.reloadWeightForDate === 'function') {
            window.reloadWeightForDate(currentDate);
        }
    });

    document.getElementById('nextDayBtn').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 1);
        setDateInput(currentDate);
        loadMenuByDate(currentDate);
        if (typeof window.reloadWeightForDate === 'function') {
            window.reloadWeightForDate(currentDate);
        }
    });

    document.getElementById('todayBtn').addEventListener('click', () => {
        currentDate = new Date();
        setDateInput(currentDate);
        loadMenuByDate(currentDate);
        if (typeof window.reloadWeightForDate === 'function') {
            window.reloadWeightForDate(currentDate);
        }
    });

    document.getElementById('dateInput').addEventListener('change', (e) => {
        currentDate = new Date(e.target.value);
        loadMenuByDate(currentDate);
        if (typeof window.reloadWeightForDate === 'function') {
            window.reloadWeightForDate(currentDate);
        }
    });

    // View controls
    document.getElementById('generateMenuBtn').addEventListener('click', showMenuFormModal);
    document.getElementById('createMenuBtn').addEventListener('click', showMenuFormModal);
    document.getElementById('deleteMenuBtn')?.addEventListener('click', deleteCurrentMenu);

    // Modal
    document.getElementById('closeModalBtn').addEventListener('click', closeMenuFormModal);
    document.getElementById('cancelModalBtn').addEventListener('click', closeMenuFormModal);
    document.getElementById('menuForm').addEventListener('submit', handleMenuFormSubmit);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
}

function setDateInput(date) {
    const dateStr = date.toISOString().split('T')[0];
    document.getElementById('dateInput').value = dateStr;
}

function formatDateVN(date) {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const day = days[date.getDay()];
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${day}, ${d}/${m}/${y}`;
}

async function loadUserInfo() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            document.getElementById('userName').textContent = data.username || 'Người dùng';
        } else if (response.status === 401) {
            // Prevent redirect loop
            if (!sessionStorage.getItem('redirecting')) {
                sessionStorage.setItem('redirecting', 'true');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 100);
            }
        }
    } catch (error) {
        console.error('Error loading user info:', error);
        if (!sessionStorage.getItem('redirecting')) {
            sessionStorage.setItem('redirecting', 'true');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 100);
        }
    }
}

async function loadMenuByDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    
    // Show loading
    document.getElementById('menuLoading').style.display = 'block';
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('menuContainer').style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/api/menu/by-date?date=${dateStr}`, {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            displayMenu(data, date);
        } else if (response.status === 404) {
            // No menu for this date
            document.getElementById('menuLoading').style.display = 'none';
            document.getElementById('emptyState').style.display = 'block';
        } else if (response.status === 401) {
            window.location.href = '/login.html';
        } else {
            throw new Error('Failed to load menu');
        }
    } catch (error) {
        console.error('Error loading menu:', error);
        document.getElementById('menuLoading').style.display = 'none';
        document.getElementById('emptyState').style.display = 'block';
    }
}

function displayMenu(menuData, date) {
    document.getElementById('menuLoading').style.display = 'none';
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('menuContainer').style.display = 'block';

    // Set date header
    document.getElementById('displayDate').textContent = formatDateVN(date);
    
    // Attach delete button event listener (must be done after menuContainer is visible)
    const deleteBtn = document.getElementById('deleteMenuBtn');
    if (deleteBtn) {
        // Remove old listener if exists
        deleteBtn.onclick = null;
        deleteBtn.onclick = deleteCurrentMenu;
    }

    // Parse AI response and split into meals
    const content = menuData.content;
    const meals = parseMenuContent(content);

    // Display breakfast
    document.getElementById('breakfastContent').innerHTML = meals.breakfast || 
        '<p class="meal-placeholder">Chưa có dữ liệu</p>';

    // Display lunch
    document.getElementById('lunchContent').innerHTML = meals.lunch || 
        '<p class="meal-placeholder">Chưa có dữ liệu</p>';

    // Display dinner
    document.getElementById('dinnerContent').innerHTML = meals.dinner || 
        '<p class="meal-placeholder">Chưa có dữ liệu</p>';

    // Display total calories
    document.getElementById('totalCalories').textContent = 
        menuData.calories > 0 ? menuData.calories : extractCalories(content);
}

function parseMenuContent(content) {
    // Try to parse AI response into breakfast, lunch, dinner
    const meals = {
        breakfast: '',
        lunch: '',
        dinner: ''
    };

    // Simple parsing logic - split by meal keywords
    const lines = content.split('\n');
    let currentMeal = '';

    for (let line of lines) {
        const lowerLine = line.toLowerCase().trim();
        
        if (lowerLine.includes('sáng') || lowerLine.includes('breakfast')) {
            currentMeal = 'breakfast';
            continue;
        } else if (lowerLine.includes('trưa') || lowerLine.includes('lunch')) {
            currentMeal = 'lunch';
            continue;
        } else if (lowerLine.includes('tối') || lowerLine.includes('dinner') || lowerLine.includes('chiều')) {
            currentMeal = 'dinner';
            continue;
        }
        
        // Skip lines that are likely section separators or total calories
        if (lowerLine.includes('tổng calo') || lowerLine.includes('total cal')) {
            currentMeal = ''; // Stop adding to meals
            continue;
        }

        if (currentMeal && line.trim()) {
            // Skip only lines that are pure separators
            if (line.trim() === '---' || line.trim() === '***' || line.trim().startsWith('###')) {
                continue;
            }
            
            // Convert markdown bold to HTML bold and add line
            let formattedLine = line
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // **text** to <strong>text</strong>
                .replace(/\*(.+?)\*/g, '<em>$1</em>'); // *text* to <em>text</em>
            
            meals[currentMeal] += formattedLine + '<br>';
        }
    }

    return meals;
}

function extractCalories(content) {
    // Priority 1: Find "Tổng calo" at the end (not per-meal totals)
    // Handle formats: "Tổng calo 2550-3000" or "Tổng calo: 2550 kcal"
    const totalCaloriesPatterns = [
        /\*\*tổng\s*calo\*\*\s*(\d+)[-–](\d+)/i,  // **Tổng calo** 2550-3000
        /tổng\s*calo\s*[:：]?\s*(\d+)[-–](\d+)/i, // Tổng calo: 2550-3000
        /\*\*tổng\s*calo\*\*\s*(\d+)/i,          // **Tổng calo** 2550
        /tổng\s*calo\s*[:：]?\s*(\d+)\s*kcal/i    // Tổng calo: 2550 kcal
    ];

    for (let pattern of totalCaloriesPatterns) {
        const match = content.match(pattern);
        if (match) {
            if (match[2]) {
                // Range format: calculate average
                const min = parseInt(match[1]);
                const max = parseInt(match[2]);
                if (min > 1000 && max > min && max < 10000) {
                    return Math.round((min + max) / 2);
                }
            } else if (match[1]) {
                // Single value
                const calories = parseInt(match[1]);
                if (calories > 1000 && calories < 10000) {
                    return calories;
                }
            }
        }
    }

    // Priority 2: Sum up per-meal calories if "Tổng calo" not found
    // Look for patterns like "Bữa sáng...600-700" or "Tổng calo: 650-750"
    const mealPattern = /bữa\s*(sáng|trưa|tối)[^]*?(\d+)[-–](\d+)/gi;
    let totalFromMeals = 0;
    let mealCount = 0;
    let match;
    
    while ((match = mealPattern.exec(content)) !== null) {
        const min = parseInt(match[2]);
        const max = parseInt(match[3]);
        if (min > 200 && max > min && max < 2000) {
            totalFromMeals += Math.round((min + max) / 2);
            mealCount++;
        }
    }
    
    if (mealCount >= 2 && totalFromMeals > 1000) {
        return totalFromMeals;
    }

    // Priority 3: Look for any large calorie number (likely total)
    const allNumbers = content.match(/(\d+)\s*[-–]\s*(\d+)/g);
    if (allNumbers) {
        for (let numStr of allNumbers) {
            const nums = numStr.match(/(\d+)\s*[-–]\s*(\d+)/);
            if (nums) {
                const min = parseInt(nums[1]);
                const max = parseInt(nums[2]);
                if (min > 2000 && max > min && max < 5000) {
                    return Math.round((min + max) / 2);
                }
            }
        }
    }

    return '--';
}

function showMenuFormModal() {
    // Pre-fill form with existing data if available
    fetch(`${API_BASE_URL}/api/auth/me`, {
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        if (data.height) document.getElementById('height').value = data.height;
        if (data.weight) document.getElementById('weight').value = data.weight;
        if (data.age) document.getElementById('age').value = data.age;
        if (data.gender) document.getElementById('gender').value = data.gender;
        if (data.dietary_preferences) document.getElementById('dietary_preferences').value = data.dietary_preferences;
        if (data.activity_level) document.getElementById('activity_level').value = data.activity_level;
        if (data.allergies) document.getElementById('allergies').value = data.allergies;
    })
    .catch(err => console.error('Error loading user data:', err));

    document.getElementById('menuFormModal').style.display = 'flex';
}

function closeMenuFormModal() {
    document.getElementById('menuFormModal').style.display = 'none';
}

async function handleMenuFormSubmit(e) {
    e.preventDefault();

    const numDays = parseInt(document.getElementById('numDays').value) || 1;

    const formData = {
        height: parseFloat(document.getElementById('height').value),
        weight: parseFloat(document.getElementById('weight').value),
        age: parseInt(document.getElementById('age').value),
        gender: document.getElementById('gender').value,
        dietary_preferences: document.getElementById('dietary_preferences').value,
        activity_level: document.getElementById('activity_level').value,
        allergies: document.getElementById('allergies').value,
        date: currentDate.toISOString().split('T')[0],
        num_days: numDays
    };

    closeMenuFormModal();
    
    // Show loading with progress if multiple days
    const loadingText = numDays > 1 ? `Đang tạo thực đơn cho ${numDays} ngày...` : 'Đang tạo thực đơn...';
    document.getElementById('menuLoading').innerHTML = `
        <div class="loading-spinner"></div>
        <p>${loadingText}</p>
        <small id="progressText"></small>
    `;
    document.getElementById('menuLoading').style.display = 'block';
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('menuContainer').style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/api/menu/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(formData)
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (response.ok) {
            const responseText = await response.text();
            console.log('Response text:', responseText);
            
            const data = JSON.parse(responseText);
            console.log('Menu generated:', data);
            
            // Handle multi-day generation response
            if (data.summary) {
                const { created, skipped, failed } = data.summary;
                let message = `Đã tạo ${created} thực đơn`;
                if (skipped > 0) message += `, bỏ qua ${skipped} ngày đã có thực đơn`;
                if (failed > 0) message += `, ${failed} ngày thất bại`;
                alert(message);
                
                // Update user info and reload current date
                await loadUserInfo();
                await loadMenuByDate(currentDate);
            } else {
                // Single day generation
                const menuData = {
                    date: data.date,
                    content: data.menu_content || data.content,
                    calories: data.total_calories || 0
                };
                
                // Update user info display
                await loadUserInfo();
                
                // Display the new menu
                currentDate = new Date(menuData.date);
                setDateInput(currentDate);
                displayMenu(menuData, currentDate);
            }
        } else if (response.status === 401) {
            window.location.href = '/login.html';
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('API Error:', errorData);
            throw new Error(errorData.error || 'Failed to generate menu');
        }
    } catch (error) {
        console.error('Error generating menu:', error);
        alert('Không thể tạo thực đơn. Lỗi: ' + error.message);
        document.getElementById('menuLoading').style.display = 'none';
        document.getElementById('emptyState').style.display = 'block';
    }
}

async function deleteCurrentMenu() {
    // Xác nhận trước khi xóa
    if (!confirm(`Bạn có chắc chắn muốn xóa thực đơn ngày ${formatDateVN(currentDate)}?\n\nHành động này không thể hoàn tác!`)) {
        return;
    }
    
    const dateStr = currentDate.toISOString().split('T')[0];
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/menu/delete/${dateStr}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            // Hiển thị thông báo thành công
            if (typeof window.showNotification === 'function') {
                window.showNotification('✅ Đã xóa thực đơn thành công!', 'success');
            } else {
                alert('✅ Đã xóa thực đơn thành công!');
            }
            
            // Reload menu (sẽ hiển thị empty state)
            await loadMenuByDate(currentDate);
            
        } else if (response.status === 401) {
            window.location.href = '/login.html';
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Không thể xóa thực đơn');
        }
    } catch (error) {
        console.error('Error deleting menu:', error);
        if (typeof window.showNotification === 'function') {
            window.showNotification('❌ ' + error.message, 'error');
        } else {
            alert('❌ Lỗi: ' + error.message);
        }
    }
}

async function handleLogout() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Error logging out:', error);
        window.location.href = '/login.html';
    }
}
