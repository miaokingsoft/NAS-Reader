// 全局变量
const API_BASE = 'api';
let currentPage = 1;
let totalPages = 1;
let isLoading = false;
let currentSearch = '';
let currentSort = 'newest';
let currentArticleId = null;
const pageSize = 60; // 每页显示60条记录，需要与db.php中的DEFAULT_PAGE_SIZE保持一致

// 不再需要全局计时变量，使用后端返回的数据库查询时间

// DOM元素
const articlesContainer = document.getElementById('articles-container');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const sortTags = document.getElementById('sort-tags');
const themeToggle = document.getElementById('theme-toggle');
const articleModal = document.getElementById('article-modal');
const modalTitle = document.getElementById('modal-title');
const modalContent = document.getElementById('modal-content');
const modalHits = document.getElementById('modal-hits');
const modalStore = document.getElementById('modal-store');
const modalDelete = document.getElementById('modal-delete');
const loadTimeElement = document.getElementById('load-time');
// 分页相关元素
const pagination = document.getElementById('pagination');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageNumbers = document.getElementById('page-numbers');

// 更新加载耗时显示
function updateLoadTime(dbTime) {
    // 直接使用后端提供的数据库查询耗时
    if (loadTimeElement) {
        loadTimeElement.textContent = dbTime;
    }
    return dbTime;
}

// 初始化
function init() {
    // 加载文章列表
    loadArticles();
    
    // 设置事件监听
    setupEventListeners();
    
    // 加载主题偏好
    loadThemePreference();
}

