/* WORKSPACE LOGIC - Trabajo de Arquitectura de Máquinas (StitchMCP Integration) */

// Global navigation state
let activePanelId = null;

// Map to store reference to SVG paths for JS transitions
const pulsePathsMap = {};
const linePathsMap = {};

// ----------------------------------------------------
// Constellation Tree Layout & Drawing (Desktop Only)
// ----------------------------------------------------
function initConstellation() {
    const isDesktop = window.innerWidth >= 768;
    const container = document.getElementById('constellationArea');
    const trunk = document.getElementById('trunkNode');
    const nodes = Array.from(document.querySelectorAll('.branch-node:not([data-id$="-sub"])'));
    const subNodes = Array.from(document.querySelectorAll('.branch-node[data-id$="-sub"]'));
    const svg = document.getElementById('svgConnections');
    
    if (!container || !trunk || !svg) return;

    // Clear previous paths on resize
    svg.innerHTML = '';

    if (!isDesktop) {
        // Reset styles for mobile stack
        nodes.concat(subNodes).forEach(node => {
            node.style.left = '';
            node.style.top = '';
        });
        trunk.style.left = '';
        trunk.style.top = '';
        return;
    }
    
    const centerX = container.clientWidth / 2;
    const centerY = container.clientHeight / 2;
    
    // Dynamic elliptical radius based on container dimensions
    const radiusX = Math.max(centerX * 0.65, 180);
    const radiusY = Math.max(centerY * 0.72, 160);
    
    // Position trunk in absolute center (with safety fallback sizing)
    const trunkWidth = trunk.clientWidth || 256;
    const trunkHeight = trunk.clientHeight || 256;
    trunk.style.left = `${centerX - (trunkWidth/2)}px`;
    trunk.style.top = `${centerY - (trunkHeight/2)}px`;

    // 1. Calculate and store coordinates for all main nodes
    const nodeCoords = nodes.map((node, index) => {
        const nodeId = node.getAttribute('data-id');
        
        // Safety fallbacks for sizes if browser has not done layout yet
        const defaultWidth = (nodeId === 'node-6' || nodeId === 'node-7' || nodeId === 'node-8' ? 224 : 256);
        const nodeWidth = node.clientWidth || defaultWidth;
        const nodeHeight = node.clientHeight || 46;
        
        // Distribute nodes evenly in an ellipse
        const angle = (index / nodes.length) * 2 * Math.PI - (Math.PI / 2);
        
        const nodeX = centerX + radiusX * Math.cos(angle);
        const nodeY = centerY + radiusY * Math.sin(angle);
        
        node.style.left = `${nodeX - (nodeWidth/2)}px`;
        node.style.top = `${nodeY - (nodeHeight/2)}px`;
        
        return { id: nodeId, x: nodeX, y: nodeY, element: node, index };
    });

    // 1.5. Calculate and store coordinates for sub-nodes relative to parents
    const subNodeCoords = subNodes.map(subNode => {
        const subId = subNode.getAttribute('data-id');
        const parentId = subNode.getAttribute('data-parent');
        const parentCoord = nodeCoords.find(nc => nc.id === parentId);
        
        if (!parentCoord) return null;
        
        // Vector from trunk (center) to parent node
        const vx = parentCoord.x - centerX;
        const vy = parentCoord.y - centerY;
        const dist = Math.sqrt(vx * vx + vy * vy);
        const ux = vx / dist;
        const uy = vy / dist;
        
        // Position subnode further out and slightly offset tangentially
        const subX = parentCoord.x + ux * 90 - uy * 45;
        const subY = parentCoord.y + uy * 90 + ux * 45;
        
        const subWidth = subNode.clientWidth || 160;
        const subHeight = subNode.clientHeight || 36;
        
        subNode.style.left = `${subX - (subWidth / 2)}px`;
        subNode.style.top = `${subY - (subHeight / 2)}px`;
        
        return { id: subId, x: subX, y: subY, element: subNode, parentId, parentX: parentCoord.x, parentY: parentCoord.y };
    }).filter(Boolean);

    // 2. Draw radial lines from center to each main node
    nodeCoords.forEach(nc => {
        const startX = centerX;
        const startY = centerY;
        const endX = nc.x;
        const endY = nc.y;

        // Create curved path (quadratic bezier for organic look)
        const cpX = (startX + endX) / 2 - (startY - endY) * 0.15;
        const cpY = (startY + endY) / 2 + (startX - endX) * 0.15;
        const d = `M ${startX} ${startY} Q ${cpX} ${cpY} ${endX} ${endY}`;

        // Create base connection path
        const pathLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathLine.setAttribute('d', d);
        pathLine.setAttribute('class', `path-line path-radial-${nc.index}`);
        svg.appendChild(pathLine);
        linePathsMap[nc.id] = pathLine;

        // Create pulsing connection path
        const pathPulse = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathPulse.setAttribute('d', d);
        pathPulse.setAttribute('class', `path-pulse pulse-radial-${nc.index}`);
        svg.appendChild(pathPulse);
        pulsePathsMap[nc.id] = pathPulse;

        // Hover interactions
        const mouseEnterHandler = () => {
            pathLine.classList.add('active-line');
            pathPulse.classList.add('active-pulse');
        };
        const mouseLeaveHandler = () => {
            pathLine.classList.remove('active-line');
            pathPulse.classList.remove('active-pulse');
        };
        
        nc.element.removeEventListener('mouseenter', nc.element._enterHandler);
        nc.element.removeEventListener('mouseleave', nc.element._leaveHandler);
        
        nc.element.addEventListener('mouseenter', mouseEnterHandler);
        nc.element.addEventListener('mouseleave', mouseLeaveHandler);
        
        nc.element._enterHandler = mouseEnterHandler;
        nc.element._leaveHandler = mouseLeaveHandler;
    });

    // 2.5 Draw sub-node lines from parent to sub-node
    subNodeCoords.forEach((snc, idx) => {
        const startX = snc.parentX;
        const startY = snc.parentY;
        const endX = snc.x;
        const endY = snc.y;
        
        // Curve bending slightly
        const cpX = (startX + endX) / 2 - (startY - endY) * 0.2;
        const cpY = (startY + endY) / 2 + (startX - endX) * 0.2;
        
        const d = `M ${startX} ${startY} Q ${cpX} ${cpY} ${endX} ${endY}`;
        const dReverse = `M ${endX} ${endY} Q ${cpX} ${cpY} ${startX} ${startY}`;
        
        // Base connection line
        const pathLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathLine.setAttribute('d', d);
        pathLine.setAttribute('class', `path-line path-sub-${idx}`);
        svg.appendChild(pathLine);
        
        // Forward pulse (Parent -> Sub)
        const pathPulse = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathPulse.setAttribute('d', d);
        pathPulse.setAttribute('class', `path-pulse pulse-sub-${idx}`);
        svg.appendChild(pathPulse);
        
        // Backward pulse (Sub -> Parent)
        const pathPulseReverse = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathPulseReverse.setAttribute('d', dReverse);
        pathPulseReverse.setAttribute('class', `path-pulse pulse-sub-${idx}-rev`);
        svg.appendChild(pathPulseReverse);
        
        const forwardKey = `${snc.parentId}->${snc.id}`;
        const backwardKey = `${snc.id}->${snc.parentId}`;
        
        pulsePathsMap[forwardKey] = pathPulse;
        pulsePathsMap[backwardKey] = pathPulseReverse;
        linePathsMap[forwardKey] = pathLine;
        linePathsMap[backwardKey] = pathLine;
        
        // Also map standard nodeId for direct navigation if any
        pulsePathsMap[snc.id] = pathPulse;
        linePathsMap[snc.id] = pathLine;
    });

    // 3. Draw outer ring paths connecting adjacent main nodes in a circle
    for (let i = 0; i < nodeCoords.length; i++) {
        const current = nodeCoords[i];
        const next = nodeCoords[(i + 1) % nodeCoords.length];
        
        const startX = current.x;
        const startY = current.y;
        const endX = next.x;
        const endY = next.y;
        
        // Midpoint and control point bending outwards from center
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        const cpX = midX + (midX - centerX) * 0.15;
        const cpY = midY + (midY - centerY) * 0.15;
        
        const d = `M ${startX} ${startY} Q ${cpX} ${cpY} ${endX} ${endY}`;
        const dReverse = `M ${endX} ${endY} Q ${cpX} ${cpY} ${startX} ${startY}`;

        // Base line path
        const pathLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathLine.setAttribute('d', d);
        pathLine.setAttribute('class', `path-line path-ring-${i}`);
        svg.appendChild(pathLine);

        // Forward pulse path
        const pathPulse = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathPulse.setAttribute('d', d);
        pathPulse.setAttribute('class', `path-pulse pulse-ring-${i}`);
        svg.appendChild(pathPulse);

        // Backward pulse path
        const pathPulseReverse = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathPulseReverse.setAttribute('d', dReverse);
        pathPulseReverse.setAttribute('class', `path-pulse pulse-ring-${i}-rev`);
        svg.appendChild(pathPulseReverse);

        // Map keys
        const forwardKey = `${current.id}->${next.id}`;
        const backwardKey = `${next.id}->${current.id}`;

        pulsePathsMap[forwardKey] = pathPulse;
        pulsePathsMap[backwardKey] = pathPulseReverse;
        linePathsMap[forwardKey] = pathLine;
        linePathsMap[backwardKey] = pathLine;
    }
}

