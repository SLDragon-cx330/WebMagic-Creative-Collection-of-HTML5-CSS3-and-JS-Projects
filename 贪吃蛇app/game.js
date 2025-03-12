class Snake {
    constructor(canvas, playerName) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = Math.floor(Math.min(canvas.width, canvas.height) / 20);
        this.playerName = playerName;
        this.reset();
    }

    reset() {
        this.snake = [{x: 5, y: 5}];
        this.direction = 'right';
        this.food = this.generateFood();
        this.score = 0;
        this.health = 100;
        this.gameOver = false;
        this.speed = 150;
        this.isInvincible = false;
        this.clones = [];
        this.baseSpeed = 150;

        // 技能冷却时间（毫秒）
        this.skillCooldowns = {
            speedBoost: 0,
            invincible: 0,
            magnetFood: 0,
            clone: 0
        };
        this.cooldownTime = 10000; // 10秒冷却时间
    }

    generateFood() {
        const x = Math.floor(Math.random() * (this.canvas.width / this.gridSize));
        const y = Math.floor(Math.random() * (this.canvas.height / this.gridSize));
        return {x, y};
    }

    update() {
        if (this.gameOver) return;

        // 更新蛇的位置
        const head = {...this.snake[0]};
        switch(this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // 检查碰撞
        if (!this.isInvincible) {
            if (this.checkCollision(head) || this.checkWallCollision(head)) {
                this.gameOver = true;
                this.saveScore();
                return;
            }
        } else {
            // 无敌状态下穿墙
            head.x = (head.x + Math.floor(this.canvas.width / this.gridSize)) % Math.floor(this.canvas.width / this.gridSize);
            head.y = (head.y + Math.floor(this.canvas.height / this.gridSize)) % Math.floor(this.canvas.height / this.gridSize);
        }

        this.snake.unshift(head);

        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.food = this.generateFood();
            // 不删除尾部，蛇会变长
        } else {
            this.snake.pop();
        }

        // 更新分身
        this.clones.forEach(clone => {
            clone.update();
        });
    }

    checkWallCollision(head) {
        return (
            head.x < 0 ||
            head.y < 0 ||
            head.x >= Math.floor(this.canvas.width / this.gridSize) ||
            head.y >= Math.floor(this.canvas.height / this.gridSize)
        );
    }

    checkCollision(head) {
        // 检查自身碰撞
        return this.snake.some((segment, index) => {
            if (index === 0) return false;
            return segment.x === head.x && segment.y === head.y;
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制食物
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(
            this.food.x * this.gridSize,
            this.food.y * this.gridSize,
            this.gridSize - 2,
            this.gridSize - 2
        );

        // 绘制蛇
        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = this.isInvincible ? '#ffff00' : '#15B8A6';
            this.ctx.fillRect(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });

        // 绘制分身
        this.clones.forEach(clone => {
            clone.draw();
        });
    }

    // 技能：加速
    speedBoost() {
        if (this.skillCooldowns.speedBoost > Date.now()) return false;
        
        this.speed = this.baseSpeed / 2;
        setTimeout(() => {
            this.speed = this.baseSpeed;
        }, 3000);
        
        this.skillCooldowns.speedBoost = Date.now() + this.cooldownTime;
        return true;
    }

    // 技能：无敌
    activateInvincible() {
        if (this.skillCooldowns.invincible > Date.now()) return false;
        
        this.isInvincible = true;
        setTimeout(() => {
            this.isInvincible = false;
        }, 5000);
        
        this.skillCooldowns.invincible = Date.now() + this.cooldownTime;
        return true;
    }

    // 技能：吸引食物
    magnetFood() {
        if (this.skillCooldowns.magnetFood > Date.now()) return false;
        
        const head = this.snake[0];
        const distance = Math.sqrt(
            Math.pow(this.food.x - head.x, 2) + 
            Math.pow(this.food.y - head.y, 2)
        );
        
        if (distance < 5) {
            this.food.x = head.x;
            this.food.y = head.y;
        }
        
        this.skillCooldowns.magnetFood = Date.now() + this.cooldownTime;
        return true;
    }

    // 技能：分身
    createClone() {
        if (this.skillCooldowns.clone > Date.now()) return false;
        
        const clone = {
            snake: [...this.snake],
            direction: this.direction,
            update: function() {
                const head = {...this.snake[0]};
                switch(this.direction) {
                    case 'up': head.y--; break;
                    case 'down': head.y++; break;
                    case 'left': head.x--; break;
                    case 'right': head.x++; break;
                }
                this.snake.unshift(head);
                this.snake.pop();
            },
            draw: () => {
                this.ctx.fillStyle = 'rgba(21, 184, 166, 0.5)';
                clone.snake.forEach(segment => {
                    this.ctx.fillRect(
                        segment.x * this.gridSize,
                        segment.y * this.gridSize,
                        this.gridSize - 2,
                        this.gridSize - 2
                    );
                });
            }
        };
        
        this.clones.push(clone);
        setTimeout(() => {
            const index = this.clones.indexOf(clone);
            if (index > -1) {
                this.clones.splice(index, 1);
            }
        }, 5000);
        
        this.skillCooldowns.clone = Date.now() + this.cooldownTime;
        return true;
    }

    saveScore() {
        // 读取现有分数
        let scores = [];
        try {
            const savedScores = localStorage.getItem('snakeScores');
            if (savedScores) {
                scores = JSON.parse(savedScores);
            }
        } catch (e) {
            console.error('Error reading scores:', e);
        }

        // 添加新分数
        scores.push({
            playerName: this.playerName,
            score: this.score,
            date: new Date().toISOString()
        });

        // 按分数排序
        scores.sort((a, b) => b.score - a.score);

        // 只保留前10名
        scores = scores.slice(0, 10);

        // 保存到 localStorage
        try {
            localStorage.setItem('snakeScores', JSON.stringify(scores));
        } catch (e) {
            console.error('Error saving scores:', e);
        }

        // 显示游戏结束界面
        document.getElementById('player-name').textContent = this.playerName;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver-modal').style.display = 'flex';
    }
}