// 设置事件监听
function setupEventListeners() {
    try {
        // 搜索功能
        if (searchInput && typeof debounce === 'function' && typeof handleSearch === 'function') {
            searchInput.addEventListener('input', debounce(handleSearch, 300));
        }
        if (searchBtn && typeof handleSearch === 'function') {
            searchBtn.addEventListener('click', handleSearch);
        }
        
        // 排序功能 - 标签方式
        if (sortTags && typeof handleSortChange === 'function') {
            sortTags.addEventListener('click', function(e) {
                try {
                    const tag = e.target.closest('.sort-tag');
                    if (tag && !tag.classList.contains('active')) {
                        handleSortChange(tag.dataset.sort);
                    }
                } catch (err) {
                    console.error('Sort tag click error:', err);
                }
            });
        }
        
        // 主题切换
        if (themeToggle && typeof toggleTheme === 'function') {
            themeToggle.addEventListener('click', toggleTheme);
        }
        
        // 模态框控制
        if (articleModal && typeof closeArticleModal === 'function') {
            articleModal.addEventListener('click', function(e) {
                if (e.target === articleModal) {
                    closeArticleModal();
                }
            });
        }
        
        // ESC键关闭模态框
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && articleModal && articleModal.classList.contains('active') && typeof closeArticleModal === 'function') {
                closeArticleModal();
            }
        });
        
        // 收藏按钮事件
        if (modalStore && typeof handleStoreToggle === 'function') {
            modalStore.addEventListener('click', handleStoreToggle);
        }
        
        // 删除按钮事件
        if (modalDelete && typeof handleDeleteArticle === 'function') {
            modalDelete.addEventListener('click', handleDeleteArticle);
        }
        
        // 分页控制
        if (prevPageBtn && typeof goToPreviousPage === 'function') {
            prevPageBtn.addEventListener('click', goToPreviousPage);
        }
        if (nextPageBtn && typeof goToNextPage === 'function') {
            nextPageBtn.addEventListener('click', goToNextPage);
        }
        if (pageNumbers && typeof goToPage === 'function') {
            pageNumbers.addEventListener('click', function(e) {
                try {
                    const pageBtn = e.target.closest('.page-number');
                    if (pageBtn && !pageBtn.classList.contains('active')) {
                        const pageNum = parseInt(pageBtn.textContent);
                        if (!isNaN(pageNum) && pageNum !== currentPage) {
                            goToPage(pageNum);
                        }
                    }
                } catch (err) {
                    console.error('Page number click error:', err);
                }
            });
        }
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// 加载文章列表
async function loadArticles() {
    if (isLoading) return;
    
    isLoading = true;
    
    // 显示加载指示器
    articlesContainer.innerHTML = `
        <div class="loading-indicator">
            <div class="spinner"></div>
            <p>加载中...</p>
        </div>
    `;
    
    try {
        // 构建请求URL
        const url = new URL(`${API_BASE}/articles.php`, window.location.origin);
        url.searchParams.append('page', currentPage);
        url.searchParams.append('limit', pageSize);
        url.searchParams.append('search', currentSearch);
        url.searchParams.append('sort', currentSort);
        
        // 如果是'关注'标签，添加stored参数筛选已收藏文章
        if (currentSort === 'stored') {
            url.searchParams.append('stored', '1');
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        // 更新加载耗时（使用后端返回的数据库查询时间）
        if (data.dbTime) {
            updateLoadTime(data.dbTime);
        }
        
        // 检查是否有错误
        if (data.error) {
            throw new Error(data.error);
        }
        
        // 清空容器
        articlesContainer.innerHTML = '';
        
        // 添加文章到列表
        if (data.data && data.data.length > 0) {
            data.data.forEach(article => {
                articlesContainer.appendChild(createArticleCard(article));
            });
            
            // 使用API返回的总页数
            totalPages = data.totalPages || 1;
            
            // 更新分页控件
            updatePagination();
        } else {
            // 如果没有数据，显示无结果
            articlesContainer.innerHTML = `
                <div class="no-results">
                    <h3>没有找到相关文章</h3>
                    <p>请尝试其他搜索关键词</p>
                </div>
            `;
            
            // 隐藏分页控件
            pagination.style.display = 'none';
        }
        
    } catch (error) {
        console.error('加载文章失败:', error);
        
        // 失败时不更新耗时，因为没有数据库查询时间
        
        articlesContainer.innerHTML = `
            <div class="no-results">
                <h3>加载失败</h3>
                <p>无法加载文章列表，请刷新页面重试</p>
            </div>
        `;
        
        // 隐藏分页控件
        pagination.style.display = 'none';
    } finally {
        isLoading = false;
    }
}

// 创建文章卡片 - 优化展示功能，直接使用数据源中的摘要信息
function createArticleCard(article) {
    const card = document.createElement('div');
    card.className = 'article-card';
    card.dataset.id = article.id;
    
    // 生成卡片HTML
    card.innerHTML = `
        <div class="article-actions">
            <button class="action-btn store ${article.store == 1 ? 'stored' : ''}" data-id="${article.id}" title="${article.store == 1 ? '取消收藏' : '收藏'}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
            </button>
            <button class="action-btn delete" data-id="${article.id}" title="删除">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </div>
        <h3 class="article-title">${highlightKeyword(article.title, currentSearch)}</h3>
        <div class="article-preview">${highlightKeyword(article.preview, currentSearch)}</div>
        <div class="article-meta">
            <span class="article-hits">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
                ${article.hits}
            </span>
            <span class="article-store">
                ${article.store == 1 ? '已收藏' : ''}
            </span>
        </div>
    `;
    
    // 添加事件监听
    card.addEventListener('click', (e) => {
        // 避免点击操作按钮时触发卡片点击
        if (!e.target.closest('.article-actions')) {
            openArticleModal(article.id);
        }
    });
    
    // 收藏按钮事件
    const storeBtn = card.querySelector('.action-btn.store');
    storeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleStore(article.id, storeBtn);
    });
    
    // 删除按钮事件
    const deleteBtn = card.querySelector('.action-btn.delete');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('确定要删除这篇文章吗？')) {
            deleteArticle(article.id, card);
        }
    });
    
    return card;
}

