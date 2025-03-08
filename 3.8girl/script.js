// 花朵数据
const flowers = [
    { id: 1, name: '玫瑰', image: 'https://ai-public.mastergo.com/ai/img_res/d61c25b04163b0bc66c1dbc7fdd37a55.jpg' },
    { id: 2, name: '百合', image: 'https://ai-public.mastergo.com/ai/img_res/68020281f349cf415e20da3de2b25b86.jpg' },
    { id: 3, name: '郁金香', image: 'https://ai-public.mastergo.com/ai/img_res/d734afd2e1be73c3880643dbc626d4b9.jpg' },
    { id: 4, name: '雏菊', image: 'https://ai-public.mastergo.com/ai/img_res/8237e27bff46892273ddc343ffdf3700.jpg' }
];

// 奖品数据
const prizes = [
    { id: 1, name: '和小geigei一日游体验', value: 399, image: 'https://ai-public.mastergo.com/ai/img_res/2ce60108964677239101159e4e1ad3cc.jpg' },
    { id: 2, name: '和小geigei游泳体验卡', value: 199, image: 'https://ai-public.mastergo.com/ai/img_res/27693819c7342f509dff06f820e437ee.jpg' },
    { id: 3, name: '1.66元红包', value: 1.66, image: 'https://ai-public.mastergo.com/ai/img_res/307c83fcaa1713deeb4e9201445c2363.jpg' },
    { id: 4, name: '精美礼品套装', value: 88, image: 'https://ai-public.mastergo.com/ai/img_res/af93e97569242011d1e0a3e75096b7ad.jpg' }
];

// 当前用户数据
let userData = {
    remainingDraws: 3,
    prizes: []
};

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    initializeFlowerSelection();
    initializePrizeDrawing();
    initializeNavigation();
    initializeSharing();
    createModalContainer();
});

// 创建模态框容器
function createModalContainer() {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'modalContainer';
    modalContainer.className = 'fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center';
    document.body.appendChild(modalContainer);
}

// 花朵选择功能
function initializeFlowerSelection() {
    const flowerButtons = document.querySelectorAll('.grid.grid-cols-4 button');
    const mainFlower = document.querySelector('.flower-container img');

    flowerButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            mainFlower.classList.remove('bloom-animation');
            void mainFlower.offsetWidth; // 触发重绘
            mainFlower.src = flowers[index].image;
            mainFlower.classList.add('bloom-animation');
        });
    });
}

// 抽奖动画
function showDrawAnimation() {
    return new Promise((resolve) => {
        const prizeGrid = document.querySelector('.grid.grid-cols-2');
        const prizes = prizeGrid.children;
        let currentIndex = 0;
        let rounds = 0;
        const totalRounds = 3;
        
        function highlightPrize() {
            // 移除之前的高亮
            Array.from(prizes).forEach(prize => {
                prize.classList.remove('ring-4', 'ring-primary');
            });
            
            // 添加新的高亮
            prizes[currentIndex].classList.add('ring-4', 'ring-primary');
            
            currentIndex = (currentIndex + 1) % prizes.length;
            
            if (currentIndex === 0) {
                rounds++;
            }
            
            if (rounds < totalRounds) {
                setTimeout(highlightPrize, 100);
            } else {
                setTimeout(resolve, 500);
            }
        }
        
        highlightPrize();
    });
}

// 显示中奖卡片
function showPrizeCard(prize) {
    return new Promise((resolve) => {
        const modalContainer = document.getElementById('modalContainer');
        const uniqueId = generateUniqueId();
        
        const cardHtml = `
            <div class="bg-white rounded-xl p-6 max-w-xs w-full mx-4 transform transition-transform duration-500 scale-0">
                <div class="text-center mb-4">
                    <img src="${prize.image}" class="w-32 h-32 object-cover rounded-lg mx-auto mb-4" alt="${prize.name}">
                    <h3 class="text-xl font-bold text-gray-800 mb-2">恭喜您获得</h3>
                    <p class="text-lg text-primary font-medium mb-1">${prize.name}</p>
                    <p class="text-sm text-gray-500">价值：¥${prize.value}</p>
                </div>
                <button class="w-full py-3 bg-primary text-white font-medium rounded-lg" onclick="this.closest('#modalContainer').classList.add('hidden'); ${resolve()}">
                    立即收下
                </button>
            </div>
        `;
        
        modalContainer.innerHTML = cardHtml;
        modalContainer.classList.remove('hidden');
        
        // 触发动画
        setTimeout(() => {
            modalContainer.querySelector('.scale-0').classList.remove('scale-0');
        }, 10);
        
        // 将uniqueId添加到奖品数据中
        prize.uniqueId = uniqueId;
    });
}

