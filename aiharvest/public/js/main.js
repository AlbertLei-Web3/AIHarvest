// AI Harvest DeFi平台主要JavaScript功能

document.addEventListener('DOMContentLoaded', function() {
    // 初始化所有组件
    initWalletConnection();
    initFarmFilters();
    initFarmActions();
    initAiChat();
    initAnimations();
    initAdminFeatures();
    initDashboardFeatures();
    
    // 显示页面加载完成动画
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 500);
});

// 钱包连接功能
function initWalletConnection() {
    const walletBtn = document.querySelector('.wallet-btn button');
    if (walletBtn) {
        walletBtn.addEventListener('click', function() {
            // 模拟钱包连接过程
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 连接中...';
            
            setTimeout(() => {
                // 模拟连接成功
                this.innerHTML = '<i class="fas fa-link"></i> 已连接: 0x7a...3f9b';
                this.classList.add('connected');
                
                // 更新用户状态显示
                updateUserStatus();
            }, 1500);
        });
    }
}

// 更新用户状态信息
function updateUserStatus() {
    // 在真实应用中，这里会从区块链获取用户数据
    // 此处仅用于演示
    document.querySelectorAll('.user-stats .stat-value, .detail-row .detail-value').forEach(el => {
        el.classList.add('updated');
        setTimeout(() => el.classList.remove('updated'), 1000);
    });
}

// 农场筛选功能
function initFarmFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const farmCards = document.querySelectorAll('.farm-card');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 更新活跃按钮状态
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.textContent.trim();
            
            // 根据筛选显示农场
            farmCards.forEach(card => {
                if (filter === '全部') {
                    card.style.display = 'flex';
                    return;
                }
                
                // 筛选逻辑 - 在真实应用中会更复杂
                if (filter === 'AI推荐' && !card.querySelector('.ai-recommended')) {
                    card.style.display = 'none';
                } else if (filter === '高收益' && 
                          parseFloat(card.querySelector('.apr-value').textContent) < 35) {
                    card.style.display = 'none';
                } else if (filter === '稳定币' && 
                          !card.querySelector('.farm-tokens h3').textContent.includes('USDT') &&
                          !card.querySelector('.farm-tokens h3').textContent.includes('USDC')) {
                    card.style.display = 'none';
                } else {
                    card.style.display = 'flex';
                }
            });
            
            // 添加筛选动画
            farmCards.forEach(card => {
                if (card.style.display !== 'none') {
                    card.classList.add('filtered');
                    setTimeout(() => card.classList.remove('filtered'), 500);
                }
            });
        });
    });
}

// 农场操作功能
function initFarmActions() {
    // 质押按钮
    document.querySelectorAll('.stake-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const farmCard = this.closest('.farm-card');
            const farmName = farmCard.querySelector('.farm-tokens h3').textContent;
            
            showNotification(`正在打开 ${farmName} 质押面板...`, 'info');
            
            // 这里可以实现打开质押模态框的逻辑
        });
    });
    
    // 提取按钮
    document.querySelectorAll('.withdraw-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const farmCard = this.closest('.farm-card');
            const farmName = farmCard.querySelector('.farm-tokens h3').textContent;
            
            showNotification(`正在打开 ${farmName} 提取面板...`, 'info');
            
            // 这里可以实现打开提取模态框的逻辑
        });
    });
    
    // 收获按钮
    document.querySelectorAll('.harvest-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const farmCard = this.closest('.farm-card');
            const farmName = farmCard.querySelector('.farm-tokens h3').textContent;
            const rewardEl = farmCard.querySelector('.detail-row.highlight .detail-value');
            const reward = rewardEl.textContent;
            
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-gift"></i> 收获';
                rewardEl.textContent = '0.0 TOKEN';
                rewardEl.classList.add('harvested');
                
                showNotification(`成功从 ${farmName} 收获了 ${reward}`, 'success');
                
                setTimeout(() => rewardEl.classList.remove('harvested'), 1000);
            }, 2000);
        });
    });
    
    // 一键收获按钮
    const harvestAllBtn = document.querySelector('.small-glow-btn');
    if (harvestAllBtn) {
        harvestAllBtn.addEventListener('click', function() {
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';
            
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-hand-holding-usd"></i> 一键收获';
                
                const rewardEl = document.querySelector('.user-stats .stat-row:nth-child(2) .stat-value');
                const reward = rewardEl.textContent;
                rewardEl.textContent = '0.0 TOKEN';
                rewardEl.classList.add('harvested');
                
                showNotification(`成功收获了所有奖励: ${reward}`, 'success');
                
                setTimeout(() => rewardEl.classList.remove('harvested'), 1000);
            }, 2000);
        });
    }
}