// 高亮关键词
function highlightKeyword(text, keyword) {
    if (!keyword) return text;
    
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// 更新分页控件
function updatePagination() {
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    
    // 更新上一页/下一页按钮状态
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
    
    // 清空页码容器
    pageNumbers.innerHTML = '';
    
    // 生成页码按钮 - 默认显示10个页签按钮
    const pageButtons = [];
    const maxButtons = 10;
    
    // 如果总页数小于等于最大按钮数，直接显示所有页码
    if (totalPages <= maxButtons) {
        for (let i = 1; i <= totalPages; i++) {
            pageButtons.push(i);
        }
    } else {
        // 否则，需要计算显示范围，确保当前页在可见范围内
        let startPage, endPage;
        
        // 确保当前页在中间位置附近
        if (currentPage <= Math.ceil(maxButtons / 2)) {
            // 当前页靠前，从第1页开始显示
            startPage = 1;
            endPage = maxButtons - 2; // 留出位置显示最后一页和省略号
        } else if (currentPage >= totalPages - Math.floor(maxButtons / 2) + 1) {
            // 当前页靠后，显示到最后一页
            endPage = totalPages;
            startPage = totalPages - (maxButtons - 3); // 留出位置显示第一页和省略号
        } else {
            // 当前页在中间，以当前页为中心显示
            startPage = currentPage - Math.floor((maxButtons - 3) / 2); // 留出位置显示首尾和省略号
            endPage = currentPage + Math.ceil((maxButtons - 3) / 2);
        }
        
        // 添加第一页（仅当起始页大于1时）
        if (startPage > 1) {
            pageButtons.push(1);
            
            // 如果第一页和起始页之间有间隔，添加省略号
            if (startPage > 2) {
                pageButtons.push('...');
            }
        }
        
        // 添加中间的页码
        // 确保不会重复添加第一页（修复重复页签问题）
        const actualStart = startPage > 1 ? startPage : 1;
        for (let i = actualStart; i <= endPage; i++) {
            pageButtons.push(i);
        }
        
        // 如果结束页和最后一页之间有间隔，添加省略号和最后一页
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pageButtons.push('...');
            }
            // 只有当最后一页没有被包含在中间页码中时，才添加最后一页
            if (endPage < totalPages) {
                pageButtons.push(totalPages);
            }
        }
    }
    
    // 创建页码按钮
    pageButtons.forEach(page => {
        if (page === '...') {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'page-ellipsis';
            ellipsis.textContent = '...';
            pageNumbers.appendChild(ellipsis);
        } else {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-number ${page === currentPage ? 'active' : ''}`;
            pageBtn.textContent = page;
            pageNumbers.appendChild(pageBtn);
        }
    });
}

// 跳转到上一页
function goToPreviousPage() {
    if (currentPage > 1) {
        currentPage--;
        loadArticles();
    }
}

// 跳转到下一页
function goToNextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        loadArticles();
    }
}

// 跳转到指定页
function goToPage(pageNum) {
    currentPage = pageNum;
    loadArticles();
}

// 处理搜索
function handleSearch() {
    const searchTerm = searchInput.value.trim();
    
    // 重置分页状态
    currentPage = 1;
    currentSearch = searchTerm;
    
    // 加载新的搜索结果
    loadArticles();
}

// 处理排序变更
function handleSortChange(sortValue) {
    currentSort = sortValue;
    
    // 更新活跃的排序标签
    document.querySelectorAll('.sort-tag').forEach(tag => {
        tag.classList.toggle('active', tag.dataset.sort === sortValue);
    });
    
    // 重置分页状态
    currentPage = 1;
    
    // 加载新的排序结果
    loadArticles();
}

// 创建顶部通知组件
function createNotification(message, type = 'error') {
    // 检查是否已存在通知，如有则移除
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 添加到body
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// 打开文章详情模态框 - 通过传递ID参数从SexBooks数据源中读取完整数据
async function openArticleModal(articleId) {
    currentArticleId = articleId;
    
    // 先显示模态框和加载状态
    modalTitle.textContent = '加载中...';
    modalContent.innerHTML = '<div class="modal-loading"><div class="spinner"></div><p>正在加载文章内容...</p></div>';
    modalHits.textContent = '';
    modalStore.classList.remove('stored');
    modalStore.title = '收藏';
    
    // 立即显示模态框
    articleModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    try {
        const url = new URL(`${API_BASE}/article.php`, window.location.origin);
        url.searchParams.append('id', articleId);
        
        // 检查响应状态
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }
        
        // 获取原始响应文本，以便在JSON解析失败时进行调试
        const responseText = await response.text();
        
        // 检查响应文本是否为空
        if (!responseText.trim()) {
            throw new Error('API返回空响应');
        }
        
        // 尝试解析JSON
        let article;
        try {
            article = JSON.parse(responseText);
        } catch (jsonError) {
            console.error('JSON解析错误，原始响应:', responseText);
            throw new Error(`JSON解析错误: ${jsonError.message}`);
        }
        
        // 更新加载耗时（使用后端返回的数据库查询时间）
        if (article.dbTime) {
            updateLoadTime(article.dbTime);
        }
        
        if (article.error) {
            throw new Error(article.error);
        }
        
        // 更新模态框内容 - 确保显示从SexBooks数据源读取的完整数据
        modalTitle.textContent = `${article.id}: ${article.title || '无标题'}`;
        // 安全处理内容，确保即使content为undefined也不会出错，并处理换行符
        if (article.content) {
            // 首先进行HTML解码（因为后端已经用htmlspecialchars处理过）
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = article.content;
            const decodedContent = tempDiv.textContent || tempDiv.innerText || '';
            
            // 将所有类型的换行符统一转换为HTML换行标签
            const formattedContent = decodedContent.replace(/\r?\n/g, '<br>');
            modalContent.innerHTML = formattedContent;
        } else {
            modalContent.innerHTML = '<p>文章内容暂不可用</p>';
        }
        modalHits.textContent = `${article.hits || 0}`;
        
        // 更新收藏状态
        if (article.store) {
            modalStore.classList.add('stored');
            modalStore.title = '取消收藏';
        } else {
            modalStore.classList.remove('stored');
            modalStore.title = '收藏';
        }
        
    } catch (error) {
        console.error('加载文章详情失败:', error);
        
        // 失败时不更新耗时，因为没有数据库查询时间
        
        modalTitle.textContent = '加载失败';
        modalContent.innerHTML = `<div class="error-message">无法加载文章详情，请稍后重试。<br>错误信息: ${error.message}</div>`;
        createNotification('无法加载文章详情，请重试', 'error');
    }
}

// 关闭文章详情模态框
function closeArticleModal() {
    articleModal.classList.remove('active');
    document.body.style.overflow = '';
    currentArticleId = null;
}

// 切换收藏状态
async function toggleStore(articleId, button) {
    try {
        // 添加加载状态
        const originalText = button.title || '';
        button.title = '处理中...';
        button.disabled = true;
        
        const response = await fetch(`${API_BASE}/action.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'store',
                id: articleId
            })
        });
        
        // 恢复按钮状态
        button.title = originalText;
        button.disabled = false;
        
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            // 更新按钮状态
            if (data.store) {
                button.classList.add('stored');
                button.title = '取消收藏';
                if (modalStore && currentArticleId === articleId) {
                    modalStore.classList.add('stored');
                    modalStore.title = '取消收藏';
                }
                createNotification('收藏成功', 'success');
            } else {
                button.classList.remove('stored');
                button.title = '收藏';
                if (modalStore && currentArticleId === articleId) {
                    modalStore.classList.remove('stored');
                    modalStore.title = '收藏';
                }
                createNotification('已取消收藏', 'info');
            }
        }
    } catch (error) {
        console.error('切换收藏状态失败:', error);
        createNotification('操作失败，请重试', 'error');
    }
}