// 生成唯一ID
function generateUniqueId() {
    return 'prize_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 显示使用二维码
function showQRCode(prize) {
    const modalContainer = document.getElementById('modalContainer');
    const qrCodeHtml = `
        <div class="bg-white rounded-xl p-6 max-w-xs w-full mx-4">
            <div class="text-center mb-4">
                <div class="w-48 h-48 mx-auto mb-4 flex items-center justify-center">
                    <img src="ewm.png" class="w-full h-full object-contain" alt="二维码">
                </div>
                <h3 class="text-lg font-bold text-gray-800 mb-2">${prize.name}</h3>
                <p class="text-sm text-gray-500 mb-2">请联系小geigei进行核销使用</p>
                <p class="text-xs text-gray-400">产品ID：${prize.uniqueId}</p>
            </div>
            <button class="w-full py-3 bg-primary text-white font-medium rounded-lg" onclick="document.getElementById('modalContainer').classList.add('hidden')">
                关闭
            </button>
        </div>
    `;
    
    modalContainer.innerHTML = qrCodeHtml;
    modalContainer.classList.remove('hidden');
}

// 抽奖功能
async function initializePrizeDrawing() {
    const drawButton = document.querySelector('.bg-primary.text-white.font-medium');
    
    drawButton.addEventListener('click', async () => {
        if (userData.remainingDraws <= 0) {
            alert('今日抽奖次数已用完！');
            return;
        }

        // 禁用抽奖按钮
        drawButton.disabled = true;
        drawButton.classList.add('opacity-50');

        userData.remainingDraws--;
        
        // 播放抽奖动画
        await showDrawAnimation();
        
        const prizeIndex = Math.floor(Math.random() * prizes.length);
        const prize = {
            ...prizes[prizeIndex],
            timestamp: new Date().toLocaleString()
        };
        
        // 显示中奖卡片
        await showPrizeCard(prize);
        
        // 添加到用户奖品列表
        userData.prizes.push(prize);
        
        // 更新界面
        updatePrizesList();
        updateRemainingDraws();
        
        // 恢复抽奖按钮
        drawButton.disabled = false;
        drawButton.classList.remove('opacity-50');
    });
}

// 更新奖品列表
function updatePrizesList() {
    const prizesList = document.querySelector('.space-y-3');
    prizesList.innerHTML = userData.prizes.map(prize => `
        <div class="flex items-center justify-between p-3 bg-secondary rounded-lg">
            <div class="flex items-center space-x-3">
                <img src="${prize.image}" class="w-16 h-16 object-cover rounded-lg" alt="${prize.name}">
                <div>
                    <div class="text-sm font-medium text-gray-800">${prize.name}</div>
                    <div class="text-xs text-gray-500">${prize.timestamp}</div>
                </div>
            </div>
            <button class="px-3 py-1 text-sm text-primary border border-primary rounded-button use-prize-btn" 
                data-prize='${JSON.stringify(prize)}'>
                使用
            </button>
        </div>
    `).join('');

    // 添加事件监听
    const useButtons = prizesList.querySelectorAll('.use-prize-btn');
    useButtons.forEach(button => {
        button.addEventListener('click', () => {
            const prizeData = JSON.parse(button.dataset.prize);
            showQRCode(prizeData);
        });
    });
}

// 更新剩余抽奖次数
function updateRemainingDraws() {
    const drawsText = document.querySelector('.text-sm.text-gray-500.text-center');
    drawsText.textContent = `今日剩余抽奖次数：${userData.remainingDraws} 次`;
}

// 导航功能
function initializeNavigation() {
    const navButtons = document.querySelectorAll('nav.fixed.bottom-0 button');
    const sections = ['main > div:nth-child(1)', '.bg-white.rounded-lg:nth-child(3)', '.mt-6.bg-white'];

    navButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            document.querySelector(sections[index]).scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// 分享功能
function initializeSharing() {
    const shareButton = document.querySelector('nav.fixed.top-0 button');
    
    shareButton.addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({
                title: '女神节快乐',
                text: '送您一朵数字鲜花，愿您如花绽放，美丽动人！',
                url: window.location.href
            });
        } else {
            alert('复制链接成功，快去分享给好友吧！');
        }
    });
} 