class AVLVisualizer {
    constructor() {
        // --- CONFIG ---
        this.config = {
            TRAVEL_DURATION: 450,
            NODE_SIZE: 54,
            NODE_V_GAP: 90,
        };

        // --- DOM REFS ---
        this.dom = {
            userList: document.getElementById('userList'),
            avlToggle: document.getElementById('avlToggle'),
            generateBtn: document.getElementById('generateBtn'),
            resetBtn: document.getElementById('resetBtn'),
            canvasContainer: document.getElementById('canvasContainer'),
            canvas: document.getElementById('canvas'),
            edgeSvg: document.getElementById('edge-svg'),
            log: document.getElementById('log'),
            delayRange: document.getElementById('delayRange'),
            delayVal: document.getElementById('delayVal'),
            findBtn: document.getElementById('findBtn'),
            searchInput: document.getElementById('searchInput'),
            deleteBtn: document.getElementById('deleteBtn'),
            deleteInput: document.getElementById('deleteInput'),
            inorderBtn: document.getElementById('inorderBtn'),
            preorderBtn: document.getElementById('preorderBtn'),
            postorderBtn: document.getElementById('postorderBtn'),
            bfsBtn: document.getElementById('bfsBtn'),
            pauseResumeBtn: document.getElementById('pauseResumeBtn'),
            stepBtn: document.getElementById('stepBtn'),
            nodeCountStat: document.getElementById('nodeCountStat'),
            treeHeightStat: document.getElementById('treeHeightStat'),
        };

        // --- STATE ---
        this.tree = null;
        this.animating = false;
        this.stepDelay = 600;
        this.nodeIdCounter = 0;
        this.nodesById = new Map();
        this.edgesById = new Map();
        this.isAvlMode = true;
        this.animationControls = { isPaused: false, stepPromise: null, resolveStep: null };

        this.bindEventListeners();
        this.init();
    }

    init() {
        this.dom.delayVal.textContent = this.dom.delayRange.value;
        this.stepDelay = Number(this.dom.delayRange.value);
        this.updateTreeStats();
    }
    
    bindEventListeners() {
        this.dom.generateBtn.addEventListener('click', () => this.handleGenerate());
        this.dom.resetBtn.addEventListener('click', () => this.resetAll(true));
        this.dom.delayRange.addEventListener('input', e => this.handleDelayChange(e));
        this.dom.findBtn.addEventListener('click', () => this.handleFind());
        this.dom.deleteBtn.addEventListener('click', () => this.handleDelete());
        this.dom.pauseResumeBtn.addEventListener('click', () => this.handlePauseResume());
        this.dom.stepBtn.addEventListener('click', () => this.handleStep());
        this.dom.inorderBtn.addEventListener('click', () => this.animateTraversal('inorder'));
        this.dom.preorderBtn.addEventListener('click', () => this.animateTraversal('preorder'));
        this.dom.postorderBtn.addEventListener('click', () => this.animateTraversal('postorder'));
        this.dom.bfsBtn.addEventListener('click', () => this.animateTraversal('bfs'));
    }

    // --- UTILITIES ---
    sleep = ms => new Promise(r => setTimeout(r, ms));
    log(text, type = 'info') {
        const p = document.createElement('div');
        p.textContent = `> ${text}`;
        if (type === 'meta') { p.style.color = '#94a3b8'; p.textContent = text; }
        if (type === 'rotation') { p.style.color = '#f59e0b'; }
        this.dom.log.appendChild(p);
        this.dom.log.scrollTop = this.dom.log.scrollHeight;
    }
    clearLog() { this.dom.log.innerHTML = ''; }
    async pauseIfNeeded() {
        if (this.animationControls.isPaused) {
            this.animationControls.stepPromise = new Promise(resolve => {
                this.animationControls.resolveStep = resolve;
            });
            await this.animationControls.stepPromise;
        }
    }
    updateTreeStats() {
        this.dom.nodeCountStat.textContent = this.nodesById.size;
        this.dom.treeHeightStat.textContent = this.getHeight(this.tree);
    }
    setUIState(enabled) {
        this.animating = !enabled;
        [this.dom.generateBtn, this.dom.resetBtn, this.dom.findBtn, this.dom.deleteBtn, this.dom.inorderBtn, this.dom.preorderBtn, this.dom.postorderBtn, this.dom.bfsBtn].forEach(btn => btn.disabled = !enabled);
        this.dom.generateBtn.textContent = enabled ? 'Build Tree' : 'Animating...';
        this.dom.pauseResumeBtn.disabled = !this.animating;
        if (enabled) {
            this.animationControls.isPaused = false;
            this.dom.pauseResumeBtn.textContent = 'Pause';
            this.dom.stepBtn.disabled = true;
        }
    }