// 模态框中的收藏切换
function handleStoreToggle() {
    if (currentArticleId) {
        toggleStore(currentArticleId, modalStore);
    }
}

// 模态框中的删除文章
function handleDeleteArticle() {
    if (currentArticleId && confirm('确定要删除这篇文章吗？')) {
        // 查找对应的文章卡片元素
        const cardElement = document.querySelector(`.article-card[data-id="${currentArticleId}"]`);
        // 调用删除函数
        deleteArticle(currentArticleId, cardElement);
    }
}

// 删除文章
async function deleteArticle(articleId, cardElement) {
    try {
        // 添加动画效果
        cardElement.classList.add('deleting');
        
        const response = await fetch(`${API_BASE}/action.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'delete',
                id: articleId
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            // 从DOM中移除卡片（带动画）
            setTimeout(() => {
                articlesContainer.removeChild(cardElement);
                createNotification('文章已成功删除', 'success');
            }, 300);
            
            // 如果当前打开的是这篇文章，关闭模态框
            if (currentArticleId === articleId) {
                closeArticleModal();
            }
        }
    } catch (error) {
        console.error('删除文章失败:', error);
        cardElement.classList.remove('deleting');
        createNotification('删除失败，请重试', 'error');
    }
}

// 主题切换
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon();
}

// 更新主题图标
function updateThemeIcon() {
    const isDark = document.body.classList.contains('dark-theme');
    const svg = themeToggle.querySelector('svg');
    
    if (isDark) {
        // 白天图标
        svg.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    } else {
        // 夜晚图标
        svg.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    }
}

// 加载主题偏好
function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.classList.add('dark-theme');
    }
    
    updateThemeIcon();
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 初始化应用
init();