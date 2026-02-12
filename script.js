let roomTypes = [
    {
        name: 'Empty',
        color: '#f0f9ff',
        probability: 0.5,
        removable: false,
        renamable: false
    },
    {
        name: 'Room 1',
        color: '#c6e635',
        probability: 0.25,
        removable: true,
        renamable: true
    },
    {
        name: 'Room 2',
        color: '#38bdf8',
        probability: 0.25,
        removable: true,
        renamable: true
    }
];


function renderRoomTypesList() {
    const list = document.getElementById('roomTypesList');
    list.innerHTML = '';
    roomTypes.forEach((room, idx) => {
        const row = document.createElement('div');
        row.className = 'room-type-row';

        // color
        const color = document.createElement('input');
        color.type = 'color';
        color.value = room.color;
        color.className = 'room-type-color';
        color.disabled = !room.removable && !room.renamable;
        color.addEventListener('input', e => {
            room.color = e.target.value;
            // Only recolor the current maze, do not re-render the list
            drawMazeWithRooms(false);
        });
        row.appendChild(color);

        // name
        if (room.renamable) {
            const nameInput = document.createElement('input');
            nameInput.value = room.name;
            nameInput.className = 'room-type-name';
            nameInput.addEventListener('input', e => {
                room.name = e.target.value;
                renderRoomTypesList();
            });
            row.appendChild(nameInput);
        } else {
            const nameSpan = document.createElement('span');
            nameSpan.textContent = room.name;
            nameSpan.className = 'room-type-name';
            row.appendChild(nameSpan);
        }

        // probability
        const prob = document.createElement('input');
        prob.type = 'range';
        prob.min = 0;
        prob.max = 1;
        prob.step = 0.01;
        prob.value = room.probability;
        prob.className = 'room-type-prob';
        prob.style.width = '80px';

        const probVal = document.createElement('span');
        probVal.textContent = (room.probability * 100).toFixed(0) + '%';
        probVal.style.minWidth = '32px';
        row.appendChild(probVal);

        prob.addEventListener('input', e => {
            let v = parseFloat(e.target.value);
            if (isNaN(v) || v < 0) v = 0;
            if (v > 1) v = 1;
            room.probability = v;
            probVal.textContent = (v * 100).toFixed(0) + '%';

            drawMazeWithRooms(false);
        });
        row.appendChild(prob);

        // remove
        if (room.removable) {
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.onclick = () => {
                roomTypes.splice(idx, 1);
                renderRoomTypesList();
                drawMazeWithRooms();
            };
            row.appendChild(removeBtn);
        }

        list.appendChild(row);
    });
}

document.getElementById('addRoomType').onclick = function() {
    let baseName = 'custom';
    let name = baseName;
    let counter = 1;
    const existingNames = roomTypes.map(r => r.name);
    while (existingNames.includes(name)) {
        name = baseName + counter;
        counter++;
    }
    roomTypes.push({
        name: name,
        color: '#fbbf24',
        probability: 0.1,
        removable: true,
        renamable: true
    });
    renderRoomTypesList();
};

function drawMazeWithRooms(regenerateRooms = true) {
    if (!lastGrid || !lastParams) return;
    const grid = lastGrid;
    const types = roomTypes.slice();
    let total = types.reduce((sum, r) => sum + r.probability, 0);
    if (total === 0) total = 1;
    let acc = 0;
    types.forEach(r => {
        r._range = [acc, acc + r.probability / total];
        acc = r._range[1];
    });
    const sx = lastParams.sx, sy = lastParams.sy, ex = lastParams.ex, ey = lastParams.ey;
    if (regenerateRooms) {
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[0].length; x++) {
                if ((x === sx && y === sy) || (x === ex && y === ey)) {
                    grid[y][x].roomType = 'startend';
                } else {
                    const rand = Math.random();
                    const found = types.find(r => rand >= r._range[0] && rand < r._range[1]) || types[0];
                    grid[y][x].roomType = found.name;
                }
            }
        }
    }

    drawGrid(grid, {
        cellSize: lastParams.cellSize,
        start: { x: sx, y: sy },
        end: { x: ex, y: ey },
        highlight: false
    });

    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[0].length; x++) {
            const cell = grid[y][x];
            let type = roomTypes.find(r => r.name === cell.roomType);

            if (x === sx && y === sy) {
                ctx.fillStyle = '#1e90ff'; // start
                ctx.globalAlpha = 0.7;
                ctx.fillRect(x * lastParams.cellSize + 2, y * lastParams.cellSize + 2, lastParams.cellSize - 3, lastParams.cellSize - 3);
                ctx.globalAlpha = 1.0;
            } else if (x === ex && y === ey) {
                ctx.fillStyle = '#ef4444'; // end
                ctx.globalAlpha = 0.7;
                ctx.fillRect(x * lastParams.cellSize + 2, y * lastParams.cellSize + 2, lastParams.cellSize - 3, lastParams.cellSize - 3);
                ctx.globalAlpha = 1.0;
            } else if (type) {
                ctx.fillStyle = type.color;
                ctx.globalAlpha = 0.7;
                ctx.fillRect(x * lastParams.cellSize + 2, y * lastParams.cellSize + 2, lastParams.cellSize - 3, lastParams.cellSize - 3);
                ctx.globalAlpha = 1.0;
            }
        }
    }
}

