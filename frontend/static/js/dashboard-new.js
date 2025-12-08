// Dashboard New JavaScript

let currentDate = new Date();
// Expose currentDate globally để các module khác có thể truy cập
window.currentDate = currentDate;

// Load user info on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadUserInfo();
    await loadStatistics();
    setDateInput(currentDate);
    await loadMenuByDate(currentDate);
    setupEventListeners();
});

function setupEventListeners() {
    // Setup edit meal modal
    setupEditMealListeners();
    
    // Date navigation
    document.getElementById('prevDayBtn').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        window.currentDate = currentDate;  // Cập nhật biến global
        setDateInput(currentDate);
        loadMenuByDate(currentDate);
        if (typeof window.reloadWeightForDate === 'function') {
            window.reloadWeightForDate(currentDate);
        }
    });

    document.getElementById('nextDayBtn').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 1);
        window.currentDate = currentDate;  // Cập nhật biến global
        setDateInput(currentDate);
        loadMenuByDate(currentDate);
        if (typeof window.reloadWeightForDate === 'function') {
            window.reloadWeightForDate(currentDate);
        }
    });

    document.getElementById('todayBtn').addEventListener('click', () => {
        currentDate = new Date();
        window.currentDate = currentDate;  // Cập nhật biến global
        setDateInput(currentDate);
        loadMenuByDate(currentDate);
        if (typeof window.reloadWeightForDate === 'function') {
            window.reloadWeightForDate(currentDate);
        }
    });

    document.getElementById('dateInput').addEventListener('change', (e) => {
        currentDate = new Date(e.target.value);
        window.currentDate = currentDate;  // Cập nhật biến global
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

function formatDateForAPI(date) {
    return date.toISOString().split('T')[0];
}

async function loadStatistics() {
    try {
        // Load total menus count
        const menusResponse = await fetch(`${API_BASE_URL}/api/menu/all`, {
            credentials: 'include'
        });
        
        if (menusResponse.ok) {
            const menusData = await menusResponse.json();
            const totalMenus = menusData.menus ? menusData.menus.length : 0;
            
            // Count menus this week
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const weekMenus = menusData.menus ? menusData.menus.filter(menu => {
                const menuDate = new Date(menu.date);
                return menuDate >= weekAgo;
            }).length : 0;
            
            // Calculate streak
            const streak = calculateStreak(menusData.menus || []);
            
            // Animate counters
            animateCounter('totalMenusCount', totalMenus);
            animateCounter('weekMenusCount', weekMenus);
            document.getElementById('streakCount').textContent = `🔥 ${streak}`;
        }
        
        // Get goal from user profile
        const userResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
            credentials: 'include'
        });
        
        if (userResponse.ok) {
            const userData = await userResponse.json();
            const goal = userData.dietary_preferences || 'Chưa đặt';
            document.getElementById('goalStatus').textContent = goal;
        } else {
            document.getElementById('goalStatus').textContent = 'Chưa đặt';
        }
        
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

function calculateStreak(menus) {
    if (!menus || menus.length === 0) return 0;
    
    const sortedDates = menus
        .map(m => new Date(m.date).toISOString().split('T')[0])
        .sort()
        .reverse();
    
    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    
    for (const dateStr of sortedDates) {
        const menuDate = new Date(dateStr);
        menuDate.setHours(0, 0, 0, 0);
        
        const diffDays = Math.floor((checkDate - menuDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === streak) {
            streak++;
        } else if (diffDays > streak) {
            break;
        }
    }
    
    return streak;
}

function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const duration = 1000;
    const steps = 30;
    const increment = targetValue / steps;
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= targetValue) {
            element.textContent = targetValue;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, duration / steps);
}

// Export to window for weight-tracker to use
window.updateBMIRing = function updateBMIRing(bmi) {
    const circle = document.getElementById('bmiProgressCircle');
    const bmiNumber = document.getElementById('currentBMI');
    const bmiCategory = document.getElementById('bmiCategory');
    
    if (!circle || !bmi || bmi === '--') return;
    
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    
    // Calculate percentage (BMI range 15-35, normalized to 0-100%)
    const minBMI = 15;
    const maxBMI = 35;
    const percentage = ((bmi - minBMI) / (maxBMI - minBMI)) * 100;
    const offset = circumference - (percentage / 100) * circumference;
    
    circle.style.strokeDashoffset = offset;
    bmiNumber.textContent = bmi;
    
    // Set color and category based on BMI
    let color, category;
    if (bmi < 18.5) {
        color = '#3b82f6';
        category = 'Thiếu cân';
    } else if (bmi < 25) {
        color = '#10b981';
        category = 'Bình thường';
    } else if (bmi < 30) {
        color = '#f59e0b';
        category = 'Thừa cân';
    } else {
        color = '#ef4444';
        category = 'Béo phì';
    }
    
    circle.style.stroke = color;
    bmiCategory.textContent = category;
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
            // Có thực đơn rồi -> ẩn nút "Tạo thực đơn mới"
            toggleCreateMenuButton(false);
        } else if (response.status === 404) {
            // No menu for this date
            document.getElementById('menuLoading').style.display = 'none';
            document.getElementById('emptyState').style.display = 'block';
            // Chưa có thực đơn -> hiện nút "Tạo thực đơn mới"
            toggleCreateMenuButton(true);
        } else if (response.status === 401) {
            window.location.href = '/login.html';
        } else {
            throw new Error('Failed to load menu');
        }
    } catch (error) {
        console.error('Error loading menu:', error);
        document.getElementById('menuLoading').style.display = 'none';
        document.getElementById('emptyState').style.display = 'block';
        // Lỗi -> coi như chưa có thực đơn, hiện nút
        toggleCreateMenuButton(true);
    }
}