// Initialize constellation on load and bind resize/observer
window.addEventListener('load', () => {
    initConstellation();
    const container = document.getElementById('constellationArea');
    if (container) {
        const resizeObserver = new ResizeObserver(() => {
            initConstellation();
        });
        resizeObserver.observe(container);
    }
});
document.addEventListener('DOMContentLoaded', () => {
    initConstellation();
    window.addEventListener('resize', initConstellation);
});

// ----------------------------------------------------
// Smooth Branch Transition Logic
// ----------------------------------------------------
function triggerBranchTransition(nodeId, fromNodeId = null) {
    let pulsePath = null;
    let linePath = null;
    let transitionDuration = 850;
    
    if (fromNodeId && fromNodeId !== nodeId) {
        // We are navigating from another node. Let's see if we have a ring connection.
        const key = `${fromNodeId}->${nodeId}`;
        pulsePath = pulsePathsMap[key];
        linePath = linePathsMap[key];
        
        // Close the previous panel view instantly so the dashboard can animate
        const prevPanel = document.getElementById(`panel-${fromNodeId}`);
        if (prevPanel) {
            prevPanel.classList.remove('panel-active');
        }
        
        // Restore tree dashboard view so user can see the pulse travel
        document.getElementById('tree-dashboard').classList.add('active');
    } else {
        // Fallback to radial connection from trunk
        pulsePath = pulsePathsMap[nodeId];
        linePath = linePathsMap[nodeId];
        
        if (activePanelId) {
            closePanel(activePanelId);
        }
    }
    
    // Play SVG path tracing pulse
    if (pulsePath && linePath) {
        // Highlight connection line
        linePath.classList.add('active-line');

        // Reset and play pulse route
        pulsePath.classList.remove('pulsing-route');
        void pulsePath.offsetWidth; // force reflow
        pulsePath.classList.add('pulsing-route');
    }

    // Slide in panel after path animation finishes
    setTimeout(() => {
        // Fade out tree dashboard
        document.getElementById('tree-dashboard').classList.remove('active');
        
        // Slide in active panel
        const targetPanel = document.getElementById(`panel-${nodeId}`);
        if (targetPanel) {
            targetPanel.classList.add('panel-active');
            targetPanel.scrollTop = 0;
            activePanelId = nodeId;
        }

        // Clean up classes
        if (pulsePath && linePath) {
            pulsePath.classList.remove('pulsing-route');
            linePath.classList.remove('active-line');
        }
    }, transitionDuration);
}