// hover
const mazeCanvas = document.getElementById('maze');
const cellInfo = document.getElementById('cellInfo');
mazeCanvas.addEventListener('mousemove', function(e) {
    if (!lastGrid || !lastParams) return;
    const rect = mazeCanvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / lastParams.cellSize);
    const y = Math.floor((e.clientY - rect.top) / lastParams.cellSize);
    if (x >= 0 && y >= 0 && y < lastGrid.length && x < lastGrid[0].length) {
        const cell = lastGrid[y][x];
        let roomName = cell.roomType;
        if (roomName === 'startend') {
            if (x === lastParams.sx && y === lastParams.sy) roomName = 'Start';
            else if (x === lastParams.ex && y === lastParams.ey) roomName = 'End';
        }
        cellInfo.textContent = `(${x}, ${y}) — ${roomName}`;
    } else {
        cellInfo.textContent = '';
    }
});
mazeCanvas.addEventListener('mouseleave', function() {
    cellInfo.textContent = '';
});

const origBuildFromUI = buildFromUI;
buildFromUI = function(regen = false) {
    origBuildFromUI(regen);
    drawMazeWithRooms();
};

renderRoomTypesList();
const canvas = document.getElementById('maze');
const ctx = canvas.getContext('2d');

const element = id => document.getElementById(id);

function makeGrid(w, h) {
    const grid = [];
    for (let y = 0; y < h; y++) {
        const row = [];
        for (let x = 0; x < w; x++) {
            row.push({ x, y, walls: [true, true, true, true], visited: false });
        }
        grid.push(row);
    }
    return grid;
}

function neighbors(grid, cell) {
    const dirs = [];
    const { x, y } = cell;
    const h = grid.length,
        w = grid[0].length;

    if (y > 0) dirs.push({ nx: x, ny: y - 1, dir: 0, op: 2 });
    if (x < w - 1) dirs.push({ nx: x + 1, ny: y, dir: 1, op: 3 });
    if (y < h - 1) dirs.push({ nx: x, ny: y + 1, dir: 2, op: 0 });
    if (x > 0) dirs.push({ nx: x - 1, ny: y, dir: 3, op: 1 });

    return dirs;
}

function generateDFS(grid, start, shortcutChance = 0) {
    const stack = [];
    const h = grid.length,
        w = grid[0].length;

    start.visited = true;
    stack.push(start);

    while (stack.length) {
        const current = stack[stack.length - 1];
        const nbs = neighbors(grid, current)
            .map(n => ({ ...n, cell: grid[n.ny][n.nx] }))
            .filter(o => !o.cell.visited);

        if (nbs.length === 0) {
            stack.pop();
            continue;
        }

        const pick = nbs[Math.floor(Math.random() * nbs.length)];
        current.walls[pick.dir] = false;
        pick.cell.walls[pick.op] = false;
        pick.cell.visited = true;
        stack.push(pick.cell);

        // shortcuts
        if (Math.random() < shortcutChance) {
            const shortcutNbs = neighbors(grid, current)
                .map(n => ({ ...n, cell: grid[n.ny][n.nx] }))
                .filter(o => o.cell.visited && current.walls[o.dir]);
            if (shortcutNbs.length > 0) {
                const shortcut = shortcutNbs[Math.floor(Math.random() * shortcutNbs.length)];
                current.walls[shortcut.dir] = false;
                shortcut.cell.walls[shortcut.op] = false;
            }
        }
    }
    return grid;
}

function resizeCanvas(cols, rows, cellSize) {
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;
}