function toggleCreateMenuButton(show) {
    const createBtn = document.getElementById('createMenuBtn');
    const generateBtn = document.getElementById('generateMenuBtn');
    
    if (createBtn) {
        createBtn.style.display = show ? 'flex' : 'none';
    }
    if (generateBtn) {
        generateBtn.style.display = show ? 'inline-flex' : 'none';
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

// ============ EDIT MEAL FUNCTIONALITY ============
let currentEditingMeal = {
    date: null,
    mealType: null
};

// Setup edit meal modal listeners
function setupEditMealListeners() {
    // Use event delegation for dynamically loaded edit buttons
    document.addEventListener('click', (e) => {
        if (e.target.closest('.btn-edit-meal')) {
            handleEditMealClick(e);
        }
    });

    // Close modal buttons
    document.getElementById('closeEditMealModal').addEventListener('click', closeEditMealModal);
    document.getElementById('cancelEditMealBtn').addEventListener('click', closeEditMealModal);

    // Close modal when clicking outside
    document.getElementById('editMealModal').addEventListener('click', (e) => {
        if (e.target.id === 'editMealModal') {
            closeEditMealModal();
        }
    });

    // Submit edit meal form
    document.getElementById('editMealForm').addEventListener('submit', handleEditMealSubmit);
    
    // Add dish button
    document.getElementById('addDishBtn').addEventListener('click', () => {
        addDishRow('', '', 0);
    });
}

function handleEditMealClick(e) {
    e.preventDefault();
    const button = e.target.closest('.btn-edit-meal');
    if (!button) return;
    
    const mealType = button.getAttribute('data-meal-type');
    
    // Check if menu exists for current date
    const menuContainer = document.getElementById('menuContainer');
    if (!menuContainer || menuContainer.style.display === 'none') {
        if (typeof window.showNotification === 'function') {
            window.showNotification('⚠️ Chưa có thực đơn cho ngày này', 'warning');
        } else {
            alert('⚠️ Chưa có thực đơn cho ngày này');
        }
        return;
    }

    // Get current meal content
    const contentId = mealType + 'Content';
    const contentElement = document.getElementById(contentId);
    const currentContent = contentElement.innerText.trim();

    if (currentContent === 'Chưa có dữ liệu') {
        if (typeof window.showNotification === 'function') {
            window.showNotification('⚠️ Bữa ăn này chưa có dữ liệu', 'warning');
        } else {
            alert('⚠️ Bữa ăn này chưa có dữ liệu');
        }
        return;
    }

    // Store current editing meal info
    currentEditingMeal.date = formatDateForAPI(currentDate);
    currentEditingMeal.mealType = mealType;

    // Set modal title
    const mealTitles = {
        'breakfast': 'Bữa Sáng',
        'lunch': 'Bữa Trưa',
        'dinner': 'Bữa Tối'
    };
    document.getElementById('editMealTitle').textContent = mealTitles[mealType];

    // Parse current dishes from content
    const dishes = parseDishesFromContent(currentContent);
    
    // Clear and populate dishes list
    const dishesList = document.getElementById('dishesList');
    dishesList.innerHTML = '';
    
    dishes.forEach((dish, index) => {
        addDishRow(dish.name, dish.portion, dish.calories);
    });
    
    // If no dishes, add one empty row
    if (dishes.length === 0) {
        addDishRow('', '', 0);
    }
    
    // Update total calories display
    updateTotalCalories();

    // Show modal
    document.getElementById('editMealModal').style.display = 'flex';
}

function parseDishesFromContent(content) {
    const dishes = [];
    const lines = content.split('\n');
    
    lines.forEach(line => {
        // Match pattern: - Tên món (khẩu phần) - số kcal
        const match = line.match(/^-?\s*(.+?)\s*\((.+?)\)\s*-\s*(\d+)\s*kcal/i);
        if (match) {
            dishes.push({
                name: match[1].trim(),
                portion: match[2].trim(),
                calories: parseInt(match[3])
            });
        }
    });
    
    return dishes;
}

function addDishRow(name = '', portion = '', calories = 0) {
    const dishesList = document.getElementById('dishesList');
    const dishIndex = dishesList.children.length;
    
    const dishRow = document.createElement('div');
    dishRow.className = 'dish-row';
    dishRow.innerHTML = `
        <div class="dish-row-header">
            <span class="dish-number">Món ${dishIndex + 1}</span>
            <button type="button" class="btn-remove-dish" onclick="removeDishRow(this)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="dish-row-content">
            <div class="form-group">
                <label>Tên món ăn</label>
                <input type="text" class="dish-name" placeholder="Ví dụ: Phở bò" value="${name}" required>
            </div>
            <div class="form-group">
                <label>Khẩu phần</label>
                <input type="text" class="dish-portion" placeholder="Ví dụ: 1 tô, 200g" value="${portion}" required>
            </div>
            <div class="form-group">
                <label>Calo (kcal)</label>
                <input type="number" class="dish-calories" min="0" step="1" placeholder="0" value="${calories}" required>
            </div>
        </div>
    `;
    
    dishesList.appendChild(dishRow);
    
    // Add event listener to calories input to update total
    const caloriesInput = dishRow.querySelector('.dish-calories');
    caloriesInput.addEventListener('input', updateTotalCalories);
}

function removeDishRow(button) {
    const dishRow = button.closest('.dish-row');
    dishRow.remove();
    
    // Renumber remaining dishes
    const dishesList = document.getElementById('dishesList');
    Array.from(dishesList.children).forEach((row, index) => {
        row.querySelector('.dish-number').textContent = `Món ${index + 1}`;
    });
    
    updateTotalCalories();
}

function updateTotalCalories() {
    const caloriesInputs = document.querySelectorAll('.dish-calories');
    let total = 0;
    
    caloriesInputs.forEach(input => {
        const value = parseInt(input.value) || 0;
        total += value;
    });
    
    document.getElementById('totalCaloriesDisplay').textContent = `${total} kcal`;
}

function closeEditMealModal() {
    document.getElementById('editMealModal').style.display = 'none';
    document.getElementById('dishesList').innerHTML = '';
    currentEditingMeal = { date: null, mealType: null };
}

async function handleEditMealSubmit(e) {
    e.preventDefault();

    // Collect all dishes from form
    const dishRows = document.querySelectorAll('.dish-row');
    
    if (dishRows.length === 0) {
        if (typeof window.showNotification === 'function') {
            window.showNotification('⚠️ Vui lòng thêm ít nhất một món ăn', 'warning');
        } else {
            alert('⚠️ Vui lòng thêm ít nhất một món ăn');
        }
        return;
    }
    
    const dishes = [];
    let totalCalories = 0;
    let isValid = true;
    
    dishRows.forEach((row, index) => {
        const name = row.querySelector('.dish-name').value.trim();
        const portion = row.querySelector('.dish-portion').value.trim();
        const calories = parseInt(row.querySelector('.dish-calories').value) || 0;
        
        if (!name || !portion || calories <= 0) {
            isValid = false;
            return;
        }
        
        dishes.push({ name, portion, calories });
        totalCalories += calories;
    });
    
    if (!isValid) {
        if (typeof window.showNotification === 'function') {
            window.showNotification('⚠️ Vui lòng điền đầy đủ thông tin cho tất cả món ăn', 'warning');
        } else {
            alert('⚠️ Vui lòng điền đầy đủ thông tin cho tất cả món ăn');
        }
        return;
    }
    
    // Format content for API
    const content = dishes.map(dish => 
        `- ${dish.name} (${dish.portion}) - ${dish.calories} kcal`
    ).join('\n');

    try {
        const response = await fetch(`${API_BASE_URL}/api/menu/update-meal`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                date: currentEditingMeal.date,
                meal_type: currentEditingMeal.mealType,
                content: content,
                calories: totalCalories
            })
        });

        if (response.ok) {
            const data = await response.json();
            
            if (typeof window.showNotification === 'function') {
                window.showNotification('✅ Cập nhật bữa ăn thành công!', 'success');
            } else {
                alert('✅ Cập nhật bữa ăn thành công!');
            }

            // Close modal
            closeEditMealModal();

            // Reload menu to show updated data
            await loadMenuByDate(currentDate);

        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Không thể cập nhật bữa ăn');
        }
    } catch (error) {
        console.error('Error updating meal:', error);
        if (typeof window.showNotification === 'function') {
            window.showNotification('❌ ' + error.message, 'error');
        } else {
            alert('❌ Lỗi: ' + error.message);
        }
    }
}