// AI聊天功能
function initAiChat() {
    const chatInput = document.querySelector('.chat-input input');
    const sendBtn = document.querySelector('.send-btn');
    const messagesContainer = document.querySelector('.chat-messages');
    
    if (!chatInput || !sendBtn || !messagesContainer) return;
    
    // 发送消息功能
    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;
        
        // 添加用户消息到聊天
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const userMsgHTML = `
            <div class="message user-message">
                <div class="message-content">
                    <p>${message}</p>
                </div>
                <div class="message-time">${time}</div>
            </div>
        `;
        messagesContainer.insertAdjacentHTML('beforeend', userMsgHTML);
        
        // 清空输入框
        chatInput.value = '';
        
        // 自动滚动到底部
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // 模拟AI回复
        setTimeout(() => {
            const aiResponses = [
                "根据当前市场分析，ETH-USDT池表现继续强劲，预计短期内APR将保持在40%以上。",
                "您的投资组合已经相当平衡，建议保持当前配置，特别关注BTC-ETH的市场变化。",
                "最近市场波动较大，建议增加稳定币占比至少40%，以降低风险。",
                "AI信号指标显示MATIC可能在近期出现回调，建议适当减仓或设置止损。"
            ];
            
            const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
            
            const aiMsgHTML = `
                <div class="message ai-message">
                    <div class="message-content">
                        <p>${randomResponse}</p>
                    </div>
                    <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
            `;
            messagesContainer.insertAdjacentHTML('beforeend', aiMsgHTML);
            
            // 自动滚动到底部
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 1000);
    }
    
    // 发送按钮点击事件
    sendBtn.addEventListener('click', sendMessage);
    
    // 回车键发送消息
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

// 初始化动画效果
function initAnimations() {
    // 大脑粒子动画增强
    const particles = document.querySelectorAll('.brain-particle');
    if (particles.length) {
        // 随机化粒子位置和动画延迟
        particles.forEach(particle => {
            const randomX = Math.floor(Math.random() * 100);
            const randomY = Math.floor(Math.random() * 100);
            const randomDelay = Math.random() * 3;
            
            particle.style.top = `${randomY}%`;
            particle.style.left = `${randomX}%`;
            particle.style.animationDelay = `${randomDelay}s`;
        });
    }
    
    // 添加鼠标悬停效果到卡片
    document.querySelectorAll('.glass-card').forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // 使卡片朝向鼠标方向倾斜（轻微）
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateY = (x - centerX) / 30;
            const rotateX = (centerY - y) / 30;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(5px)`;
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
}

// 管理员功能初始化
function initAdminFeatures() {
    const createFarmForm = document.querySelector('.create-farm-form');
    if (!createFarmForm) return;
    
    // 模拟表单提交
    createFarmForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const tokenAddress = document.getElementById('reward-token').value;
        const rewardRate = document.getElementById('reward-rate').value;
        
        if (!tokenAddress || !rewardRate) {
            showNotification('请填写所有必要字段', 'error');
            return;
        }
        
        const submitBtn = this.querySelector('.create-btn');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 创建中...';
        
        setTimeout(() => {
            submitBtn.innerHTML = '<i class="fas fa-plus-circle"></i> 创建农场';
            
            // 重置表单
            this.reset();
            
            showNotification('农场创建成功！新农场将在下次区块确认后显示', 'success');
        }, 2000);
    });
    
    // AI建议按钮
    const applyAiBtn = document.querySelector('.ai-recommendation .small-glow-btn');
    if (applyAiBtn) {
        applyAiBtn.addEventListener('click', function() {
            document.getElementById('reward-rate').value = '0.015';
            
            showNotification('已应用AI推荐参数', 'info');
        });
    }
}

// 仪表盘功能初始化
function initDashboardFeatures() {
    // 刷新仪表盘按钮
    const refreshBtn = document.querySelector('.refresh-dashboard-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 刷新中...';
            
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-sync-alt"></i> 刷新数据';
                
                // 模拟数据更新效果
                document.querySelectorAll('.donut-total, .metric-value, .item-value').forEach(el => {
                    el.classList.add('updated');
                    setTimeout(() => el.classList.remove('updated'), 1000);
                });
                
                showNotification('仪表盘数据已更新', 'success');
            }, 1500);
        });
    }
    
    // 应用建议按钮
    document.querySelectorAll('.apply-advice-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const adviceTitle = this.closest('.advice-item').querySelector('.advice-title').textContent;
            
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-check"></i>';
                
                showNotification(`已应用建议: ${adviceTitle}`, 'success');
            }, 1500);
        });
    });
    
    // 优化按钮
    const optimizeBtn = document.querySelector('.apply-btn');
    if (optimizeBtn) {
        optimizeBtn.addEventListener('click', function() {
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 优化中...';
            
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-magic"></i> 一键优化';
                
                showNotification('投资组合已成功优化，请查看您的资产分配', 'success');
            }, 2000);
        });
    }
}

// 通知功能
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // 设置通知图标
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    // 添加到页面
    if (!document.querySelector('.notifications-container')) {
        const container = document.createElement('div');
        container.className = 'notifications-container';
        document.body.appendChild(container);
    }
    
    document.querySelector('.notifications-container').appendChild(notification);
    
    // 添加可见性类
    setTimeout(() => notification.classList.add('visible'), 10);
    
    // 自动关闭通知
    setTimeout(() => {
        notification.classList.remove('visible');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
} 