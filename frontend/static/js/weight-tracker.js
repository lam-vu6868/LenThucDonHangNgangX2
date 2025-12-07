// Weight Tracker Module
let weightChart = null;
let weightChartSmall = null;

// Initialize weight tracking
async function initWeightTracking() {
    await loadWeightData();
    await loadWeightChartPreview(); // Load small chart on card
    setupWeightEventListeners();
}

// Load current weight and history
async function loadWeightData(date = null) {
    try {
        // Build URL with date parameter if provided
        let url = `${API_BASE_URL}/api/weight/latest`;
        if (date) {
            const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
            url += `?date=${dateStr}`;
        }
        
        const latestResponse = await fetch(url, {
            credentials: 'include'
        });
        
        if (latestResponse.ok) {
            const data = await latestResponse.json();
            updateWeightDisplay(data);
        } else {
            // No weight data yet
            updateWeightDisplay(null);
        }
        
    } catch (error) {
        console.error('Error loading weight data:', error);
        showNotification('Không thể tải dữ liệu cân nằng', 'error');
    }
}

// Expose function to be called when date changes
window.reloadWeightForDate = loadWeightData;

// Update weight display
function updateWeightDisplay(data) {
    console.log('updateWeightDisplay called with data:', data);
    
    const currentWeightEl = document.getElementById('currentWeight');
    const currentBMIEl = document.getElementById('currentBMI');
    const weightChangeEl = document.getElementById('weightChange');
    
    console.log('Elements found:', {
        currentWeight: currentWeightEl,
        currentBMI: currentBMIEl,
        weightChange: weightChangeEl
    });
    
    if (data && data.current_weight) {
        currentWeightEl.textContent = `${data.current_weight.toFixed(1)} kg`;
        
        if (data.bmi) {
            currentBMIEl.textContent = data.bmi.toFixed(1);
        } else {
            currentBMIEl.textContent = '--';
        }
        
        if (data.change !== undefined && data.change !== 0) {
            const changeText = data.change > 0 ? `+${data.change.toFixed(1)}` : data.change.toFixed(1);
            weightChangeEl.textContent = `${changeText} kg`;
            weightChangeEl.className = `stat-change ${data.change > 0 ? 'positive' : 'negative'}`;
        } else {
            weightChangeEl.textContent = 'Chưa có thay đổi';
            weightChangeEl.className = 'stat-change';
        }
        
        console.log('Updated display successfully');
    } else {
        currentWeightEl.textContent = '--';
        currentBMIEl.textContent = '--';
        weightChangeEl.textContent = 'Chưa có dữ liệu';
        weightChangeEl.className = 'stat-change';
        console.log('No weight data available');
    }
}

// Setup event listeners
function setupWeightEventListeners() {
    const updateWeightBtn = document.getElementById('updateWeightBtn');
    const weightModal = document.getElementById('weightModal');
    const closeWeightModal = document.getElementById('closeWeightModal');
    const cancelWeightBtn = document.getElementById('cancelWeightBtn');
    const weightForm = document.getElementById('weightForm');
    
    // Open modal
    updateWeightBtn.addEventListener('click', () => {
        weightModal.style.display = 'flex';
        document.getElementById('newWeight').value = '';
        document.getElementById('newWeight').focus();
        loadWeightChart(); // Load chart when opening modal
    });
    
    // Close modal
    const closeModal = () => {
        weightModal.style.display = 'none';
    };
    
    closeWeightModal.addEventListener('click', closeModal);
    cancelWeightBtn.addEventListener('click', closeModal);
    
    weightModal.addEventListener('click', (e) => {
        if (e.target === weightModal) {
            closeModal();
        }
    });
    
    // Submit form
    weightForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleWeightSubmit();
    });
}

