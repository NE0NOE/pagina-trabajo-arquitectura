# Guía de Capturas de Pantalla (Screenshots) para los Tutoriales

Esta guía detalla los pasos exactos que debes seguir para realizar las capturas de pantalla de tus prácticas. Cada captura se utilizará para ilustrar de forma visual los tutoriales del proyecto web.

---

## 📂 Directorio del Proyecto
Asegúrate de colocar las imágenes en las siguientes carpetas dentro de tu proyecto:
1. Para emu8086: `assets/images/emu8086/`
2. Para Arduino y Proteus: `assets/images/arduino/`

*(Si las carpetas no existen, no te preocupes, el asistente las creará automáticamente en la raíz del proyecto).*

---

## 🖥️ 1. Tutorial emu8086 (`assets/images/emu8086/`)

Guarda las capturas en `assets/images/emu8086/` utilizando exactamente los nombres **`1.png`**, **`2.png`**, **`3.png`** y **`4.png`**.

### 📸 Captura 1: El Código Fuente en el Editor
- **Archivo:** `1.png`
- **¿Qué abrir?:** Ejecuta `emu8086` y abre un archivo nuevo. Escribe un código simple, por ejemplo:
  ```assembly
  ORG 100h
  MOV AX, 5
  MOV BX, 10
  ADD AX, BX
  RET
  ```
- **Instrucción de captura:** Toma la captura mostrando toda la ventana del editor de `emu8086`, asegurándote de que el código escrito sea legible.

### 📸 Captura 2: La Ventana del Emulador
- **Archivo:** `2.png`
- **¿Qué hacer?:** Haz clic en el botón **"Compile"** o **"Emulate"** en la barra superior. Se abrirán las ventanas del Emulador y la lista de código binario.
- **Instrucción de captura:** Captura la ventana principal de emulación ("Emulator"), donde se muestran las filas de los registros `AX`, `BX`, `CX`, `DX`, `CS`, `IP`, etc.

### 📸 Captura 3: Depuración Paso a Paso (Single Step)
- **Archivo:** `3.png`
- **¿Qué hacer?:** En la ventana del emulador, haz clic una vez en el botón **"Single Step"**. Verás cómo la primera instrucción se ejecuta y el registro `AX` cambia de valor a `0005h` (y posiblemente se resalta en un color diferente, como azul).
- **Instrucción de captura:** Captura la ventana en este instante preciso, resaltando el valor actualizado en los registros `AX` e `IP`.

### 📸 Captura 4: Las Banderas (Flags Window)
- **Archivo:** `4.png`
- **¿Qué hacer?:** Haz clic en el botón **"Flags"** de la ventana del emulador para abrir la ventana flotante de los bits de bandera (ZF, SF, CF, etc.). Ejecuta una instrucción que altere las banderas (como una comparación o resta).
- **Instrucción de captura:** Captura la pantalla mostrando juntos el emulador y la pequeña ventana flotante de "Flags" con sus bits modificados.

---

## 🔌 2. Tutorial Arduino y Proteus (`assets/images/arduino/`)

Guarda las capturas en `assets/images/arduino/` utilizando exactamente los nombres **`1.png`**, **`2.png`**, **`3.png`**, **`4.png`** y **`5.png`**.

### 📸 Captura 1: El Entorno de Arduino IDE
- **Archivo:** `1.png`
- **¿Qué abrir?:** Abre Arduino IDE y carga el sketch básico **Blink** (`Archivo > Ejemplos > 01.Basics > Blink`).
- **Instrucción de captura:** Haz clic en **Verificar (Verify)** para compilar el programa. Captura la ventana del IDE completa mostrando el código de Blink y la consola de la parte inferior indicando "Compilado / Compilación terminada".

### 📸 Captura 2: Esquemático del Circuito en PROTEUS
- **Archivo:** `2.png`
- **¿Qué abrir?:** Abre PROTEUS. Diseña el circuito colocando una placa **Arduino Uno (Simulino)**, un **LED** conectado al pin digital 13, y una **resistencia** de `220Ω` a tierra (GND).
- **Instrucción de captura:** Toma una captura limpia del lienzo de trabajo de PROTEUS mostrando la placa, el LED y sus conexiones correspondientes.

### 📸 Captura 3: Carga del Archivo Binario (.hex)
- **Archivo:** `3.png`
- **¿Qué hacer?:** Haz doble clic sobre el microcontrolador/placa Arduino en PROTEUS para abrir la ventana de Propiedades.
- **Instrucción de captura:** Muestra la casilla de **"Program File"** abierta, indicando la ruta del archivo `.hex` que se generó desde el compilador de Arduino IDE, lista para ser cargada.

### 📸 Captura 4: Simulación Activa (LED Encendido)
- **Archivo:** `4.png`
- **¿Qué hacer?:** Haz clic en el botón **Play / Iniciar Simulación** (esquina inferior izquierda de PROTEUS).
- **Instrucción de captura:** Captura el circuito funcionando cuando el LED virtual se enciende e irradia luz (generalmente de color rojo, amarillo o verde en PROTEUS).

### 📸 Captura 5: Simulación Activa (LED Apagado)
- **Archivo:** `5.png`
- **¿Qué hacer?:** Espera un segundo a que el ciclo de Blink apague el LED.
- **Instrucción de captura:** Captura el circuito funcionando en el instante en que el LED se apaga para completar la secuencia visual.
