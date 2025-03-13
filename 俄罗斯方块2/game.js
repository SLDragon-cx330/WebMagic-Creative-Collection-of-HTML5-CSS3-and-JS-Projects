// 定义俄罗斯方块的形状
const SHAPES = {
    I: [
        [1, 1, 1, 1]
    ],
    O: [
        [1, 1],
        [1, 1]
    ],
    T: [
        [0, 1, 0],
        [1, 1, 1]
    ],
    S: [
        [0, 1, 1],
        [1, 1, 0]
    ],
    Z: [
        [1, 1, 0],
        [0, 1, 1]
    ],
    J: [
        [1, 0, 0],
        [1, 1, 1]
    ],
    L: [
        [0, 0, 1],
        [1, 1, 1]
    ]
};

// 定义颜色
const COLORS = {
    I: '#00f0f0',
    O: '#f0f000',
    T: '#a000f0',
    S: '#00f000',
    Z: '#f00000',
    J: '#0000f0',
    L: '#f0a000'
};

class Tetris {
    constructor() {
        this.ROWS = 20;
        this.COLS = 9;
        this.grid = Array(this.ROWS).fill().map(() => Array(this.COLS).fill(0));
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('tetrisHighScore')) || 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.paused = false;
        this.currentPiece = null;
        this.nextPiece = this.generatePiece();
        this.holdPiece = null;
        this.canHold = true;
        this.dropInterval = 1000;
        this.dropCounter = 0;
        this.lastTime = 0;
        
        // 初始化游戏网格
        this.gameGrid = document.querySelector('.game-grid');
        this.previewGrid = document.querySelector('.preview-grid');
        this.holdGrid = document.querySelector('.hold-grid');
        
        // 创建游戏网格单元格
        this.initializeGrids();
        
        // 绑定控制按钮
        this.bindControls();
        
        // 更新分数显示
        this.updateScore();