function closePanel(nodeId) {
    const targetPanel = document.getElementById(`panel-${nodeId}`);
    if (targetPanel) {
        targetPanel.classList.remove('panel-active');
    }
    
    // Restore tree dashboard view
    document.getElementById('tree-dashboard').classList.add('active');
    activePanelId = null;
}

function navigateToDashboard() {
    if (activePanelId) {
        closePanel(activePanelId);
    }
}

// ----------------------------------------------------
// Theme Toggle Logic
// ----------------------------------------------------
const themeToggleBtn = document.getElementById('theme-toggle');
themeToggleBtn.addEventListener('click', () => {
    const body = document.body;
    const isDark = body.classList.contains('dark');
    
    // Toggle class
    if (isDark) {
        body.classList.remove('dark');
        body.classList.add('light-theme');
        themeToggleBtn.querySelector('span').textContent = 'dark_mode';
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.remove('light-theme');
        body.classList.add('dark');
        themeToggleBtn.querySelector('span').textContent = 'light_mode';
        localStorage.setItem('theme', 'dark');
    }
});

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    document.body.classList.remove('dark');
    document.body.classList.add('light-theme');
    themeToggleBtn.querySelector('span').textContent = 'dark_mode';
} else {
    document.body.classList.add('dark');
}

// ----------------------------------------------------
// Bus Animation logic (Unit II)
// ----------------------------------------------------
function animateBus2(busId) {
    const busElement = document.getElementById(`bus-${busId}`);
    if (busElement) {
        busElement.classList.remove('pulse');
        void busElement.offsetWidth; // Trigger reflow
        busElement.classList.add('pulse');
        
        // Define target elements and glow class based on bus type
        let targets = [];
        let glowClass = "";
        
        if (busId === 'address-2') {
            targets = ['cpu-uc', 'mem-unified', 'mem-code'];
            glowClass = 'glow-active-cyan';
        } else if (busId === 'data-2') {
            targets = ['cpu-reg', 'cpu-alu', 'mem-unified', 'mem-data'];
            glowClass = 'glow-active-pink';
        } else if (busId === 'control-2') {
            targets = ['cpu-uc', 'cpu-alu', 'mem-unified', 'mem-code', 'mem-data'];
            glowClass = 'glow-active-yellow';
        }
        
        // Apply glow classes
        targets.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add(glowClass);
        });
        
        setTimeout(() => {
            busElement.classList.remove('pulse');
            // Remove glow classes
            targets.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.remove(glowClass);
            });
        }, 1200);
    }
}