    // --- NODE & TREE LOGIC ---
    createTreeNode(value) { return { value, id: ++this.nodeIdCounter, left: null, right: null, parent: null, height: 1, x: 0, y: 0 }; }
    getHeight = node => node ? node.height : 0;
    updateHeight = node => { if (node) node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right)); };
    getBalanceFactor = node => node ? this.getHeight(node.left) - this.getHeight(node.right) : 0;
    findMin(node) { return node.left ? this.findMin(node.left) : node; }
    findNodeById(node, id) {
        if (!node) return null;
        if (node.id === id) return node;
        return this.findNodeById(node.left, id) || this.findNodeById(node.right, id);
    }

    // --- DRAWING & LAYOUT ---
    createNodeElement(node, x, y) {
        const el = document.createElement('div');
        el.className = 'node';
        el.dataset.id = node.id;
        el.innerHTML = `<div class="val">${node.value}</div><div class="node-info"></div>`;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        this.dom.canvas.appendChild(el);
        this.nodesById.set(node.id, el);
        this.updateNodeInfo(node);
        return el;
    }

    updateNodeInfo(node) {
        const el = this.nodesById.get(node.id);
        if (el) {
            const bf = this.getBalanceFactor(node);
            el.querySelector('.node-info').textContent = `H:${node.height} BF:${bf}`;
            el.querySelector('.node-info').style.color = Math.abs(bf) > 1 ? 'var(--delete)' : '#94a3b8';
        }
    }

    moveElementTo(el, x, y, duration = this.config.TRAVEL_DURATION) {
        return new Promise(resolve => {
            el.style.transitionDuration = `${duration}ms`;
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
            const handler = () => { el.removeEventListener('transitionend', handler); resolve(); };
            el.addEventListener('transitionend', handler);
            setTimeout(handler, duration + 50);
        });
    }

    async recalculatePositionsAndRedraw() {
        if (!this.tree) { this.updateTreeStats(); return; }

        const positions = new Map();

        const updateAllHeights = (node) => {
            if (!node) return 0;
            const leftH = updateAllHeights(node.left);
            const rightH = updateAllHeights(node.right);
            node.height = 1 + Math.max(leftH, rightH);
            return node.height;
        };
        updateAllHeights(this.tree);

        const canvasWidth = this.dom.canvasContainer.clientWidth > 400 ? this.dom.canvasContainer.clientWidth : 400;

        const assignPositions = (node, depth, minX, maxX) => {
            if (!node) return;
            
            const x = (minX + maxX) / 2;
            const y = depth * this.config.NODE_V_GAP + this.config.NODE_SIZE;
            positions.set(node.id, { x, y });

            assignPositions(node.left, depth + 1, minX, x);
            assignPositions(node.right, depth + 1, x, maxX);
        };
        assignPositions(this.tree, 0, 0, canvasWidth);
        this.updateTreeStats();

        this.dom.canvas.style.width = `${canvasWidth}px`;
        this.dom.canvas.style.height = `${this.getHeight(this.tree) * this.config.NODE_V_GAP + this.config.NODE_SIZE}px`;
        this.dom.edgeSvg.setAttribute('width', canvasWidth);
        this.dom.edgeSvg.setAttribute('height', this.getHeight(this.tree) * this.config.NODE_V_GAP + this.config.NODE_SIZE);
        
        const promises = [];
        this.nodesById.forEach((el, id) => {
            const nodeData = this.findNodeById(this.tree, id);
            if (nodeData) {
                const pos = positions.get(id);
                promises.push(this.moveElementTo(el, pos.x, pos.y));
                this.updateNodeInfo(nodeData);
                el.classList.toggle('root', nodeData.parent === null);
            }
        });
        await Promise.all(promises);

        this.dom.edgeSvg.innerHTML = '';
        const redrawEdges = (node) => {
            if (!node) return;
            if (node.left) this.drawEdge(node, node.left);
            if (node.right) this.drawEdge(node, node.right);
            redrawEdges(node.left);
            redrawEdges(node.right);
        };
        redrawEdges(this.tree);
    }
    
    drawEdge(pNode, cNode) {
        if (!pNode || !cNode) return;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        const pEl = this.nodesById.get(pNode.id);
        const cEl = this.nodesById.get(cNode.id);
        
        line.setAttribute('x1', pEl.style.left); line.setAttribute('y1', pEl.style.top);
        line.setAttribute('x2', pEl.style.left); line.setAttribute('y2', pEl.style.top);
        line.setAttribute('stroke', '#374151'); line.setAttribute('stroke-width', '2');
        line.style.transition = `all ${this.config.TRAVEL_DURATION}ms ease-out`;
        this.dom.edgeSvg.appendChild(line);
        this.edgesById.set(cNode.id, line);
        
        requestAnimationFrame(() => {
            line.setAttribute('x2', cEl.style.left); line.setAttribute('y2', cEl.style.top);
        });
    }

    // --- AVL ROTATIONS ---
    rightRotate(z) {
        let y = z.left; let T3 = y.right;
        y.right = z; z.left = T3;
        y.parent = z.parent; z.parent = y;
        if (T3) T3.parent = z;
        this.updateHeight(z); this.updateHeight(y);
        return y;
    }
    leftRotate(z) {
        let y = z.right; let T2 = y.left;
        y.left = z; z.right = T2;
        y.parent = z.parent; z.parent = y;
        if (T2) T2.parent = z;
        this.updateHeight(z); this.updateHeight(y);
        return y;
    }
    
    // --- HANDLERS & ANIMATIONS ---
    handleGenerate() {
        if (this.animating) return;
        const values = this.dom.userList.value.trim()
            .split(',')
            .map(s => parseInt(s.trim(), 10))
            .filter(n => !isNaN(n) && n >= 0 && n <= 999);
        
        if (values.length === 0) { alert("Please enter valid, comma-separated numbers (0-999)."); return; }
        this.visualizeInsertions(values);
    }
    handleDelayChange(e) { this.stepDelay = Number(e.target.value); this.dom.delayVal.textContent = this.stepDelay; }
    handleFind() { /* ... */ }
    handleDelete() { if (this.animating) return; const val = parseInt(this.dom.deleteInput.value, 10); if (!isNaN(val)) this.animateDelete(val); }
    handlePauseResume() {
        this.animationControls.isPaused = !this.animationControls.isPaused;
        this.dom.pauseResumeBtn.textContent = this.animationControls.isPaused ? 'Resume' : 'Pause';
        this.dom.stepBtn.disabled = !this.animationControls.isPaused;
        if (!this.animationControls.isPaused && this.animationControls.resolveStep) this.animationControls.resolveStep();
    }
    handleStep() { if (this.animationControls.isPaused && this.animationControls.resolveStep) this.animationControls.resolveStep(); }

    async visualizeInsertions(values) {
      this.isAvlMode = this.dom.avlToggle.checked;
      this.setUIState(false);
      this.resetAll(false);
      this.log(`Mode: ${this.isAvlMode ? 'AVL (Self-Balancing)' : 'Standard BST'}`, 'meta');
      this.log(`Input: [${values.join(', ')}]`, 'meta');

      for (const v of values) {
        this.log(`--- Inserting ${v} ---`, 'meta');
        await this.animateInsert(v);
        await this.sleep(this.stepDelay / 2);
        await this.pauseIfNeeded();
      }
      this.log('--- Visualization complete ---', 'meta');
      this.setUIState(true);
    }

    async animateInsert(value) {
        const travelNodeEl = this.createNodeElement({value, id: 'travel'}, 100, 50);
        travelNodeEl.classList.add('travel');

        if (!this.tree) {
            this.log(`Tree is empty. Inserting ${value} as root.`);
            this.tree = this.createTreeNode(value);
            this.createNodeElement(this.tree, 100, this.config.NODE_SIZE);
            await this.recalculatePositionsAndRedraw();
            travelNodeEl.remove();
            return;
        }

        let current = this.tree;
        let insertedNode = null;
        while (!insertedNode) {
            const currentEl = this.nodesById.get(current.id);
            await this.moveElementTo(travelNodeEl, parseInt(currentEl.style.left), parseInt(currentEl.style.top) - this.config.NODE_V_GAP / 2);
            currentEl.classList.add('highlight');
            const goLeft = value < current.value;
            this.log(`Comparing ${value} with ${current.value}. Go ${goLeft ? 'left' : 'right'}.`);
            await this.sleep(this.stepDelay);
            await this.pauseIfNeeded();
            currentEl.classList.remove('highlight');

            const nextNode = goLeft ? current.left : current.right;
            if (nextNode) {
                current = nextNode;
            } else {
                this.log(`Found empty spot. Inserting ${value}.`);
                insertedNode = this.createTreeNode(value);
                insertedNode.parent = current;
                if (goLeft) current.left = insertedNode; else current.right = insertedNode;
                this.createNodeElement(insertedNode, 0, 0); // Create DOM element
                await this.recalculatePositionsAndRedraw(); // Calculate position
            }
        }
        
        travelNodeEl.remove();
        if (this.isAvlMode) await this.balanceTreePath(insertedNode);
        else {
             let pathNode = insertedNode;
             while(pathNode) { this.updateHeight(pathNode); this.updateNodeInfo(pathNode); pathNode = pathNode.parent; }
             this.updateTreeStats();
        }
    }
    
    async animateDelete(value) {
        this.setUIState(false);
        this.log(`--- Deleting ${value} ---`, 'meta');
        
        let nodeToDelete = null;
        let current = this.tree;
        while(current) {
            const currentEl = this.nodesById.get(current.id);
            currentEl.classList.add('highlight');
            await this.sleep(this.stepDelay);
            if(value === current.value) { nodeToDelete = current; break; }
            currentEl.classList.remove('highlight');
            current = value < current.value ? current.left : current.right;
        }

        if (!nodeToDelete) { this.log(`Node ${value} not found.`); this.setUIState(true); return; }
        
        this.nodesById.get(nodeToDelete.id).classList.add('delete-highlight');
        await this.sleep(this.stepDelay);


        let nodeToBalanceFrom = nodeToDelete.parent;
        
        // Standard BST Deletion
        if (!nodeToDelete.left || !nodeToDelete.right) { // 0 or 1 child
            let child = nodeToDelete.left || nodeToDelete.right;
            if (!nodeToDelete.parent) this.tree = child;
            else if (nodeToDelete === nodeToDelete.parent.left) nodeToDelete.parent.left = child;
            else nodeToDelete.parent.right = child;
            if(child) child.parent = nodeToDelete.parent;
        } else { // 2 children
            let successor = this.findMin(nodeToDelete.right);
            nodeToBalanceFrom = successor.parent === nodeToDelete ? successor : successor.parent;
            
            this.log(`Node has two children. Finding in-order successor: ${successor.value}`);
            await this.sleep(this.stepDelay);

            this.nodesById.get(successor.id).classList.add('delete-highlight');
            await this.sleep(this.stepDelay);
            
            nodeToDelete.value = successor.value;
            this.nodesById.get(nodeToDelete.id).querySelector('.val').textContent = successor.value;

            // Delete successor
            if (successor === successor.parent.left) successor.parent.left = successor.right;
            else successor.parent.right = successor.right;
            if(successor.right) successor.right.parent = successor.parent;
            
            this.nodesById.get(nodeToDelete.id).classList.remove('delete-highlight');
            this.nodesById.get(successor.id)?.remove();
            this.nodesById.delete(successor.id);
        }
        
        if (nodeToDelete && nodeToDelete.parent) { // if we deleted original nodeToDelete
             this.nodesById.get(nodeToDelete.id)?.remove();
             this.nodesById.delete(nodeToDelete.id);
        }
        
        if (this.isAvlMode && nodeToBalanceFrom) await this.balanceTreePath(nodeToBalanceFrom);
        
        await this.recalculatePositionsAndRedraw();

        this.log(`Deletion of ${value} complete.`, 'meta');
        this.setUIState(true);
    }
    
    async balanceTreePath(node) {
        let current = node.parent;
        while (current) {
            this.updateHeight(current);
            const balance = this.getBalanceFactor(current);

            if (Math.abs(balance) > 1) {
                this.log(`Tree unbalanced at ${current.value} (BF: ${balance}). Rebalancing...`, 'rotation');
                const el = this.nodesById.get(current.id);
                el.classList.add('delete-highlight');
                await this.sleep(this.stepDelay);
                await this.pauseIfNeeded();

                let newSubtreeRoot;
                const parent = current.parent;
                const isLeftChild = parent && parent.left === current;

                if (balance > 1) { // Left-heavy
                    if (this.getBalanceFactor(current.left) >= 0) { // LL
                        this.log(`Left-Left case. Right rotating on ${current.value}.`, 'rotation');
                        newSubtreeRoot = this.rightRotate(current);
                    } else { // LR
                        this.log(`Left-Right case. Left-Right rotation.`, 'rotation');
                        current.left = this.leftRotate(current.left);
                        newSubtreeRoot = this.rightRotate(current);
                    }
                } else { // Right-heavy
                    if (this.getBalanceFactor(current.right) <= 0) { // RR
                        this.log(`Right-Right case. Left rotating on ${current.value}.`, 'rotation');
                        newSubtreeRoot = this.leftRotate(current);
                    } else { // RL
                        this.log(`Right-Left case. Right-Left rotation.`, 'rotation');
                        current.right = this.rightRotate(current.right);
                        newSubtreeRoot = this.leftRotate(current);
                    }
                }
                if (!parent) this.tree = newSubtreeRoot;
                else if (isLeftChild) parent.left = newSubtreeRoot;
                else parent.right = newSubtreeRoot;
                
                await this.recalculatePositionsAndRedraw();
                el.classList.remove('delete-highlight');
            } else {
                this.updateNodeInfo(current);
            }
            current = current.parent;
        }
        await this.recalculatePositionsAndRedraw();
    }
    
    async animateTraversal(order) {
        if (this.animating || !this.tree) return;
        this.setUIState(false);
        this.log(`--- Traversal: ${order.toUpperCase()} ---`, 'meta');
        const visited = [];
        if (order === 'bfs') {
            const queue = [this.tree];
            while (queue.length > 0) {
                const node = queue.shift();
                visited.push(node);
                if (node.left) queue.push(node.left);
                if (node.right) queue.push(node.right);
            }
        } else {
            const traverse = (node) => {
                if (!node) return;
                if (order === 'preorder') visited.push(node);
                traverse(node.left);
                if (order === 'inorder') visited.push(node);
                traverse(node.right);
                if (order === 'postorder') visited.push(node);
            };
            traverse(this.tree);
        }

        for (const n of visited) {
            const el = this.nodesById.get(n.id);
            el.classList.add('highlight');
            this.log(`Visited ${n.value}`);
            await this.sleep(this.stepDelay);
            await this.pauseIfNeeded();
            el.classList.remove('highlight');
        }
        this.log(`--- Traversal Complete ---`, 'meta');
        this.setUIState(true);
    }
    
    resetAll(clearInputs = true) {
      this.tree = null; this.nodeIdCounter = 0;
      this.nodesById.forEach(el => el.remove()); this.nodesById.clear();
      this.edgesById.forEach(line => line.remove()); this.edgesById.clear();
      this.dom.edgeSvg.innerHTML = ''; this.clearLog(); this.setUIState(true);
      this.updateTreeStats();
      this.dom.canvas.style.width = '100%'; this.dom.canvas.style.height = '100%';

      if (clearInputs) {
          this.dom.userList.value = '';
          this.dom.searchInput.value = ''; this.dom.deleteInput.value = '';
      }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AVLVisualizer();
});