// Handle weight submission
let isSubmitting = false;
async function handleWeightSubmit() {
    // Prevent multiple submissions
    if (isSubmitting) {
        return;
    }
    
    const newWeight = parseFloat(document.getElementById('newWeight').value);
    
    if (!newWeight || newWeight <= 0) {
        showNotification('Vui lòng nhập cân nặng hợp lệ', 'error');
        return;
    }
    
    isSubmitting = true;
    const submitBtn = document.querySelector('#weightForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/weight/log`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                weight: newWeight
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('✓ Đã cập nhật cân nặng thành công!', 'success');
            await loadWeightData(); // Reload current stats
            await loadWeightChart(); // Reload modal chart
            await loadWeightChartPreview(); // Reload small chart on card
            document.getElementById('newWeight').value = '';
            // Close modal after successful update
            document.getElementById('weightModal').style.display = 'none';
        } else {
            showNotification(data.error || 'Không thể cập nhật cân nặng', 'error');
        }
        
    } catch (error) {
        console.error('Error submitting weight:', error);
        showNotification('Lỗi kết nối', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        isSubmitting = false;
    }
}

// Load weight chart
async function loadWeightChart() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/weight/history?days=30`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            return;
        }
        
        const data = await response.json();
        
        if (!data.history || data.history.length === 0) {
            document.getElementById('weightChartContainer').style.display = 'none';
            return;
        }
        
        document.getElementById('weightChartContainer').style.display = 'block';
        
        // Prepare chart data
        const labels = data.history.map(entry => {
            const date = new Date(entry.recorded_at);
            return `${date.getDate()}/${date.getMonth() + 1}`;
        });
        
        const weights = data.history.map(entry => entry.weight);
        
        // Destroy existing chart
        if (weightChart) {
            weightChart.destroy();
        }
        
        // Create new chart
        const ctx = document.getElementById('weightChart').getContext('2d');
        weightChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Cân nặng (kg)',
                    data: weights,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 14
                        },
                        bodyFont: {
                            size: 13
                        },
                        callbacks: {
                            label: function(context) {
                                return `Cân nặng: ${context.parsed.y.toFixed(1)} kg`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(1) + ' kg';
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
        
        // Update statistics
        updateWeightStats(data);
        
    } catch (error) {
        console.error('Error loading weight chart:', error);
    }
}

// Load small weight chart preview on card
async function loadWeightChartPreview() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/weight/history?days=30`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            return;
        }
        
        const data = await response.json();
        
        if (!data.history || data.history.length === 0) {
            document.getElementById('weightChartPreview').style.display = 'none';
            return;
        }
        
        document.getElementById('weightChartPreview').style.display = 'block';
        
        // Prepare chart data
        const labels = data.history.map(entry => {
            const date = new Date(entry.recorded_at);
            return `${date.getDate()}/${date.getMonth() + 1}`;
        });
        
        const weights = data.history.map(entry => entry.weight);
        
        // Destroy existing chart
        if (weightChartSmall) {
            weightChartSmall.destroy();
        }
        
        // Create new chart
        const ctx = document.getElementById('weightChartSmall').getContext('2d');
        weightChartSmall = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Cân nặng',
                    data: weights,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 10,
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y.toFixed(1)} kg`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(1) + ' kg';
                            },
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 10
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error loading weight chart preview:', error);
    }
}

// Update weight statistics
function updateWeightStats(data) {
    const statsContainer = document.getElementById('weightStats');
    
    if (!data.history || data.history.length === 0) {
        statsContainer.innerHTML = '';
        return;
    }
    
    const weights = data.history.map(e => e.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
    
    statsContainer.innerHTML = `
        <div class="weight-stat">
            <div class="label">Thấp nhất</div>
            <div class="value">${minWeight.toFixed(1)} kg</div>
        </div>
        <div class="weight-stat">
            <div class="label">Trung bình</div>
            <div class="value">${avgWeight.toFixed(1)} kg</div>
        </div>
        <div class="weight-stat">
            <div class="label">Cao nhất</div>
            <div class="value">${maxWeight.toFixed(1)} kg</div>
        </div>
    `;
}

// Notification helper
function showNotification(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add to body
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWeightTracking);
} else {
    initWeightTracking();
}