// ----------------------------------------------------
// emu8086 Simulator Logic (Unit III / Playgrounds)
// ----------------------------------------------------
const asmExamples = {
    suma: {
        code: "MOV AX, 0005h  ; Cargar 5 en AX\nMOV BX, 000Ah  ; Cargar 10 en BX\nADD AX, BX     ; Sumar BX a AX (AX = AX + BX)\nHLT            ; Terminar ejecución",
        lines: 4,
        steps: [
            { ip: "0100h", ax: "0005h", bx: "0000h", cx: "0000h", dx: "0000h", flags: "ZF:0 SF:0", log: "MOV AX, 0005h -> Registro AX cargado con 0005h (5 en decimal).", activeReg: ["ax", "ip"] },
            { ip: "0103h", ax: "0005h", bx: "000Ah", cx: "0000h", dx: "0000h", flags: "ZF:0 SF:0", log: "MOV BX, 000Ah -> Registro BX cargado con 000Ah (10 en decimal).", activeReg: ["bx", "ip"] },
            { ip: "0106h", ax: "000Fh", bx: "000Ah", cx: "0000h", dx: "0000h", flags: "ZF:0 SF:0", log: "ADD AX, BX -> Suma AX + BX. Resultado 000Fh (15) guardado en AX.", activeReg: ["ax", "ip"] },
            { ip: "0108h", ax: "000Fh", bx: "000Ah", cx: "0000h", dx: "0000h", flags: "ZF:0 SF:0", log: "HLT -> Microprocesador detenido. Simulación finalizada.", activeReg: ["ip"] }
        ]
    },
    bucle: {
        code: "MOV CX, 0005h  ; CX = 5 (contador)\nMOV AX, 0000h  ; AX = 0 (acumulador)\nbucle:\nADD AX, 0002h  ; AX = AX + 2\nDEC CX         ; Decrementar CX\nJNZ bucle      ; Saltar si CX != 0\nHLT            ; Terminar",
        lines: 7,
        steps: [
            { ip: "0100h", ax: "0000h", bx: "0000h", cx: "0005h", dx: "0000h", flags: "ZF:0 SF:0", log: "MOV CX, 0005h -> Contador CX inicializado en 5.", activeReg: ["cx", "ip"] },
            { ip: "0103h", ax: "0000h", bx: "0000h", cx: "0005h", dx: "0000h", flags: "ZF:1 SF:0", log: "MOV AX, 0000h -> Acumulador AX inicializado en 0.", activeReg: ["ax", "ip"] },
            { ip: "0106h", ax: "0002h", bx: "0000h", cx: "0005h", dx: "0000h", flags: "ZF:0 SF:0", log: "ADD AX, 0002h -> Bucle iteración 1. AX incrementado a 2.", activeReg: ["ax", "ip"] },
            { ip: "0109h", ax: "0002h", bx: "0000h", cx: "0004h", dx: "0000h", flags: "ZF:0 SF:0", log: "DEC CX -> Decrementar contador CX. CX = 4.", activeReg: ["cx", "ip"] },
            { ip: "010Ah", ax: "0002h", bx: "0000h", cx: "0004h", dx: "0000h", flags: "ZF:0 SF:0", log: "JNZ bucle -> Como CX != 0, salta a la etiqueta 'bucle'.", activeReg: ["ip"] },
            { ip: "0106h", ax: "000Ah", bx: "0000h", cx: "0000h", dx: "0000h", flags: "ZF:1 SF:0", log: "Ejecución rápida del bucle... iteraciones restantes completadas. CX llega a 0, ZF se activa (ZF=1). AX finaliza en 000Ah (10 decimal).", activeReg: ["ax", "cx", "flags", "ip"] },
            { ip: "010Dh", ax: "000Ah", bx: "0000h", cx: "0000h", dx: "0000h", flags: "ZF:1 SF:0", log: "HLT -> Microprocesador detenido.", activeReg: ["ip"] }
        ]
    },
    condicional: {
        code: "MOV AX, 000Fh  ; AX = 15\nMOV BX, 0014h  ; BX = 20\nCMP AX, BX     ; Comparar AX con BX\nJL menor       ; Saltar si AX < BX\nMOV DX, 0000h  ; DX = 0 (si no es menor)\nJMP fin\nmenor:\nMOV DX, 0001h  ; DX = 1 (si es menor)\nfin:\nHLT",
        lines: 10,
        steps: [
            { ip: "0100h", ax: "000Fh", bx: "0000h", cx: "0000h", dx: "0000h", flags: "ZF:0 SF:0", log: "MOV AX, 000Fh -> AX cargado con 15 (0Fh).", activeReg: ["ax", "ip"] },
            { ip: "0103h", ax: "000Fh", bx: "0014h", cx: "0000h", dx: "0000h", flags: "ZF:0 SF:0", log: "MOV BX, 0014h -> BX cargado con 20 (14h).", activeReg: ["bx", "ip"] },
            { ip: "0106h", ax: "000Fh", bx: "0014h", cx: "0000h", dx: "0000h", flags: "ZF:0 SF:1", log: "CMP AX, BX -> Resta interna (15 - 20 = -5). Resultado negativo: activa bandera de signo SF=1.", activeReg: ["flags", "ip"] },
            { ip: "0109h", ax: "000Fh", bx: "0014h", cx: "0000h", dx: "0000h", flags: "ZF:0 SF:1", log: "JL menor -> Como SF=1 (AX < BX), se cumple la condición. Salto a etiqueta 'menor' (línea 8).", activeReg: ["ip"] },
            { ip: "010Dh", ax: "000Fh", bx: "0014h", cx: "0000h", dx: "0001h", flags: "ZF:0 SF:1", log: "MOV DX, 0001h -> Registro DX cargado con 1 (indica menor).", activeReg: ["dx", "ip"] },
            { ip: "0110h", ax: "000Fh", bx: "0014h", cx: "0000h", dx: "0001h", flags: "ZF:0 SF:1", log: "HLT -> Microprocesador detenido.", activeReg: ["ip"] }
        ]
    }
};