        // 绑定赞助按钮和游玩简介按钮
        const sponsorButton = document.querySelector('button:has(.fa-heart)');
        const instructionsButton = document.querySelector('button:has(.fa-gamepad)');
        if (sponsorButton) {
            sponsorButton.addEventListener('click', () => this.showSponsorDialog());
        }
        if (instructionsButton) {
            instructionsButton.addEventListener('click', () => this.showInstructionsDialog());
        }
    }

    initializeGrids() {
        // 初始化主游戏网格
        for (let i = 0; i < this.ROWS * this.COLS; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            this.gameGrid.appendChild(cell);
        }

        // 初始化预览网格
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('div');
            cell.className = 'preview-cell';
            this.previewGrid.appendChild(cell);
        }

        // 初始化暂存网格
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('div');
            cell.className = 'preview-cell';
            this.holdGrid.appendChild(cell);
        }
    }

    generatePiece() {
        const shapes = Object.keys(SHAPES);
        const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
        return {
            shape: SHAPES[randomShape],
            color: COLORS[randomShape],
            type: randomShape,
            x: Math.floor((this.COLS - SHAPES[randomShape][0].length) / 2),
            y: 0
        };
    }

    rotateMatrix(matrix, dir = 1) {
        const N = matrix.length;
        const M = matrix[0].length;
        const result = Array(M).fill().map(() => Array(N).fill(0));
        
        if (dir === 1) { // 顺时针旋转
            for (let i = 0; i < N; i++) {
                for (let j = 0; j < M; j++) {
                    result[j][N-1-i] = matrix[i][j];
                }
            }
        } else { // 逆时针旋转
            for (let i = 0; i < N; i++) {
                for (let j = 0; j < M; j++) {
                    result[M-1-j][i] = matrix[i][j];
                }
            }
        }
        
        return result;
    }

    rotate(dir = 1) {
        if (!this.currentPiece || this.gameOver || this.paused) return;
        
        const rotated = this.rotateMatrix(this.currentPiece.shape, dir);
        if (this.isValidMove(this.currentPiece, 0, 0, rotated)) {
            this.currentPiece.shape = rotated;
            this.draw();
        }
    }

    isValidMove(piece, offsetX = 0, offsetY = 0, rotatedShape = null) {
        const shape = rotatedShape || piece.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const newX = piece.x + x + offsetX;
                    const newY = piece.y + y + offsetY;
                    if (newX < 0 || newX >= this.COLS || newY >= this.ROWS ||
                        (newY >= 0 && this.grid[newY][newX])) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    merge() {
        this.currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const newY = this.currentPiece.y + y;
                    const newX = this.currentPiece.x + x;
                    if (newY >= 0) {
                        this.grid[newY][newX] = this.currentPiece.color;
                    }
                }
            });
        });
    }

    clearLines() {
        let linesCleared = 0;
        for (let y = this.ROWS - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== 0)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(this.COLS).fill(0));
                linesCleared++;
                y++;
                
                // 显示消除行数的动画
                this.showLinesClearedAnimation(linesCleared);
            }
        }
        if (linesCleared > 0) {
            this.updateScore(linesCleared);
        }
    }

    showLinesClearedAnimation(lines) {
        const notification = document.createElement('div');
        notification.className = 'lines-cleared-notification';
        notification.textContent = `消除 ${lines} 行！`;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(74, 144, 226, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 18px;
            animation: fadeOut 1s ease-in-out forwards;
            z-index: 1000;
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 1000);
    }

    showGameOverDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'game-over-dialog';
        dialog.innerHTML = `
            <div class="bg-black/80 backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center">
                <div class="bg-blue-900/90 p-6 rounded-lg shadow-xl border border-blue-400 max-w-sm w-full mx-4">
                    <h2 class="text-2xl font-bold text-blue-100 mb-4">游戏结束！</h2>
                    <div class="space-y-2 mb-6">
                        <p class="text-blue-200">本局得分: <span class="text-primary font-bold">${this.score}</span></p>
                        <p class="text-blue-200">历史最高: <span class="text-primary font-bold">${this.highScore}</span></p>
                        <p class="text-blue-200">达到等级: <span class="text-primary font-bold">${this.level}</span></p>
                    </div>
                    <div class="flex justify-center">
                        <button class="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg transition-colors duration-200" onclick="game.reset(); this.parentElement.parentElement.parentElement.remove();">
                            重新开始
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    updateScore(linesCleared = 0) {
        const points = [0, 100, 300, 500, 800];
        this.score += points[linesCleared] * this.level;
        this.lines += linesCleared;
        this.level = Math.floor(this.lines / 10) + 1;
        this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);

        // 更新最高分
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('tetrisHighScore', this.highScore);
        }

        // 更新显示
        document.querySelector('.text-primary').textContent = this.score;
        document.querySelector('.text-secondary').textContent = this.level;
        document.querySelector('.text-primary:last-child').textContent = this.highScore;
    }

    draw() {
        // 清空网格
        const cells = this.gameGrid.children;
        for (let y = 0; y < this.ROWS; y++) {
            for (let x = 0; x < this.COLS; x++) {
                const cell = cells[y * this.COLS + x];
                cell.style.background = this.grid[y][x] || '#FFFFFF';
            }
        }

        // 绘制当前方块
        if (this.currentPiece) {
            this.currentPiece.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        const newY = this.currentPiece.y + y;
                        const newX = this.currentPiece.x + x;
                        if (newY >= 0 && newY < this.ROWS && newX >= 0 && newX < this.COLS) {
                            cells[newY * this.COLS + newX].style.background = this.currentPiece.color;
                        }
                    }
                });
            });
        }

        // 更新预览区域
        this.updatePreview();
        
        // 更新暂存区域
        this.updateHold();
    }

    updatePreview() {
        const previewCells = this.previewGrid.children;
        for (let i = 0; i < 16; i++) {
            previewCells[i].style.background = '#FFFFFF';
        }
        
        if (this.nextPiece) {
            const shape = this.nextPiece.shape;
            shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        const index = y * 4 + x;
                        if (index < 16) {
                            previewCells[index].style.background = this.nextPiece.color;
                        }
                    }
                });
            });
        }
    }

    updateHold() {
        const holdCells = this.holdGrid.children;
        for (let i = 0; i < 16; i++) {
            holdCells[i].style.background = '#FFFFFF';
        }
        
        if (this.holdPiece) {
            const shape = SHAPES[this.holdPiece];
            shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        const index = y * 4 + x;
                        if (index < 16) {
                            holdCells[index].style.background = COLORS[this.holdPiece];
                        }
                    }
                });
            });
        }
    }

    bindControls() {
        // 绑定键盘控制
        document.addEventListener('keydown', this.handleKeyPress.bind(this));

        // 绑定按钮控制
        const buttons = {
            'pause': () => this.togglePause(),
            'play': () => this.start(),
            'arrows-rotate': () => this.reset(),
            'arrow-left': () => this.move(-1),
            'arrow-down': () => this.drop(),
            'arrow-right': () => this.move(1),
            'arrow-rotate-left': () => this.rotate(-1),
            'arrow-rotate-right': () => this.rotate(1)
        };

        document.querySelectorAll('.control-btn').forEach(btn => {
            const icon = btn.querySelector('i');
            if (icon) {
                const action = Object.keys(buttons).find(key => 
                    icon.classList.contains(`fa-${key}`)
                );
                if (action) {
                    btn.addEventListener('click', buttons[action]);
                }
            }
        });
    }

    handleKeyPress(event) {
        if (this.gameOver || this.paused) return;

        switch(event.keyCode) {
            case 37: // 左箭头
                this.move(-1);
                break;
            case 39: // 右箭头
                this.move(1);
                break;
            case 40: // 下箭头
                this.drop();
                break;
            case 38: // 上箭头
                this.rotate(1);
                break;
            case 32: // 空格
                this.hardDrop();
                break;
            case 67: // C键
                this.hold();
                break;
        }
    }

    move(dir) {
        if (!this.currentPiece || this.gameOver || this.paused) return;
        
        if (this.isValidMove(this.currentPiece, dir, 0)) {
            this.currentPiece.x += dir;
            this.draw();
        }
    }

    drop() {
        if (!this.currentPiece || this.gameOver || this.paused) return;
        
        if (this.isValidMove(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
            this.draw();
        } else {
            this.merge();
            this.clearLines();
            this.currentPiece = this.nextPiece;
            this.nextPiece = this.generatePiece();
            
            if (!this.isValidMove(this.currentPiece, 0, 0)) {
                this.gameOver = true;
                this.showGameOverDialog();
                return;
            }
            
            this.canHold = true;
            this.draw();
        }
    }

    hardDrop() {
        if (!this.currentPiece || this.gameOver || this.paused) return;
        
        while (this.isValidMove(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
        }
        this.drop();
    }

    hold() {
        if (!this.currentPiece || !this.canHold || this.gameOver || this.paused) return;
        
        const currentType = this.currentPiece.type;
        if (this.holdPiece === null) {
            this.holdPiece = currentType;
            this.currentPiece = this.nextPiece;
            this.nextPiece = this.generatePiece();
        } else {
            const temp = this.holdPiece;
            this.holdPiece = currentType;
            this.currentPiece = {
                shape: SHAPES[temp],
                color: COLORS[temp],
                type: temp,
                x: Math.floor((this.COLS - SHAPES[temp][0].length) / 2),
                y: 0
            };
        }
        
        this.canHold = false;
        this.draw();
    }

    togglePause() {
        this.paused = !this.paused;
        if (!this.paused) {
            this.lastTime = performance.now();
            this.update();
        }
    }

    reset() {
        this.grid = Array(this.ROWS).fill().map(() => Array(this.COLS).fill(0));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.paused = false;
        this.currentPiece = this.generatePiece();
        this.nextPiece = this.generatePiece();
        this.holdPiece = null;
        this.canHold = true;
        this.dropInterval = 1000;
        this.dropCounter = 0;
        this.lastTime = performance.now();
        this.updateScore();
        this.draw();
        this.update();
    }

    start() {
        if (!this.currentPiece) {
            this.reset();
        } else {
            this.paused = false;
            this.lastTime = performance.now();
            this.update();
        }
    }

    update(time = performance.now()) {
        if (this.gameOver || this.paused) return;

        const deltaTime = time - this.lastTime;
        this.dropCounter += deltaTime;

        if (this.dropCounter > this.dropInterval) {
            this.drop();
            this.dropCounter = 0;
        }

        this.lastTime = time;
        requestAnimationFrame(this.update.bind(this));
    }

    showSponsorDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'sponsor-dialog';
        dialog.innerHTML = `
            <div class="bg-black/80 backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center">
                <div class="bg-blue-900/90 p-6 rounded-lg shadow-xl border border-blue-400 max-w-sm w-full mx-4">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-bold text-blue-100">赞助作者</h2>
                        <button class="text-blue-300 hover:text-blue-100" onclick="this.parentElement.parentElement.parentElement.remove();">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="text-center space-y-4">
                        <img src="qr_code.png" alt="支付二维码" class="w-48 h-48 mx-auto rounded-lg">
                        <div class="space-y-2 text-blue-200">
                            <p>感谢您的支持！</p>
                            <p>您的赞助将帮助我们开发更多有趣的游戏。</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    showInstructionsDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'instructions-dialog';
        dialog.innerHTML = `
            <div class="bg-black/80 backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center">
                <div class="bg-blue-900/90 p-6 rounded-lg shadow-xl border border-blue-400 max-w-sm w-full mx-4">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-bold text-blue-100">游戏说明</h2>
                        <button class="text-blue-300 hover:text-blue-100" onclick="this.parentElement.parentElement.parentElement.remove();">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="space-y-4 text-blue-200">
                        <div class="space-y-2">
                            <h3 class="text-lg font-semibold text-blue-100">游戏控制：</h3>
                            <p>← → ：左右移动</p>
                            <p>↓ ：加速下落</p>
                            <p>↑ ：顺时针旋转</p>
                            <p>空格：直接落下</p>
                            <p>C键：暂存方块</p>
                        </div>
                        <div class="space-y-2">
                            <h3 class="text-lg font-semibold text-blue-100">游戏规则：</h3>
                            <p>• 每消除10行升一级</p>
                            <p>• 等级越高，方块下落速度越快</p>
                            <p>• 一次消除多行可获得更高分数</p>
                        </div>
                        <div class="space-y-2">
                            <h3 class="text-lg font-semibold text-blue-100">关于作者：</h3>
                            <p>抖音号：I.will.return</p>
                            <p>欢迎关注获取更多游戏更新！</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
    }
}

// 初始化游戏
const game = new Tetris(); 