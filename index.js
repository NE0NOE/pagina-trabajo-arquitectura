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
    const nodes = Array.from(document.querySelectorAll('.branch-node'));
    const svg = document.getElementById('svgConnections');
    
    if (!container || !trunk || !svg) return;

    // Clear previous paths on resize
    svg.innerHTML = '';

    if (!isDesktop) {
        // Reset styles for mobile stack
        nodes.forEach(node => {
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

    // 1. Calculate and store coordinates for all nodes
    const nodeCoords = nodes.map((node, index) => {
        const nodeId = node.getAttribute('data-id');
        
        // Safety fallbacks for sizes if browser has not done layout yet
        const defaultWidth = (nodeId === 'node-6' || nodeId === 'node-7' || nodeId === 'node-8' || nodeId === 'node-9' ? 224 : 256);
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

    // 2. Draw radial lines from center to each node
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

    // 3. Draw outer ring paths connecting adjacent nodes in a circle
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
        
        setTimeout(() => {
            busElement.classList.remove('pulse');
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
// Quiz System Logic (Autoevaluación)
// ----------------------------------------------------
const quizData = {
    "1": [
        {
            q: "¿Cuál es la principal diferencia entre la Arquitectura y la Organización de computadoras?",
            o: [
                "La arquitectura se refiere a los atributos visibles al programador (como el ISA), mientras que la organización detalla las interconexiones operativas físicas transparentes para él.",
                "La arquitectura describe el chasis de la computadora y la organización describe el sistema operativo instalado.",
                "No hay diferencia física ni conceptual; ambos términos representan la misma estructura de la placa base.",
                "La arquitectura trata sobre el consumo eléctrico del procesador y la organización sobre la distribución de las memorias SSD."
            ],
            a: 0,
            e: "La arquitectura representa el diseño abstracto y conjunto de instrucciones legibles para programar (ISA), mientras que la organización realiza ese diseño implementando compuertas y hardware específico."
        },
        {
            q: "¿Cuáles son las cuatro funciones básicas que ejecuta una computadora?",
            o: [
                "Entrada, Salida, Copiado y Borrado de datos.",
                "Procesamiento, Almacenamiento, Transferencia y Control de datos.",
                "Compilación, Enlazado, Simulación y Ejecución de programas.",
                "Suma, Resta, Multiplicación y División aritmética."
            ],
            a: 1,
            e: "Cualquier computadora procesa datos, los almacena (RAM/Disco), los mueve de un lugar a otro (transferencia) y supervisa todo mediante la unidad de control."
        },
        {
            q: "Si necesitas diseñar un termostato inteligente compacto de bajo costo, ¿qué componente elegirías?",
            o: [
                "Un microprocesador de alto rendimiento como un Intel Core i5.",
                "Un módulo de interrupciones 8259 acoplado a un disco duro externo.",
                "Un microcontrolador (μC) ya que integra CPU, memoria RAM/Flash y puertos E/S en un solo chip económico.",
                "Una memoria de segmentación de la familia ix86."
            ],
            a: 2,
            e: "Los microcontroladores integran todos los recursos mínimos en un único integrado y consumen muy poca potencia, ideal para sistemas embebidos específicos como termostatos."
        }
    ],
    "2": [
        {
            q: "¿Qué cuello de botella presenta la Arquitectura Von Neumann?",
            o: [
                "Las instrucciones y los datos comparten el mismo bus de datos y memoria, impidiendo que la CPU acceda a ambos de forma simultánea.",
                "No soporta operaciones lógicas complejas en la ALU.",
                "Depende obligatoriamente del uso de un coprocesador matemático externo.",
                "Tiene una capacidad limitada de direccionamiento de 8 bits."
            ],
            a: 0,
            e: "El cuello de botella de Von Neumann se produce porque las instrucciones y los datos viajan por el mismo bus hacia la misma memoria. El procesador debe alternar entre leer el código y leer la memoria de datos."
        },
        {
            q: "¿Qué tipo de bus es unidireccional y se encarga de seleccionar el periférico o celda de memoria a leer/escribir?",
            o: [
                "El Bus de Datos.",
                "El Bus de Control.",
                "El Bus de Direcciones.",
                "El Bus de Interrupciones."
            ],
            a: 2,
            e: "El Bus de Direcciones es unidireccional (generado por la CPU) e indica la dirección de destino física sobre la cual operar."
        },
        {
            q: "El chip 8255 (PPI) sirve para:",
            o: [
                "Proporcionar una interfaz paralela programable para periféricos externos.",
                "Regular la frecuencia de oscilación del cristal de cuarzo de la CPU.",
                "Controlar las solicitudes de interrupción prioritarias enviadas a la CPU.",
                "Proporcionar una memoria ROM no volátil de alta velocidad."
            ],
            a: 0,
            e: "El Intel 8255 (PPI) es un chip periférico diseñado para dotar al procesador de puertos paralelos bidireccionales y configurables para Entrada/Salida."
        }
    ],
    "3": [
        {
            q: "¿Cuál es el propósito del registro de segmento CS en el procesador Intel 8086?",
            o: [
                "Contener el operando para multiplicaciones avanzadas.",
                "Apoyar el direccionamiento del segmento donde se almacena el código del programa (Code Segment).",
                "Guardar temporalmente la dirección de la pila de datos (Stack Segment).",
                "Guardar las banderas de desbordamiento aritmético."
            ],
            a: 1,
            e: "El registro CS (Code Segment) apunta al segmento actual de la memoria que contiene las instrucciones del programa que la CPU ejecuta."
        },
        {
            q: "En el ensamblador ix86, ¿qué diferencia hay entre un Procedimiento (PROC) y una Macro (MACRO)?",
            o: [
                "No hay diferencia; ambos ejecutan llamadas de interrupción del BIOS.",
                "La macro se expande textualmente reemplazando su nombre en cada llamada durante la compilación, mientras que el procedimiento se compila una sola vez y se invoca mediante CALL y RET.",
                "El procedimiento consume más memoria física en el archivo compilado final que la macro.",
                "Las macros se guardan en la memoria RAM externa y los procedimientos en los registros de la CPU."
            ],
            a: 1,
            e: "Los procedimientos ahorran espacio de código ya que residen en una sola dirección de memoria física. Las macros ahorran sobrecarga de pila (CALL/RET) al copiar el código directamente donde se necesita."
        },
        {
            q: "¿Qué modo de direccionamiento utiliza la instrucción: MOV AX, [BX] ?",
            o: [
                "Direccionamiento Inmediato.",
                "Direccionamiento Registro.",
                "Direccionamiento Indirecto por Registro.",
                "Direccionamiento Directo de Memoria."
            ],
            a: 2,
            e: "Como el registro BX se encuentra entre corchetes, indica que la dirección de memoria efectiva donde está el dato se encuentra almacenada dentro de BX."
        }
    ],
    "4": [
        {
            q: "¿Qué ventaja principal ofrece la Arquitectura Harvard en microcontroladores?",
            o: [
                "Tiene buses y memorias físicas separadas para código y datos, lo que permite accesos simultáneos y ejecuciones más rápidas.",
                "Reduce los costos de fabricación al unificar los chips de memoria en un solo bloque.",
                "Es inmune a las interrupciones de hardware del 8259.",
                "Permite programar en ensamblador de la familia ix86 nativamente."
            ],
            a: 0,
            e: "Al separar físicamente las instrucciones y los datos, el procesador puede buscar la siguiente instrucción en la memoria de código mientras lee o escribe una variable en la RAM de datos, logrando un rendimiento superior."
        },
        {
            q: "¿Qué diferencia principal existe entre procesadores con filosofía RISC y CISC?",
            o: [
                "CISC utiliza únicamente instrucciones lógicas AND y OR.",
                "RISC utiliza un repertorio simplificado de instrucciones sencillas que típicamente se ejecutan en un único ciclo de reloj, mientras que CISC dispone de instrucciones complejas multiciclo.",
                "RISC requiere una gran cantidad de memoria caché de programa externa.",
                "CISC fue diseñado para microcontroladores económicos e inalámbricos."
            ],
            a: 1,
            e: "RISC apuesta por la simplicidad de hardware, logrando altas velocidades con instrucciones básicas de un ciclo, mientras que CISC incluye hardware decodificador complejo para resolver tareas sofisticadas en menos líneas de código."
        },
        {
            q: "¿Qué caracteriza a un microcontrolador embebido?",
            o: [
                "Requiere tarjetas de red externas para comunicarse con sensores.",
                "Integra todos los recursos operativos (CPU, RAM, ROM, I/O) dentro del chip y no tiene buses externos expuestos.",
                "Trabaja exclusivamente sumergido en líquidos refrigerantes industriales.",
                "Solo puede ser programado una vez en la vida útil del chip."
            ],
            a: 1,
            e: "Un microcontrolador embebido tiene todos los elementos indispensables alojados dentro del mismo silicio, evitando buses direccionables exteriores para liberar pines como GPIOs."
        }
    ],
    "5": [
        {
            q: "¿A qué grupo de instrucciones pertenecen nemónicos como BTFSC o JMP?",
            o: [
                "Instrucciones de Transferencia de datos.",
                "Instrucciones de Aritmética y Lógica.",
                "Instrucciones de Control de Flujo de programa.",
                "Instrucciones Aritméticas de Pila."
            ],
            a: 2,
            e: "Tanto JMP (salto incondicional) como BTFSC (bifurcación condicional en base a un bit) alteran el flujo lineal del puntero de instrucciones."
        },
        {
            q: "¿Qué representa una Directiva en el desarrollo de software en ensamblador?",
            o: [
                "Una instrucción binaria directa enviada a la ALU para sumar datos.",
                "Un comando que da instrucciones al compilador durante el proceso de ensamblado y no genera código ejecutable para el microcontrolador.",
                "Un controlador de periféricos de Entrada y Salida analógica.",
                "Una llamada a las funciones del BIOS de la computadora."
            ],
            a: 1,
            e: "Las directivas (como ORG, EQU, END) son comandos que configuran y guían al compilador, pero no se traducen en código binario de máquina ejecutable por el silicio."
        },
        {
            q: "¿Qué combinación de herramientas de software se usa comúnmente en la industria para depurar circuitos con microcontroladores sin hardware físico?",
            o: [
                "emu8086 y Arduino IDE.",
                "MPLAB X (para escritura/compilación) y PROTEUS (para simulación esquemática del circuito).",
                "Visual Studio Code e Intel Quartus.",
                "C++ Compiler y Microsoft Excel."
            ],
            a: 1,
            e: "MPLAB compila el código generando el archivo binario (.hex), el cual se carga virtualmente dentro del chip simulado en PROTEUS para visualizar el circuito en pantalla."
        }
    ]
};

let currentQuizUnit = "1";
let currentQuizQIdx = 0;
let quizScore = 0;
let userSelectedOption = null;

function loadQuiz() {
    const select = document.getElementById('quiz-unit-select');
    currentQuizUnit = select.value;
    currentQuizQIdx = 0;
    quizScore = 0;
    userSelectedOption = null;
    
    document.getElementById('quiz-results').classList.add('d-none');
    document.getElementById('quiz-box').classList.remove('d-none');
    
    showQuizQuestion();
}

function showQuizQuestion() {
    userSelectedOption = null;
    
    document.getElementById('quiz-btn-submit').classList.remove('d-none');
    document.getElementById('quiz-btn-next').classList.add('d-none');
    
    const unitQuestions = quizData[currentQuizUnit];
    const qData = unitQuestions[currentQuizQIdx];
    
    document.getElementById('quiz-question-number').textContent = `Pregunta ${currentQuizQIdx + 1} de ${unitQuestions.length}`;
    document.getElementById('quiz-question-text').textContent = qData.q;
    
    const optionsWrap = document.getElementById('quiz-options');
    optionsWrap.innerHTML = "";
    
    const optionLetters = ["A", "B", "C", "D"];
    qData.o.forEach((optText, idx) => {
        const optDiv = document.createElement('div');
        optDiv.className = "quiz-option";
        optDiv.setAttribute('data-idx', idx);
        
        optDiv.innerHTML = `
            <div class="opt-indicator">${optionLetters[idx]}</div>
            <div class="opt-text">${escapeHTML(optText)}</div>
        `;
        
        optDiv.addEventListener('click', () => selectQuizOption(idx));
        optionsWrap.appendChild(optDiv);
    });
}

function selectQuizOption(idx) {
    if (document.getElementById('quiz-btn-submit').classList.contains('d-none')) {
        return;
    }
    
    userSelectedOption = idx;
    
    const options = document.querySelectorAll('#quiz-options .quiz-option');
    options.forEach(opt => {
        opt.classList.remove('selected');
        if (parseInt(opt.getAttribute('data-idx')) === idx) {
            opt.classList.add('selected');
        }
    });
}

function submitQuizAnswer() {
    if (userSelectedOption === null) {
        alert("Por favor, selecciona una opción antes de enviar.");
        return;
    }
    
    const unitQuestions = quizData[currentQuizUnit];
    const qData = unitQuestions[currentQuizQIdx];
    const correctIdx = qData.a;
    
    const options = document.querySelectorAll('#quiz-options .quiz-option');
    options.forEach(opt => {
        const optIdx = parseInt(opt.getAttribute('data-idx'));
        opt.classList.remove('selected');
        
        if (optIdx === correctIdx) {
            opt.classList.add('correct');
        } else if (optIdx === userSelectedOption) {
            opt.classList.add('incorrect');
        }
    });
    
    if (userSelectedOption === correctIdx) {
        quizScore++;
    }
    
    document.getElementById('quiz-btn-submit').classList.add('d-none');
    document.getElementById('quiz-btn-next').classList.remove('d-none');
    
    const explanationDiv = document.createElement('div');
    explanationDiv.className = "bg-black/30 p-3 rounded-lg border border-white/5 text-xs text-on-surface-variant/90 mt-3";
    explanationDiv.innerHTML = `<strong>Explicación:</strong> ${escapeHTML(qData.e)}`;
    document.getElementById('quiz-options').appendChild(explanationDiv);
}

function nextQuizQuestion() {
    const unitQuestions = quizData[currentQuizUnit];
    currentQuizQIdx++;
    
    if (currentQuizQIdx >= unitQuestions.length) {
        showQuizResults();
    } else {
        showQuizQuestion();
    }
}

function showQuizResults() {
    document.getElementById('quiz-box').classList.add('d-none');
    
    const resultsCard = document.getElementById('quiz-results');
    resultsCard.classList.remove('d-none');
    
    const totalQ = quizData[currentQuizUnit].length;
    document.getElementById('quiz-score-val').textContent = `${quizScore} / ${totalQ}`;
    
    let feedback = "";
    if (quizScore === totalQ) {
        feedback = "¡Perfecto! Has dominado por completo todos los conceptos de esta unidad. ¡Sigue así!";
    } else if (quizScore >= totalQ / 2) {
        feedback = "¡Buen trabajo! Has aprobado la evaluación, pero te recomendamos repasar las explicaciones de las preguntas fallidas.";
    } else {
        feedback = "Te sugerimos volver a leer el contenido de la unidad y reintentar el cuestionario para afianzar tus bases.";
    }
    document.getElementById('quiz-result-feedback').textContent = feedback;
}

function restartQuiz() {
    loadQuiz();
}

// Helper to escape HTML characters
function escapeHTML(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ----------------------------------------------------
// Dynamic Panel Navigation Footer Injection
// ----------------------------------------------------
function injectPanelNavigation() {
    const totalNodes = 9;
    const nodeNames = [
        "Unidad I",
        "Unidad II",
        "Unidad III",
        "Unidad IV",
        "Unidad V",
        "emu8086 (Próx)",
        "Arduino (Próx)",
        "Simuladores",
        "Cuestionarios"
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
    // Load initial quiz
    loadQuiz();
    
    // Inject bottom panel navigation buttons dynamically
    injectPanelNavigation();
});