let currentAsmStep = -1;
let selectedAsmExample = "suma";
let asmRunInterval = null;

function loadAsmExample() {
    resetAsmSim();
    const select = document.getElementById('asm-example-select');
    selectedAsmExample = select.value;
    
    const example = asmExamples[selectedAsmExample];
    document.getElementById('asm-code-textarea').value = example.code;
    
    const linesWrap = document.getElementById('asm-line-numbers');
    let linesHtml = "";
    for (let i = 1; i <= example.lines; i++) {
        linesHtml += `<span id="asm-ln-${i}">${i}</span><br>`;
    }
    linesWrap.innerHTML = linesHtml;
    
    document.getElementById('asm-console-out').textContent = `Log: Cargado programa "${select.options[select.selectedIndex].text}". Pulsa "Paso a Paso" para iniciar.`;
}

function resetAsmSim() {
    clearInterval(asmRunInterval);
    asmRunInterval = null;
    currentAsmStep = -1;
    
    document.getElementById('reg-ax').textContent = "0000h";
    document.getElementById('reg-bx').textContent = "0000h";
    document.getElementById('reg-cx').textContent = "0000h";
    document.getElementById('reg-dx').textContent = "0000h";
    document.getElementById('reg-ip').textContent = "0100h";
    document.getElementById('reg-flags').textContent = "ZF:0 SF:0";
    
    document.querySelectorAll('.register-box').forEach(box => box.classList.remove('glow'));
    
    const linesWrap = document.getElementById('asm-line-numbers');
    if (linesWrap) {
        linesWrap.querySelectorAll('span').forEach(span => span.className = '');
    }

    document.getElementById('asm-console-out').textContent = "Log: Simulador reiniciado. Listo.";
}