// 游戏控制器
class GameController {
    constructor() {
        this.setupUsernameHandler();
    }

    setupUsernameHandler() {
        const usernameInput = document.getElementById('username-input');
        const startGameBtn = document.getElementById('start-game');
        const usernameError = document.getElementById('username-error');
        const gameContent = document.getElementById('game-content');
        const usernameModal = document.getElementById('username-modal');

        // 输入验证
        usernameInput.addEventListener('input', () => {
            const username = usernameInput.value.trim();
            if (username.length >= 2 && username.length <= 20) {
                usernameError.style.display = 'none';
                startGameBtn.disabled = false;
                startGameBtn.style.opacity = '1';
            } else {
                usernameError.style.display = 'block';
                startGameBtn.disabled = true;
                startGameBtn.style.opacity = '0.5';
            }
        });

        // 开始游戏按钮点击事件
        startGameBtn.addEventListener('click', () => {
            const username = usernameInput.value.trim();
            if (username.length >= 2 && username.length <= 20) {
                this.playerName = username;
                usernameModal.style.display = 'none';
                gameContent.style.display = 'block';
                this.initializeGame();
            }
        });

        // Enter键开始游戏
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !startGameBtn.disabled) {
                startGameBtn.click();
            }
        });
    }

    initializeGame() {
        this.canvas = document.getElementById('gameCanvas');
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        this.snake = new Snake(this.canvas, this.playerName);
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.setupEventListeners();
        this.gameLoop();
    }

    setupEventListeners() {
        // 触摸控制
        const controlPad = document.querySelector('.control-pad');
        let touchStartX = 0;
        let touchStartY = 0;
        let lastDirection = '';

        controlPad.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        controlPad.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const deltaX = touchX - touchStartX;
            const deltaY = touchY - touchStartY;
            const threshold = 30; // 最小滑动距离阈值

            if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    // 水平移动
                    if (deltaX > 0 && this.snake.direction !== 'left' && lastDirection !== 'right') {
                        this.snake.direction = 'right';
                        lastDirection = 'right';
                    } else if (deltaX < 0 && this.snake.direction !== 'right' && lastDirection !== 'left') {
                        this.snake.direction = 'left';
                        lastDirection = 'left';
                    }
                } else {
                    // 垂直移动
                    if (deltaY > 0 && this.snake.direction !== 'up' && lastDirection !== 'down') {
                        this.snake.direction = 'down';
                        lastDirection = 'down';
                    } else if (deltaY < 0 && this.snake.direction !== 'down' && lastDirection !== 'up') {
                        this.snake.direction = 'up';
                        lastDirection = 'up';
                    }
                }
            }
        });

        // 键盘控制
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                    if (this.snake.direction !== 'down') this.snake.direction = 'up';
                    break;
                case 'ArrowDown':
                    if (this.snake.direction !== 'up') this.snake.direction = 'down';
                    break;
                case 'ArrowLeft':
                    if (this.snake.direction !== 'right') this.snake.direction = 'left';
                    break;
                case 'ArrowRight':
                    if (this.snake.direction !== 'left') this.snake.direction = 'right';
                    break;
            }
        });

        // 重新开始按钮
        document.getElementById('restartBtn').addEventListener('click', () => {
            document.getElementById('gameOver-modal').style.display = 'none';
            this.restartGame();
        });

        // 游戏结束时查看排行榜按钮
        document.getElementById('showLeaderboardBtn').addEventListener('click', () => {
            document.getElementById('gameOver-modal').style.display = 'none';
            this.showLeaderboard();
        });

        // 排行榜按钮
        document.getElementById('leaderboardBtn').addEventListener('click', () => {
            if (this.snake.gameOver) {
                this.showLeaderboard();
            } else {
                // 如果游戏正在进行，先暂停
                const wasGameOver = this.snake.gameOver;
                this.showLeaderboard();
                // 关闭排行榜时恢复游戏状态
                const leaderboardModal = document.getElementById('leaderboard-modal');
                const closeBtn = leaderboardModal.querySelector('button');
                closeBtn.onclick = () => {
                    leaderboardModal.style.display = 'none';
                    if (!wasGameOver) {
                        this.gameLoop();
                    }
                };
            }
        });

        // 技能按钮
        document.querySelector('[data-skill="speedBoost"]').addEventListener('click', () => {
            this.snake.speedBoost();
        });
        document.querySelector('[data-skill="invincible"]').addEventListener('click', () => {
            this.snake.activateInvincible();
        });
        document.querySelector('[data-skill="magnetFood"]').addEventListener('click', () => {
            this.snake.magnetFood();
        });
        document.querySelector('[data-skill="clone"]').addEventListener('click', () => {
            this.snake.createClone();
        });
    }

    gameLoop() {
        if (!this.snake.gameOver) {
            this.snake.update();
            this.snake.draw();
            document.querySelector('.score').textContent = `分数: ${this.snake.score}`;
            setTimeout(() => this.gameLoop(), this.snake.speed);
        }
    }

    showLeaderboard() {
        const leaderboardContent = document.getElementById('leaderboard-content');
        const leaderboardModal = document.getElementById('leaderboard-modal');
        
        // 清空现有内容
        leaderboardContent.innerHTML = '';
        
        try {
            // 获取分数数据
            const savedScores = localStorage.getItem('snakeScores');
            let scores = [];
            
            if (savedScores) {
                scores = JSON.parse(savedScores);
                
                // 创建排行榜表格
                const table = document.createElement('table');
                table.className = 'w-full text-left';
                
                // 添加表头
                const thead = document.createElement('thead');
                thead.innerHTML = `
                    <tr class="border-b border-primary/30">
                        <th class="py-3 px-4 text-primary">排名</th>
                        <th class="py-3 px-4 text-primary">玩家</th>
                        <th class="py-3 px-4 text-primary">分数</th>
                        <th class="py-3 px-4 text-primary">日期</th>
                    </tr>
                `;
                table.appendChild(thead);
                
                // 添加数据行
                const tbody = document.createElement('tbody');
                scores.forEach((score, index) => {
                    const row = document.createElement('tr');
                    row.className = 'border-b border-primary/10 hover:bg-primary/5';
                    
                    // 判断是否是当前玩家
                    const isCurrentPlayer = score.playerName === this.playerName;
                    const playerNameClass = isCurrentPlayer ? 'text-primary font-bold' : 'text-white';
                    
                    const date = new Date(score.date);
                    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    
                    row.innerHTML = `
                        <td class="py-3 px-4 text-primary">${index + 1}</td>
                        <td class="py-3 px-4 ${playerNameClass}">${score.playerName}</td>
                        <td class="py-3 px-4 text-white">${score.score}</td>
                        <td class="py-3 px-4 text-gray-400">${formattedDate}</td>
                    `;
                    tbody.appendChild(row);
                });
                table.appendChild(tbody);
                
                leaderboardContent.appendChild(table);
            } else {
                // 没有记录时显示提示
                leaderboardContent.innerHTML = '<p class="text-center text-gray-400">暂无游戏记录</p>';
            }
        } catch (e) {
            console.error('Error loading leaderboard:', e);
            leaderboardContent.innerHTML = '<p class="text-center text-red-500">加载排行榜时出错</p>';
        }
        
        // 显示排行榜
        leaderboardModal.style.display = 'block';

        // 添加关闭排行榜时自动重新开始游戏的功能
        const closeBtn = leaderboardModal.querySelector('button');
        closeBtn.onclick = () => {
            leaderboardModal.style.display = 'none';
            if (this.snake.gameOver) {
                this.restartGame();
            }
        };
    }

    restartGame() {
        this.snake.reset();
        this.gameLoop();
    }
} 