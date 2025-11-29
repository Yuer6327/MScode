// Microsoft VS Code 塔防游戏核心逻辑
class VSCodeGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameState = 'menu'; // menu, playing, paused, gameOver, victory
        this.gameLoop = null;
        this.lastTime = 0;
        this.audioContext = null;
        this.sounds = {};
        this.musicVolume = 0.3;
        this.sfxVolume = 0.5;
        this.initialized = false;
        
        // 游戏配置
        this.config = {
            gridWidth: 9,
            gridHeight: 5,
            cellSize: 88, // 800px / 9 ≈ 88px
            rowHeight: 100, // 500px / 5 = 100px
            gameSpeed: 1,
            initialResources: {
                codeQuality: 1000,
                cpuUsage: 0,
                memoryUsage: 0
            }
        };
        
        // 游戏状态
        this.state = {
            level: 1,
            wave: 1,
            maxWaves: 10,
            health: 100,
            score: 0,
            resources: { ...this.config.initialResources },
            maxCpu: 100,
            maxMemory: 100
        };
        
        // 游戏网格
        this.grid = [];
        this.selectedTool = null;
        this.draggedTool = null;
        this.mousePos = { x: 0, y: 0 };
        
        // 游戏对象
        this.units = [];
        this.enemies = [];
        this.projectiles = [];
        this.floatingTexts = [];
        
        // 工具定义
        this.tools = [
            {
                id: 'debugger',
                name: '调试器',
                icon: '🐛',
                cost: { codeQuality: 100, cpuUsage: 10, memoryUsage: 5 },
                damage: 25,
                range: 2,
                fireRate: 1000,
                color: '#3b82f6',
                description: '基础攻击单位，发射调试光束'
            },
            {
                id: 'formatter',
                name: '格式化器',
                icon: '✨',
                cost: { codeQuality: 150, cpuUsage: 15, memoryUsage: 8 },
                damage: 15,
                range: 1.5,
                fireRate: 1500,
                color: '#22c55e',
                areaEffect: true,
                description: '范围攻击，清理格式错误'
            },
            {
                id: 'git',
                name: '版本控制',
                icon: '🔀',
                cost: { codeQuality: 200, cpuUsage: 20, memoryUsage: 10 },
                damage: 0,
                range: 2,
                fireRate: 2000,
                color: '#f59e0b',
                healAmount: 20,
                description: '治疗和支援单位'
            },
            {
                id: 'intellisense',
                name: '智能感知',
                icon: '💡',
                cost: { codeQuality: 120, cpuUsage: 12, memoryUsage: 6 },
                damage: 10,
                range: 2.5,
                fireRate: 800,
                color: '#8b5cf6',
                slowEffect: 0.5,
                description: '减速敌人移动速度'
            },
            {
                id: 'terminal',
                name: '终端',
                icon: '⚡',
                cost: { codeQuality: 300, cpuUsage: 25, memoryUsage: 15 },
                damage: 50,
                range: 1.5,
                fireRate: 2000,
                color: '#ef4444',
                description: '高伤害但攻击速度慢'
            },
            {
                id: 'extension',
                name: '扩展插件',
                icon: '🔧',
                cost: { codeQuality: 180, cpuUsage: 18, memoryUsage: 12 },
                damage: 5,
                range: 3,
                fireRate: 1000,
                color: '#06b6d4',
                buffEffect: 1.2,
                description: '增强周围单位能力'
            },
            {
                id: 'codereview',
                name: '代码审查',
                icon: '👁️',
                cost: { codeQuality: 160, cpuUsage: 14, memoryUsage: 8 },
                damage: 20,
                range: 2.5,
                fireRate: 1200,
                color: '#ec4899',
                revealInvisible: true,
                description: '揭示隐形敌人'
            },
            {
                id: 'autosave',
                name: '自动保存',
                icon: '💾',
                cost: { codeQuality: 250, cpuUsage: 22, memoryUsage: 18 },
                damage: 0,
                range: 0,
                fireRate: 0,
                color: '#84cc16',
                passiveDefense: 0.8,
                description: '被动防御，减少伤害'
            }
        ];
        
        // 敌人类型
        this.enemyTypes = [
            {
                id: 'syntaxError',
                name: '语法错误',
                icon: '❌',
                health: 50,
                speed: 1,
                reward: { codeQuality: 20, cpuUsage: -2, memoryUsage: -1 },
                color: '#dc2626',
                spawnRate: 0.4
            },
            {
                id: 'runtimeError',
                name: '运行时错误',
                icon: '⚠️',
                health: 75,
                speed: 1.5,
                reward: { codeQuality: 30, cpuUsage: -3, memoryUsage: -2 },
                color: '#ea580c',
                spawnRate: 0.3
            },
            {
                id: 'logicBug',
                name: '逻辑漏洞',
                icon: '🧠',
                health: 120,
                speed: 0.8,
                reward: { codeQuality: 50, cpuUsage: -4, memoryUsage: -2 },
                color: '#7c2d12',
                spawnRate: 0.2
            },
            {
                id: 'securityVulnerability',
                name: '安全漏洞',
                icon: '🔓',
                health: 90,
                speed: 1.2,
                reward: { codeQuality: 40, cpuUsage: -3, memoryUsage: -3 },
                color: '#86198f',
                spawnRate: 0.15,
                special: 'bypass'
            },
            {
                id: 'dependencyConflict',
                name: '依赖冲突',
                icon: '🔗',
                health: 100,
                speed: 1,
                reward: { codeQuality: 35, cpuUsage: -5, memoryUsage: -3 },
                color: '#0e7490',
                spawnRate: 0.1,
                special: 'areaDamage'
            }
        ];
        
        this.init();
    }
    
    init() {
        // 确保DOM完全加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initGame();
            });
        } else {
            this.initGame();
        }
    }
    
    initGame() {
        try {
            console.log('Initializing game...');
            this.setupEventListeners();
            this.createGrid();
            this.createTools();
            this.initAudio();
            this.updateUI();
            this.showStartModal();
            this.initialized = true;
            console.log('Game initialization complete');
        } catch (error) {
            console.error('Game initialization failed:', error);
            // 显示错误信息
            alert('游戏初始化失败，请刷新页面重试');
        }
    }
    
    initAudio() {
        // 初始化音频上下文
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
        
        // 预加载音效
        this.loadSound('laser', 'resources/laser-shot.mp3');
        this.loadSound('explosion', 'resources/explosion.mp3');
        this.loadSound('success', 'resources/success.mp3');
        this.loadSound('warning', 'resources/warning.mp3');
        this.loadSound('background', 'resources/background-music.mp3');
    }
    
    loadSound(name, url) {
        this.sounds[name] = new Audio(url);
        this.sounds[name].preload = 'auto';
    }
    
    playSound(name, volume = 1) {
        if (this.sounds[name]) {
            const sound = this.sounds[name].cloneNode();
            sound.volume = volume * this.sfxVolume;
            sound.play().catch(e => console.log('Sound play failed:', e));
        }
    }
    
    playBackgroundMusic() {
        if (this.sounds.background) {
            this.sounds.background.loop = true;
            this.sounds.background.volume = this.musicVolume;
            this.sounds.background.play().catch(e => console.log('Background music play failed:', e));
        }
    }
    
    stopBackgroundMusic() {
        if (this.sounds.background) {
            this.sounds.background.pause();
            this.sounds.background.currentTime = 0;
        }
    }
    
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // 开始游戏按钮
        const startBtn = document.getElementById('startGameBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                console.log('Start game button clicked');
                this.hideStartModal();
                this.startGame();
            });
        } else {
            console.error('Start game button not found');
        }
        
        // 教程按钮
        const tutorialBtn = document.getElementById('tutorialBtn');
        if (tutorialBtn) {
            tutorialBtn.addEventListener('click', () => {
                console.log('Tutorial button clicked');
                this.showTutorial();
            });
        }
        
        // 暂停按钮
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.pauseGame();
            });
        }
        
        // 重新开始按钮
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.hideGameOverModal();
                this.resetGame();
                this.startGame();
            });
        }
        
        // 主菜单按钮
        const mainMenuBtn = document.getElementById('mainMenuBtn');
        if (mainMenuBtn) {
            mainMenuBtn.addEventListener('click', () => {
                this.hideGameOverModal();
                this.resetGame();
                this.showStartModal();
            });
        }
        
        // 继续游戏按钮
        const resumeBtn = document.getElementById('resumeBtn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                this.hidePauseModal();
                this.resumeGame();
            });
        }
        
        // 鼠标事件
        const gameGrid = document.getElementById('gameGrid');
        if (gameGrid) {
            gameGrid.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            gameGrid.addEventListener('click', (e) => this.handleGridClick(e));
        }
        
        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // 防止拖拽默认行为
        document.addEventListener('dragstart', (e) => e.preventDefault());
        
        console.log('Event listeners setup complete');
    }
    
    showTutorial() {
        alert('教程功能开发中...\\n\\n基本操作：\\n1. 点击工具栏中的工具\\n2. 点击网格中的位置部署\\n3. 点击已部署的单位升级\\n4. 按空格键暂停游戏');
    }
    
    createGrid() {
        const gridContainer = document.getElementById('gameGrid');
        if (!gridContainer) {
            console.error('Game grid container not found');
            return;
        }
        
        gridContainer.innerHTML = '';
        
        this.grid = [];
        for (let row = 0; row < this.config.gridHeight; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.config.gridWidth; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.style.width = '100%';
                cell.style.height = '100%';
                
                gridContainer.appendChild(cell);
                this.grid[row][col] = {
                    element: cell,
                    occupied: false,
                    unit: null,
                    row: row,
                    col: col
                };
            }
        }
    }
    
    createTools() {
        const toolsContainer = document.getElementById('toolsContainer');
        if (!toolsContainer) {
            console.error('Tools container not found');
            return;
        }
        
        toolsContainer.innerHTML = '';
        
        this.tools.forEach((tool, index) => {
            const toolCard = document.createElement('div');
            toolCard.className = 'tool-card p-3 text-center';
            toolCard.dataset.toolId = tool.id;
            toolCard.innerHTML = `
                <div class="text-2xl mb-1">${tool.icon}</div>
                <div class="text-xs font-semibold mb-1">${tool.name}</div>
                <div class="text-xs text-slate-400 coding-font">
                    <div>💰${tool.cost.codeQuality}</div>
                    <div>🖥️${tool.cost.cpuUsage}%</div>
                </div>
            `;
            
            toolCard.addEventListener('click', () => this.selectTool(tool));
            toolCard.addEventListener('mouseenter', () => this.showToolTooltip(tool, toolCard));
            toolCard.addEventListener('mouseleave', () => this.hideToolTooltip());
            
            toolsContainer.appendChild(toolCard);
        });
    }
    
    selectTool(tool) {
        if (this.gameState !== 'playing') return;
        
        // 检查资源是否足够
        if (!this.canAfford(tool.cost)) {
            this.showFloatingText('资源不足!', 'red', 2000);
            return;
        }
        
        this.selectedTool = tool;
        this.updateToolCards();
        this.showFloatingText(`已选择: ${tool.name}`, 'blue', 1500);
    }
    
    canAfford(cost) {
        return this.state.resources.codeQuality >= cost.codeQuality &&
               (this.state.resources.cpuUsage + cost.cpuUsage) <= this.state.maxCpu &&
               (this.state.resources.memoryUsage + cost.memoryUsage) <= this.state.maxMemory;
    }
    
    placeUnit(row, col) {
        if (!this.selectedTool || this.gameState !== 'playing') return;
        
        // 检查位置是否有效
        if (this.grid[row][col].occupied) {
            this.showFloatingText('位置已被占用!', 'orange', 1500);
            return;
        }
        
        // 检查资源
        if (!this.canAfford(this.selectedTool.cost)) {
            this.showFloatingText('资源不足!', 'red', 1500);
            return;
        }
        
        // 消耗资源
        this.state.resources.codeQuality -= this.selectedTool.cost.codeQuality;
        this.state.resources.cpuUsage += this.selectedTool.cost.cpuUsage;
        this.state.resources.memoryUsage += this.selectedTool.cost.memoryUsage;
        
        // 创建单位
        const unit = new DefenseUnit(this.selectedTool, row, col);
        this.units.push(unit);
        this.grid[row][col].occupied = true;
        this.grid[row][col].unit = unit;
        
        // 更新UI
        this.updateUI();
        this.renderUnit(unit);
        
        // 清除选择
        this.selectedTool = null;
        this.updateToolCards();
        
        // 播放成功音效
        this.playSound('success', 0.5);
        
        this.showFloatingText(`${unit.tool.name}已部署!`, 'green', 1000);
    }
    
    renderUnit(unit) {
        const unitsContainer = document.getElementById('unitsContainer');
        if (!unitsContainer) {
            console.error('Units container not found');
            return;
        }
        
        const unitElement = document.createElement('div');
        unitElement.className = 'unit pulse';
        unitElement.style.left = `${unit.col * this.config.cellSize + 19}px`;
        unitElement.style.top = `${unit.row * this.config.rowHeight + 25}px`;
        unitElement.style.backgroundColor = unit.tool.color;
        unitElement.textContent = unit.tool.icon;
        unitElement.dataset.unitId = unit.id;
        
        // 添加等级指示器
        if (unit.level > 1) {
            const levelIndicator = document.createElement('div');
            levelIndicator.className = 'absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 text-black text-xs rounded-full flex items-center justify-center font-bold';
            levelIndicator.textContent = unit.level;
            unitElement.appendChild(levelIndicator);
        }
        
        // 添加点击事件用于升级
        unitElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.upgradeUnit(unit);
        });
        
        // 入场动画
        anime({
            targets: unitElement,
            scale: [0, 1],
            rotate: [0, 360],
            duration: 800,
            easing: 'easeOutElastic(1, .8)'
        });
        
        unitsContainer.appendChild(unitElement);
        unit.element = unitElement;
    }
    
    upgradeUnit(unit) {
        if (unit.level >= 3) {
            this.showFloatingText('已达最高等级!', 'yellow', 1500);
            return;
        }
        
        const upgradeCost = Math.floor(unit.tool.cost.codeQuality * (1.5 ** unit.level));
        if (this.state.resources.codeQuality < upgradeCost) {
            this.showFloatingText('资源不足!', 'red', 1500);
            return;
        }
        
        this.state.resources.codeQuality -= upgradeCost;
        unit.upgrade();
        this.updateUI();
        
        // 更新视觉效果
        unit.element.style.transform = 'scale(1.2)';
        setTimeout(() => {
            unit.element.style.transform = 'scale(1)';
        }, 300);
        
        // 播放成功音效
        this.playSound('success', 0.6);
        
        this.showFloatingText(`${unit.tool.name}升级到Lv${unit.level}!`, 'green', 1500);
    }
    
    spawnEnemy() {
        if (this.gameState !== 'playing') return;
        
        // 根据波次和难度选择敌人类型
        const availableEnemies = this.enemyTypes.filter(enemy => {
            // 根据关卡调整出现概率
            const levelMultiplier = Math.min(this.state.level * 0.1, 1);
            return Math.random() < enemy.spawnRate + levelMultiplier;
        });
        
        if (availableEnemies.length === 0) return;
        
        const enemyType = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
        const row = Math.floor(Math.random() * this.config.gridHeight);
        
        const enemy = new EnemyUnit(enemyType, row);
        this.enemies.push(enemy);
        this.renderEnemy(enemy);
    }
    
    renderEnemy(enemy) {
        const enemiesContainer = document.getElementById('enemiesContainer');
        if (!enemiesContainer) {
            console.error('Enemies container not found');
            return;
        }
        
        const enemyElement = document.createElement('div');
        enemyElement.className = 'enemy';
        enemyElement.style.left = `${enemy.x}px`;
        enemyElement.style.top = `${enemy.y}px`;
        enemyElement.style.backgroundColor = enemy.type.color;
        enemyElement.textContent = enemy.type.icon;
        enemyElement.dataset.enemyId = enemy.id;
        
        // 添加血条
        const healthBar = document.createElement('div');
        healthBar.className = 'absolute -top-2 left-0 w-full h-1 bg-gray-600 rounded';
        const healthFill = document.createElement('div');
        healthFill.className = 'h-full bg-red-500 rounded transition-all duration-300';
        healthFill.style.width = '100%';
        healthBar.appendChild(healthFill);
        enemyElement.appendChild(healthBar);
        
        enemy.healthBar = healthFill;
        enemy.element = enemyElement;
        
        // 入场动画
        anime({
            targets: enemyElement,
            scale: [0, 1],
            opacity: [0, 1],
            duration: 500,
            easing: 'easeOutBack'
        });
        
        enemiesContainer.appendChild(enemyElement);
    }
    
    createProjectile(fromUnit, toEnemy) {
        const projectile = {
            id: Date.now() + Math.random(),
            from: fromUnit,
            to: toEnemy,
            x: fromUnit.col * this.config.cellSize + 44,
            y: fromUnit.row * this.config.rowHeight + 50,
            speed: 8,
            damage: fromUnit.damage,
            element: null,
            trail: []
        };
        
        const projectilesContainer = document.getElementById('projectilesContainer');
        if (!projectilesContainer) {
            console.error('Projectiles container not found');
            return;
        }
        
        const projectileElement = document.createElement('div');
        projectileElement.className = 'projectile';
        projectileElement.style.left = `${projectile.x}px`;
        projectileElement.style.top = `${projectile.y}px`;
        projectileElement.style.backgroundColor = fromUnit.tool.color;
        projectileElement.style.boxShadow = `0 0 10px ${fromUnit.tool.color}`;
        
        // 添加发光效果
        projectileElement.style.animation = 'pulse 0.5s infinite';
        
        projectilesContainer.appendChild(projectileElement);
        projectile.element = projectileElement;
        
        this.projectiles.push(projectile);
        
        // 播放射击音效
        this.playSound('laser', 0.3);
    }
    
    showFloatingText(text, color = 'white', duration = 2000) {
        const floatingTextsContainer = document.getElementById('floatingTextsContainer');
        if (!floatingTextsContainer) {
            console.error('Floating texts container not found');
            return;
        }
        
        const textElement = document.createElement('div');
        textElement.className = 'floating-text';
        textElement.textContent = text;
        textElement.style.color = color;
        textElement.style.left = `${Math.random() * 300 + 250}px`;
        textElement.style.top = `${Math.random() * 200 + 150}px`;
        
        floatingTextsContainer.appendChild(textElement);
        
        // 动画效果
        anime({
            targets: textElement,
            translateY: -50,
            opacity: [1, 0],
            duration: duration,
            easing: 'easeOutQuad',
            complete: () => {
                textElement.remove();
            }
        });
    }
    
    updateToolCards() {
        const toolCards = document.querySelectorAll('.tool-card');
        toolCards.forEach(card => {
            const toolId = card.dataset.toolId;
            const tool = this.tools.find(t => t.id === toolId);
            
            if (this.selectedTool && this.selectedTool.id === toolId) {
                card.classList.add('ring-2', 'ring-blue-400');
            } else {
                card.classList.remove('ring-2', 'ring-blue-400');
            }
            
            if (!this.canAfford(tool.cost)) {
                card.classList.add('disabled');
            } else {
                card.classList.remove('disabled');
            }
        });
    }
    
    updateUI() {
        // 更新资源显示
        const codeQualityText = document.getElementById('codeQualityText');
        const cpuText = document.getElementById('cpuText');
        const memoryText = document.getElementById('memoryText');
        
        if (codeQualityText) codeQualityText.textContent = this.state.resources.codeQuality;
        if (cpuText) cpuText.textContent = `${this.state.resources.cpuUsage}%`;
        if (memoryText) memoryText.textContent = `${this.state.resources.memoryUsage}%`;
        
        // 更新进度条
        const cpuBar = document.getElementById('cpuBar');
        const memoryBar = document.getElementById('memoryBar');
        
        const cpuPercent = (this.state.resources.cpuUsage / this.state.maxCpu) * 100;
        const memoryPercent = (this.state.resources.memoryUsage / this.state.maxMemory) * 100;
        
        if (cpuBar) cpuBar.style.width = `${cpuPercent}%`;
        if (memoryBar) memoryBar.style.width = `${memoryPercent}%`;
        
        // 更新游戏状态
        const levelText = document.getElementById('levelText');
        const waveText = document.getElementById('waveText');
        const healthText = document.getElementById('healthText');
        
        if (levelText) levelText.textContent = this.state.level;
        if (waveText) waveText.textContent = `${this.state.wave}/${this.state.maxWaves}`;
        if (healthText) healthText.textContent = this.state.health;
        
        this.updateToolCards();
    }
    
    startGame() {
        this.gameState = 'playing';
        this.gameLoop = requestAnimationFrame((time) => this.update(time));
        this.scheduleNextWave();
        this.playBackgroundMusic();
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            cancelAnimationFrame(this.gameLoop);
            this.showPauseModal();
        }
    }
    
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.gameLoop = requestAnimationFrame((time) => this.update(time));
        }
    }
    
    resetGame() {
        // 清理游戏状态
        this.state = {
            level: 1,
            wave: 1,
            maxWaves: 10,
            health: 100,
            score: 0,
            resources: { ...this.config.initialResources },
            maxCpu: 100,
            maxMemory: 100
        };
        
        // 清理游戏对象
        this.units = [];
        this.enemies = [];
        this.projectiles = [];
        this.floatingTexts = [];
        
        // 清理网格
        this.grid.forEach(row => {
            row.forEach(cell => {
                cell.occupied = false;
                cell.unit = null;
            });
        });
        
        // 清理DOM元素
        const unitsContainer = document.getElementById('unitsContainer');
        const enemiesContainer = document.getElementById('enemiesContainer');
        const projectilesContainer = document.getElementById('projectilesContainer');
        const floatingTextsContainer = document.getElementById('floatingTextsContainer');
        
        if (unitsContainer) unitsContainer.innerHTML = '';
        if (enemiesContainer) enemiesContainer.innerHTML = '';
        if (projectilesContainer) projectilesContainer.innerHTML = '';
        if (floatingTextsContainer) floatingTextsContainer.innerHTML = '';
        
        this.updateUI();
    }
    
    update(currentTime) {
        if (this.gameState !== 'playing') return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // 更新单位
        this.units.forEach(unit => {
            unit.update(deltaTime, this.enemies, this);
        });
        
        // 更新敌人
        this.enemies.forEach(enemy => {
            enemy.update(deltaTime, this);
        });
        
        // 移除死亡的敌人
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.health <= 0) {
                // 给予奖励
                this.state.resources.codeQuality += enemy.type.reward.codeQuality;
                this.state.resources.cpuUsage = Math.max(0, this.state.resources.cpuUsage + enemy.type.reward.cpuUsage);
                this.state.resources.memoryUsage = Math.max(0, this.state.resources.memoryUsage + enemy.type.reward.memoryUsage);
                this.state.score += enemy.type.reward.codeQuality;
                
                // 移除DOM元素
                if (enemy.element) enemy.element.remove();
                
                this.showFloatingText(`+${enemy.type.reward.codeQuality}`, 'green', 1000);
                return false;
            }
            return true;
        });
        
        // 更新投射物
        this.projectiles.forEach(projectile => {
            this.updateProjectile(projectile);
        });
        
        // 移除完成的投射物
        this.projectiles = this.projectiles.filter(projectile => {
            if (projectile.completed) {
                if (projectile.element) projectile.element.remove();
                return false;
            }
            return true;
        });
        
        // 检查游戏结束条件
        if (this.state.health <= 0) {
            this.gameOver();
            return;
        }
        
        // 检查胜利条件
        if (this.state.wave > this.state.maxWaves) {
            this.victory();
            return;
        }
        
        this.updateUI();
        this.gameLoop = requestAnimationFrame((time) => this.update(time));
    }
    
    updateProjectile(projectile) {
        if (!projectile.to) {
            projectile.completed = true;
            return;
        }
        
        const targetX = projectile.to.x + 20; // 敌人中心
        const targetY = projectile.to.y + 20;
        
        const dx = targetX - projectile.x;
        const dy = targetY - projectile.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 15) {
            // 击中目标
            projectile.to.takeDamage(projectile.damage);
            projectile.completed = true;
            
            // 爆炸效果
            this.createExplosion(projectile.x, projectile.y, projectile.from.tool.color);
            
            // 播放爆炸音效
            this.playSound('explosion', 0.4);
            
            // 击中效果
            if (projectile.to.element) {
                projectile.to.element.classList.add('shake');
                setTimeout(() => {
                    if (projectile.to.element) {
                        projectile.to.element.classList.remove('shake');
                    }
                }, 500);
            }
            
            // 移除投射物元素
            if (projectile.element) {
                anime({
                    targets: projectile.element,
                    scale: [1, 0],
                    opacity: [1, 0],
                    duration: 200,
                    complete: () => {
                        if (projectile.element) {
                            projectile.element.remove();
                        }
                    }
                });
            }
        } else {
            // 移动投射物
            const moveX = (dx / distance) * projectile.speed;
            const moveY = (dy / distance) * projectile.speed;
            
            projectile.x += moveX;
            projectile.y += moveY;
            
            if (projectile.element) {
                projectile.element.style.left = `${projectile.x}px`;
                projectile.element.style.top = `${projectile.y}px`;
                
                // 添加轨迹效果
                projectile.element.style.boxShadow = `
                    0 0 20px ${projectile.from.tool.color},
                    0 0 40px ${projectile.from.tool.color}
                `;
            }
        }
    }
    
    createExplosion(x, y, color) {
        const explosion = document.createElement('div');
        explosion.className = 'absolute rounded-full pointer-events-none';
        explosion.style.left = `${x - 10}px`;
        explosion.style.top = `${y - 10}px`;
        explosion.style.width = '20px';
        explosion.style.height = '20px';
        explosion.style.backgroundColor = color;
        explosion.style.zIndex = '15';
        
        const projectilesContainer = document.getElementById('projectilesContainer');
        if (projectilesContainer) {
            projectilesContainer.appendChild(explosion);
            
            anime({
                targets: explosion,
                scale: [0, 2],
                opacity: [1, 0],
                duration: 300,
                easing: 'easeOutQuad',
                complete: () => {
                    explosion.remove();
                }
            });
        }
    }
    
    scheduleNextWave() {
        if (this.gameState !== 'playing') return;
        
        setTimeout(() => {
            this.spawnWave();
        }, 3000); // 3秒后开始下一波
    }
    
    spawnWave() {
        const enemyCount = Math.min(5 + this.state.wave * 2, 20);
        
        for (let i = 0; i < enemyCount; i++) {
            setTimeout(() => {
                this.spawnEnemy();
            }, i * 800); // 错开生成时间
        }
        
        this.state.wave++;
        this.updateUI();
        
        if (this.state.wave <= this.state.maxWaves) {
            this.scheduleNextWave();
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        cancelAnimationFrame(this.gameLoop);
        this.stopBackgroundMusic();
        this.playSound('warning', 0.7);
        
        const gameOverTitle = document.getElementById('gameOverTitle');
        const gameOverMessage = document.getElementById('gameOverMessage');
        const finalScore = document.getElementById('finalScore');
        const finalWave = document.getElementById('finalWave');
        
        if (gameOverTitle) gameOverTitle.textContent = '游戏结束';
        if (gameOverMessage) gameOverMessage.textContent = '你的代码库被错误攻陷了！';
        if (finalScore) finalScore.textContent = this.state.score;
        if (finalWave) finalWave.textContent = this.state.wave;
        
        this.showGameOverModal();
    }
    
    victory() {
        this.gameState = 'victory';
        cancelAnimationFrame(this.gameLoop);
        
        const victoryScore = document.getElementById('victoryScore');
        const victoryTime = document.getElementById('victoryTime');
        const victoryAccuracy = document.getElementById('victoryAccuracy');
        
        if (victoryScore) victoryScore.textContent = this.state.score;
        if (victoryTime) victoryTime.textContent = '5:32'; // 示例时间
        if (victoryAccuracy) victoryAccuracy.textContent = '85%'; // 示例准确率
        
        this.showVictoryModal();
    }
    
    // 模态框控制
    showStartModal() {
        const modal = document.getElementById('startModal');
        if (modal) {
            modal.classList.remove('hidden');
            console.log('Start modal shown');
        }
    }
    
    hideStartModal() {
        const modal = document.getElementById('startModal');
        if (modal) {
            modal.classList.add('hidden');
            console.log('Start modal hidden');
        }
    }
    
    showGameOverModal() {
        const modal = document.getElementById('gameOverModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }
    
    hideGameOverModal() {
        const modal = document.getElementById('gameOverModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    showVictoryModal() {
        const modal = document.getElementById('victoryModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }
    
    hideVictoryModal() {
        const modal = document.getElementById('victoryModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    showPauseModal() {
        const modal = document.getElementById('pauseModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }
    
    hidePauseModal() {
        const modal = document.getElementById('pauseModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    // 事件处理
    handleMouseMove(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        this.mousePos.x = e.clientX - rect.left;
        this.mousePos.y = e.clientY - rect.top;
    }
    
    handleGridClick(e) {
        if (this.gameState !== 'playing' || !this.selectedTool) return;
        
        const cell = e.target.closest('.grid-cell');
        if (!cell) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        this.placeUnit(row, col);
    }
    
    handleKeyDown(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            if (this.gameState === 'playing') {
                this.pauseGame();
            } else if (this.gameState === 'paused') {
                this.resumeGame();
            }
        }
        
        // 数字键选择工具
        if (e.code >= 'Digit1' && e.code <= 'Digit8') {
            const toolIndex = parseInt(e.code.slice(-1)) - 1;
            if (this.tools[toolIndex]) {
                this.selectTool(this.tools[toolIndex]);
            }
        }
        
        // ESC键取消选择
        if (e.code === 'Escape') {
            this.selectedTool = null;
            this.updateToolCards();
        }
    }
    
    showToolTooltip(tool, element) {
        // 简单的工具提示实现
        const tooltip = document.createElement('div');
        tooltip.className = 'absolute bg-slate-800 text-white p-2 rounded text-xs z-50 pointer-events-none';
        tooltip.textContent = tool.description;
        tooltip.style.left = `${element.offsetLeft}px`;
        tooltip.style.top = `${element.offsetTop - 40}px`;
        
        element.appendChild(tooltip);
        element.tooltip = tooltip;
    }
    
    hideToolTooltip() {
        const tooltips = document.querySelectorAll('.tool-card .absolute');
        tooltips.forEach(tooltip => tooltip.remove());
    }
}

// 防御单位类
class DefenseUnit {
    constructor(tool, row, col) {
        this.id = Date.now() + Math.random();
        this.tool = tool;
        this.row = row;
        this.col = col;
        this.level = 1;
        this.damage = tool.damage;
        this.range = tool.range;
        this.fireRate = tool.fireRate;
        this.lastFireTime = 0;
        this.element = null;
    }
    
    upgrade() {
        this.level++;
        this.damage = Math.floor(this.tool.damage * (1.5 ** (this.level - 1)));
        this.range = this.tool.range * (1.1 ** (this.level - 1));
        this.fireRate = Math.max(this.tool.fireRate * (0.8 ** (this.level - 1)), 200);
    }
    
    update(deltaTime, enemies, game) {
        const currentTime = Date.now();
        
        if (currentTime - this.lastFireTime >= this.fireRate) {
            const target = this.findTarget(enemies);
            if (target) {
                game.createProjectile(this, target);
                this.lastFireTime = currentTime;
            }
        }
    }
    
    findTarget(enemies) {
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        enemies.forEach(enemy => {
            const distance = this.getDistanceToEnemy(enemy);
            if (distance <= this.range * 100 && distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        });
        
        return closestEnemy;
    }
    
    getDistanceToEnemy(enemy) {
        const dx = (this.col * 100 + 44) - (enemy.x + 20);
        const dy = (this.row * 100 + 50) - (enemy.y + 20);
        return Math.sqrt(dx * dx + dy * dy);
    }
}

// 敌人类
class EnemyUnit {
    constructor(type, row) {
        this.id = Date.now() + Math.random();
        this.type = type;
        this.row = row;
        this.x = 800; // 从右侧开始
        this.y = row * 100 + 30;
        this.health = type.health;
        this.maxHealth = type.health;
        this.speed = type.speed;
        this.element = null;
        this.healthBar = null;
    }
    
    update(deltaTime, game) {
        // 移动敌人
        this.x -= this.speed * (deltaTime / 16); // 基于60fps标准化
        
        if (this.element) {
            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y}px`;
        }
        
        // 检查是否到达终点
        if (this.x <= 0) {
            game.state.health -= 10;
            this.health = 0; // 标记为死亡
            game.showFloatingText('-10 生命值!', 'red', 2000);
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        
        // 更新血条显示
        if (this.element && this.healthBar) {
            const healthPercent = Math.max(0, (this.health / this.maxHealth) * 100);
            this.healthBar.style.width = `${healthPercent}%`;
            
            // 根据血量改变颜色
            if (healthPercent > 60) {
                this.healthBar.style.backgroundColor = '#22c55e'; // 绿色
            } else if (healthPercent > 30) {
                this.healthBar.style.backgroundColor = '#f59e0b'; // 黄色
            } else {
                this.healthBar.style.backgroundColor = '#ef4444'; // 红色
            }
        }
        
        // 受伤动画
        if (this.element) {
            anime({
                targets: this.element,
                scale: [1, 1.2, 1],
                duration: 200,
                easing: 'easeInOutQuad'
            });
        }
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.vscodeGame = new VSCodeGame();
        
        // 添加后备启动按钮（如果自动初始化失败）
        setTimeout(() => {
            if (!window.vscodeGame.initialized) {
                console.warn('Game not initialized, adding fallback button');
                const fallbackBtn = document.createElement('button');
                fallbackBtn.textContent = '启动游戏';
                fallbackBtn.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded z-50';
                fallbackBtn.onclick = () => {
                    if (window.vscodeGame) {
                        window.vscodeGame.initGame();
                        fallbackBtn.remove();
                    }
                };
                document.body.appendChild(fallbackBtn);
            }
        }, 2000);
    } catch (error) {
        console.error('Failed to create game instance:', error);
    }
});