function drawGrid(grid,{ cellSize = 20, start, end, highlight = true } = {}) {
    const w = grid[0].length,
        h = grid.length;

    resizeCanvas(w, h, cellSize);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const cell = grid[y][x];
            const px = x * cellSize,
                py = y * cellSize;

            ctx.beginPath();
            if (cell.walls[0]) {
                ctx.moveTo(px, py);
                ctx.lineTo(px + cellSize, py);
            }
            if (cell.walls[1]) {
                ctx.moveTo(px + cellSize, py);
                ctx.lineTo(px + cellSize, py + cellSize);
            }
            if (cell.walls[2]) {
                ctx.moveTo(px + cellSize, py + cellSize);
                ctx.lineTo(px, py + cellSize);
            }
            if (cell.walls[3]) {
                ctx.moveTo(px, py + cellSize);
                ctx.lineTo(px, py);
            }
            ctx.stroke();

            if (cell.visited && highlight) {
                ctx.fillStyle = '#e6f7ff';
                ctx.fillRect(px + 2, py + 2, cellSize - 3, cellSize - 3);
            }
        }
    }

    if (start) {
        ctx.fillStyle = '#1e90ff';
        ctx.fillRect(
            start.x * cellSize + 3,
            start.y * cellSize + 3,
            cellSize - 6,
            cellSize - 6
        );
    }

    if (end) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(
            end.x * cellSize + 3,
            end.y * cellSize + 3,
            cellSize - 6,
            cellSize - 6
        );
    }
}

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

let lastParams = null;
let lastGrid = null;

function buildFromUI(regen = false) {
    const w = parseInt(element('width').value, 10);
    const h = parseInt(element('height').value, 10);
    const cellSize = parseInt(element('cellSize').value, 10) || 20;
    const shortcutChance = parseFloat(element('shortcutChance').value) || 0;

    let sx = parseInt(element('startX').value, 10);
    let sy = parseInt(element('startY').value, 10);
    let ex = parseInt(element('endX').value, 10);
    let ey = parseInt(element('endY').value, 10);

    sx = clamp(sx, 0, w - 1);
    sy = clamp(sy, 0, h - 1);
    ex = clamp(ex, 0, w - 1);
    ey = clamp(ey, 0, h - 1);

    const params = { w, h, cellSize, sx, sy, ex, ey, shortcutChance };
    if (regen && lastParams) Object.assign(params, lastParams);
    lastParams = params;

    const summaryEl = element('paramsSummary');
    if (summaryEl) {
        summaryEl.textContent = `Size: ${w}×${h} • Cell: ${cellSize}px • Start: (${sx},${sy}) • End: (${ex},${ey}) • Shortcuts: ${shortcutChance}`;
    }

    const grid = makeGrid(w, h);

    drawGrid(grid, {
        cellSize,
        start: { x: sx, y: sy },
        end: { x: ex, y: ey }
    });

    generateDFS(grid, grid[sy][sx], shortcutChance);

    drawGrid(grid, {
        cellSize,
        start: { x: sx, y: sy },
        end: { x: ex, y: ey }
    });

    lastGrid = grid;
}

element('generate').addEventListener('click', () => buildFromUI(false));

const cellSlider = element('cellSize');
const cellValue = element('cellSizeValue');
if (cellSlider && cellValue) {
    cellSlider.addEventListener('input', () => {
        const newSize = parseInt(cellSlider.value, 10) || 20;
        cellValue.textContent = String(newSize);
        if (lastParams) lastParams.cellSize = newSize;
        if (lastGrid) {
            // Redraw maze and room overlays
            drawGrid(lastGrid, {
                cellSize: newSize,
                start: { x: lastParams.sx, y: lastParams.sy },
                end: { x: lastParams.ex, y: lastParams.ey }
            });
            drawMazeWithRooms(false);
        }
    });
}

const shortcutSlider = element('shortcutChance');
const shortcutValue = element('shortcutChanceValue');
if (shortcutSlider && shortcutValue) {
    shortcutSlider.addEventListener('input', () => {
        shortcutValue.textContent = shortcutSlider.value;
    });
}
shortcutValue.textContent = shortcutSlider.value;

function updateEndDefaults() {
    const w = parseInt(element('width').value, 10);
    const h = parseInt(element('height').value, 10);
    element('endX').value = Math.max(0, w - 1);
    element('endY').value = Math.max(0, h - 1);
}

element('width').addEventListener('change', updateEndDefaults);
element('height').addEventListener('change', updateEndDefaults);

updateEndDefaults();
buildFromUI(false);