function stepAsmSim() {
    const example = asmExamples[selectedAsmExample];
    currentAsmStep++;
    
    if (currentAsmStep >= example.steps.length) {
        document.getElementById('asm-console-out').textContent += "\nLog: Fin del programa. Haz click en 'Reiniciar'.";
        clearInterval(asmRunInterval);
        return;
    }
    
    const stepData = example.steps[currentAsmStep];
    
    document.querySelectorAll('.register-box').forEach(box => box.classList.remove('glow'));
    
    document.getElementById('reg-ax').textContent = stepData.ax;
    document.getElementById('reg-bx').textContent = stepData.bx;
    document.getElementById('reg-cx').textContent = stepData.cx;
    document.getElementById('reg-dx').textContent = stepData.dx;
    document.getElementById('reg-ip').textContent = stepData.ip;
    document.getElementById('reg-flags').textContent = stepData.flags;
    
    stepData.activeReg.forEach(regId => {
        document.getElementById(`reg-${regId}`).parentElement.classList.add('glow');
    });
    
    const linesWrap = document.getElementById('asm-line-numbers');
    if (linesWrap) {
        linesWrap.querySelectorAll('span').forEach(span => span.className = '');
        
        let lineToHighlight = currentAsmStep + 1;
        if (selectedAsmExample === 'bucle') {
            const loopLines = [1, 2, 4, 5, 6, 4, 7];
            lineToHighlight = loopLines[currentAsmStep] || 1;
        } else if (selectedAsmExample === 'condicional') {
            const condLines = [1, 2, 3, 4, 8, 10];
            lineToHighlight = condLines[currentAsmStep] || 1;
        }
        
        const activeLineSpan = document.getElementById(`asm-ln-${lineToHighlight}`);
        if (activeLineSpan) activeLineSpan.className = 'asm-line-active';
    }
    
    document.getElementById('asm-console-out').textContent = stepData.log;
}

