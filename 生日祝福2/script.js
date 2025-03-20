document.addEventListener('DOMContentLoaded', function() {
    const musicBtn = document.getElementById('musicBtn');
    const bgMusic = document.getElementById('bgMusic');
    const blessBtn = document.getElementById('blessBtn');
    const cardModal = document.getElementById('cardModal');
    const closeCard = document.getElementById('closeCard');
    let isMusicPlaying = false;
    let hasUserInteracted = false;

    // 音乐播放控制
    musicBtn.addEventListener('click', async function() {
        if (!hasUserInteracted) {
            hasUserInteracted = true;
        }
        
        if (isMusicPlaying) {
            bgMusic.pause();
            musicBtn.innerHTML = '<i class="fas fa-music text-white text-lg"></i>';
        } else {
            try {
                await bgMusic.play();
                musicBtn.innerHTML = '<i class="fas fa-pause text-white text-lg"></i>';
            } catch (error) {
                console.log('播放失败:', error);
            }
        }
        isMusicPlaying = !isMusicPlaying;
    });

    // 贺卡弹窗控制
    blessBtn.addEventListener('click', async function() {
        cardModal.classList.add('show');
        // 播放音乐（如果还没播放且用户已经交互过）
        if (!isMusicPlaying && hasUserInteracted) {
            try {
                await bgMusic.play();
                musicBtn.innerHTML = '<i class="fas fa-pause text-white text-lg"></i>';
                isMusicPlaying = true;
            } catch (error) {
                console.log('播放失败:', error);
            }
        }
    });

    closeCard.addEventListener('click', function() {
        cardModal.classList.remove('show');
    });

    // 点击模态框外部关闭
    cardModal.addEventListener('click', function(e) {
        if (e.target === cardModal) {
            cardModal.classList.remove('show');
        }
    });

    // 移动端触摸事件处理
    let touchStartY = 0;
    let touchEndY = 0;

    cardModal.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
    });

    cardModal.addEventListener('touchmove', function(e) {
        touchEndY = e.touches[0].clientY;
    });

    cardModal.addEventListener('touchend', function() {
        const swipeDistance = touchEndY - touchStartY;
        if (Math.abs(swipeDistance) > 50) {
            cardModal.classList.remove('show');
        }
    });
}); 