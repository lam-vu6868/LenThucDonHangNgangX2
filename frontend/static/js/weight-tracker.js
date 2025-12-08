// Weight Tracker Module
let weightChart = null;
let weightChartSmall = null;

// Initialize weight tracking
async function initWeightTracking() {
    await loadWeightData();
    await loadWeightChartPreview(); // Load small chart on card
    setupWeightEventListeners();
    setupEvaluationListeners();
    // Không load evaluation ngay - chỉ load khi mở modal
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
        // Không hiện thông báo khi load trang để tránh làm phiền user
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
            const bmi = data.bmi.toFixed(1);
            currentBMIEl.textContent = bmi;
            // Update BMI Progress Ring if function exists
            if (typeof window.updateBMIRing === 'function') {
                window.updateBMIRing(parseFloat(bmi));
            }
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
        // Lấy ngày hiện tại mà người dùng đang xem từ biến global
        const currentViewDate = window.currentDate || new Date();
        const dateStr = currentViewDate.toISOString().split('T')[0];
        
        const response = await fetch(`${API_BASE_URL}/api/weight/log`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                weight: newWeight,
                date: dateStr  // Gửi ngày người dùng đang xem
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification(data.message || '✓ Đã cập nhật cân nặng thành công!', 'success');
            // Reload lại dữ liệu cho ngày hiện tại
            await loadWeightData(dateStr);
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
        
        // Prepare chart data - Sắp xếp theo thời gian tăng dần
        const sortedHistory = [...data.history].sort((a, b) => 
            new Date(a.recorded_at) - new Date(b.recorded_at)
        );
        
        const labels = sortedHistory.map(entry => {
            const date = new Date(entry.recorded_at);
            return `${date.getDate()}/${date.getMonth() + 1}`;
        });
        
        const weights = sortedHistory.map(entry => entry.weight);
        
        // If chart exists, update data instead of recreating
        if (weightChartSmall) {
            weightChartSmall.data.labels = labels;
            weightChartSmall.data.datasets[0].data = weights;
            weightChartSmall.update('active'); // Force update with animation
        } else {
            // Create new chart only if it doesn't exist
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
        }
        
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

// ===== AI EVALUATION FUNCTIONS =====
function setupEvaluationListeners() {
    // Open modal trigger
    const evaluationTrigger = document.getElementById('evaluationTrigger');
    const evaluationModal = document.getElementById('evaluationModal');
    const closeEvaluationModal = document.getElementById('closeEvaluationModal');
    
    if (evaluationTrigger) {
        evaluationTrigger.addEventListener('click', () => {
            evaluationModal.style.display = 'flex';
            loadWeightEvaluation(30); // Default 30 days
        });
    }
    
    // Close modal
    if (closeEvaluationModal) {
        closeEvaluationModal.addEventListener('click', () => {
            evaluationModal.style.display = 'none';
        });
    }
    
    // Close on outside click
    if (evaluationModal) {
        evaluationModal.addEventListener('click', (e) => {
            if (e.target === evaluationModal) {
                evaluationModal.style.display = 'none';
            }
        });
    }
    
    // Tab buttons in modal
    const tabBtns = document.querySelectorAll('.tab-btn-modal');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            // Remove active from all
            tabBtns.forEach(b => b.classList.remove('active'));
            // Add active to clicked
            e.target.classList.add('active');
            
            const days = parseInt(e.target.dataset.days);
            await loadWeightEvaluation(days);
        });
    });
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshEvaluationBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            const activeDays = document.querySelector('.tab-btn-modal.active').dataset.days;
            await loadWeightEvaluation(parseInt(activeDays));
        });
    }
}

async function loadWeightEvaluation(days = 30) {
    const contentEl = document.getElementById('evaluationContentModal');
    const refreshBtn = document.getElementById('refreshEvaluationBtn');
    
    // Show loading
    contentEl.innerHTML = `
        <div class="evaluation-loading">
            <i class="fas fa-spinner fa-spin"></i> AI đang phân tích ${days} ngày gần nhất...
        </div>
    `;
    
    if (refreshBtn) refreshBtn.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/weight/evaluate?days=${days}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Không thể tải đánh giá');
        }
        
        const data = await response.json();
        
        // Kiểm tra nếu không đủ dữ liệu
        if (!data.success) {
            contentEl.innerHTML = `
                <div class="evaluation-text" style="text-align: center; padding: 30px 20px;">
                    <div style="font-size: 48px; margin-bottom: 15px;">📊</div>
                    <div style="white-space: pre-line; line-height: 1.6;">${data.message}</div>
                </div>
            `;
            if (refreshBtn) refreshBtn.style.display = 'block';
            return;
        }
        
        // Display evaluation
        let html = `<div class="evaluation-text">${data.evaluation}</div>`;
        
        // Add summary if available
        if (data.summary) {
            const summary = data.summary;
            const changeClass = summary.change < 0 ? 'positive' : summary.change > 0 ? 'negative' : '';
            
            html += `
                <div class="evaluation-summary">
                    <div class="summary-item">
                        <span class="summary-label">Bắt đầu</span>
                        <span class="summary-value">${summary.start_weight} kg</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Hiện tại</span>
                        <span class="summary-value">${summary.current_weight} kg</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Thay đổi</span>
                        <span class="summary-value ${changeClass}">${summary.change > 0 ? '+' : ''}${summary.change} kg</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">TB/tuần</span>
                        <span class="summary-value">${summary.avg_per_week > 0 ? '+' : ''}${summary.avg_per_week} kg</span>
                    </div>
                </div>
            `;
        }
        
        contentEl.innerHTML = html;
        
        // Show refresh button
        if (refreshBtn) refreshBtn.style.display = 'block';
        
    } catch (error) {
        console.error('Error loading evaluation:', error);
        contentEl.innerHTML = `
            <div class="evaluation-text" style="color: #666; text-align: center;">
                ⚠️ Không thể tải đánh giá. Vui lòng thử lại sau.
            </div>
        `;
        if (refreshBtn) refreshBtn.style.display = 'block';
    }
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWeightTracking);
} else {
    initWeightTracking();
}