function runAsmSim() {
    if (asmRunInterval) return;
    
    const runStep = () => {
        const example = asmExamples[selectedAsmExample];
        if (currentAsmStep >= example.steps.length - 1) {
            clearInterval(asmRunInterval);
            asmRunInterval = null;
            document.getElementById('asm-console-out').textContent += "\nLog: Ejecución automática completa.";
        } else {
            stepAsmSim();
        }
    };
    
    stepAsmSim();
    asmRunInterval = setInterval(runStep, 800);
}

// ----------------------------------------------------
// Arduino Simulator Logic (Unit V / Playgrounds)
// ----------------------------------------------------
const arduinoExamples = {
    blink: {
        code: "void setup() {\n  pinMode(13, OUTPUT); // Configurar pin 13 como salida\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH); // Encender LED\n  delay(1000);            // Esperar 1 segundo\n  digitalWrite(13, LOW);  // Apagar LED\n  delay(1000);            // Esperar 1 segundo\n}",
        interval: 1000
    },
    rapid: {
        code: "void setup() {\n  pinMode(13, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH);\n  delay(200);             // Parpadeo ultra rápido\n  digitalWrite(13, LOW);\n  delay(200);\n}",
        interval: 200
    },
    pulse: {
        code: "void setup() {\n  pinMode(13, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH);\n  delay(3000);            // Encendido 3 segundos\n  digitalWrite(13, LOW);\n  delay(100);             // Apagado rápido\n}",
        interval: 3100,
        customPattern: true
    }
};

let arduinoSimActive = false;
let arduinoIntervalId = null;
let selectedArduinoExample = "blink";

function loadArduinoExample() {
    stopArduinoSim();
    selectedArduinoExample = document.getElementById('arduino-example-select').value;
    document.getElementById('arduino-code-textarea').value = arduinoExamples[selectedArduinoExample].code;
}

function stopArduinoSim() {
    clearInterval(arduinoIntervalId);
    arduinoIntervalId = null;
    arduinoSimActive = false;
    
    document.getElementById('arduino-pin-led').classList.remove('led-on');
    document.getElementById('arduino-tx-led').setAttribute('fill', '#333');
    document.getElementById('arduino-rx-led').setAttribute('fill', '#333');
    
    const btn = document.getElementById('btn-ard-toggle');
    btn.textContent = "Iniciar Simulación";
    
    const status = document.getElementById('ard-sim-status');
    status.textContent = "Apagado";
    status.className = "sim-status";
}

function toggleArduinoSim() {
    if (arduinoSimActive) {
        stopArduinoSim();
    } else {
        startArduinoSim();
    }
}

function startArduinoSim() {
    arduinoSimActive = true;
    const btn = document.getElementById('btn-ard-toggle');
    btn.textContent = "Detener Simulación";
    
    const status = document.getElementById('ard-sim-status');
    status.textContent = "Ejecutando...";
    status.className = "sim-status active";
    
    const led = document.getElementById('arduino-pin-led');
    const tx = document.getElementById('arduino-tx-led');
    const rx = document.getElementById('arduino-rx-led');
    
    const program = arduinoExamples[selectedArduinoExample];
    
    if (selectedArduinoExample === 'blink' || selectedArduinoExample === 'rapid') {
        const halfCycle = program.interval;
        let isOn = false;
        arduinoIntervalId = setInterval(() => {
            isOn = !isOn;
            if (isOn) {
                led.classList.add('led-on');
                tx.setAttribute('fill', '#00f0ff');
            } else {
                led.classList.remove('led-on');
                tx.setAttribute('fill', '#333');
                rx.setAttribute('fill', '#b026ff');
                setTimeout(() => rx.setAttribute('fill', '#333'), 100);
            }
        }, halfCycle);
    } else if (selectedArduinoExample === 'pulse') {
        const runCycle = () => {
            led.classList.add('led-on');
            tx.setAttribute('fill', '#00f0ff');
            
            arduinoIntervalId = setTimeout(() => {
                led.classList.remove('led-on');
                tx.setAttribute('fill', '#333');
                rx.setAttribute('fill', '#b026ff');
                setTimeout(() => rx.setAttribute('fill', '#333'), 50);
                
                arduinoIntervalId = setTimeout(runCycle, 100);
            }, 3000);
        };
        runCycle();
    }
}

// ----------------------------------------------------
// Dynamic Panel Navigation Footer Injection
// ----------------------------------------------------
function injectPanelNavigation() {
    const totalNodes = 8;
    const nodeNames = [
        "Unidad I",
        "Unidad II",
        "Unidad III",
        "Unidad IV",
        "Unidad V",
        "emu8086 (Próx)",
        "Arduino (Próx)",
        "Simuladores"
    ];

    for (let i = 1; i <= totalNodes; i++) {
        const panelBody = document.querySelector(`#panel-node-${i} .panel-body`);
        if (!panelBody) continue;

        // Create nav container
        const navContainer = document.createElement('div');
        navContainer.className = "flex justify-between items-center mt-12 pt-6 border-t border-white/10 gap-4";

        const prevIndex = i === 1 ? totalNodes : i - 1;
        const nextIndex = i === totalNodes ? 1 : i + 1;

        // Previous button
        const btnPrev = document.createElement('button');
        btnPrev.className = "flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 rounded-xl text-sm text-primary transition-all duration-300";
        btnPrev.innerHTML = `<span class="material-symbols-outlined text-sm">chevron_left</span> ${nodeNames[prevIndex - 1]}`;
        btnPrev.onclick = () => triggerBranchTransition(`node-${prevIndex}`, `node-${i}`);
        navContainer.appendChild(btnPrev);

        // Center Return button
        const btnHome = document.createElement('button');
        btnHome.className = "flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 hover:bg-primary/20 rounded-xl text-sm text-primary transition-all duration-300";
        btnHome.innerHTML = `<span class="material-symbols-outlined text-sm">hub</span> Mapa`;
        btnHome.onclick = () => closePanel(`node-${i}`);
        navContainer.appendChild(btnHome);

        // Next button
        const btnNext = document.createElement('button');
        btnNext.className = "flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 rounded-xl text-sm text-primary transition-all duration-300";
        btnNext.innerHTML = `${nodeNames[nextIndex - 1]} <span class="material-symbols-outlined text-sm">chevron_right</span>`;
        btnNext.onclick = () => triggerBranchTransition(`node-${nextIndex}`, `node-${i}`);
        navContainer.appendChild(btnNext);

        panelBody.appendChild(navContainer);
    }
}

// ----------------------------------------------------
// App Initialization
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Inject bottom panel navigation buttons dynamically
    injectPanelNavigation();
});
