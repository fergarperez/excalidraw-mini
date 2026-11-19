🎨 Pizarra Colaborativa en Tiempo Real (Lite Whiteboard)

Aplicación web de pizarra colaborativa infinita con soporte multiusuario y cursores en vivo, construida desde cero sobre HTML5 Canvas y WebSockets sin librerías externas de renderizado gráfico.

🎯 Objetivos del Proyecto

El propósito principal de este desarrollo es profundizar en fundamentos de ingeniería de software que van más allá de las aplicaciones CRUD tradicionales:

Gráficos 2D y Renderizado Imperativo: Comprender el ciclo de renderizado de bajo nivel mediante CanvasRenderingContext2D, gestión de devicePixelRatio y suavizado de trazos mediante curvas de Bézier.

Sistemas de Coordenadas (Pan & Zoom): Desacoplar las coordenadas físicas del navegador (Screen Space) de las coordenadas lógicas del lienzo (World Space) mediante transformaciones afines 2D.

Arquitectura en Tiempo Real: Diseñar un protocolo de eventos bidireccional eficiente con WebSockets, diferenciando tráfico volátil de alta frecuencia (cursores) de tráfico crítico de estado (trazos).

Concurrencia y Consistencia: Gestionar múltiples usuarios dibujando simultáneamente mediante identificadores únicos generados en cliente (UUID) y mantener una fuente de la verdad en memoria en el servidor.

Rendimiento en Frontend: Evitar cuellos de botella en React aislando el estado mutable de alta frecuencia (useRef + requestAnimationFrame) del ciclo de reconciliación del DOM.

🛠️ Stack Tecnológico

Frontend: React + TypeScript + Vite (o Next.js)

Motor Gráfico: HTML5 <canvas> nativo (CanvasRenderingContext2D)

Backend / Tiempo Real: Node.js + Socket.io (o ws)

Estilos: Tailwind CSS

🧠 Arquitectura General

El sistema se divide en tres capas desacopladas:

+-------------------------------------------------------------------+
| CLIENTE (Navegador) |
| |
| [Input Events] ---> [World Coords] ---> [Local State (useRef)] |
| | | |
| v v |
| [Socket Client] [Canvas Render Loop] |
+----------------------------|--------------------------------------+
| (WebSockets: JSON / Binary)
v
+-------------------------------------------------------------------+
| SERVIDOR (Node.js + Sockets) |
| |
| [Room Manager] ---> [In-Memory State] ---> [Broadcast Engine] |
+-------------------------------------------------------------------+

Principios de Diseño

Sincronización de Datos, no de Píxeles: Nunca se transmiten imágenes ni mapas de bits por la red. Se transmiten estructuras vectoriales ligeras (Stroke[]) y cada cliente renderiza su propia vista local.

Coordenadas Universales: Todo evento emitido por red viaja en coordenadas del mundo (worldX, worldY), garantizando que usuarios con distintos tamaños de pantalla o niveles de zoom vean los elementos exactamente en la misma posición relativa.

📂 Estructura Sugerida del Proyecto

/
├── client/ # Aplicación Frontend
│ ├── src/
│ │ ├── components/ # CanvasBoard, Toolbar, RoomHeader
│ │ ├── hooks/ # useCanvas, useSocket, useViewport
│ │ ├── types/ # Definiciones de Stroke, Point, Cursor, Events
│ │ └── utils/ # Matemáticas 2D (screenToWorld, curvas Bézier, throttle)
├── server/ # Servidor WebSockets
│ ├── src/
│ │ ├── rooms/ # Gestión de salas y estado en memoria
│ │ └── index.ts # Punto de entrada y handlers de Socket.io
├── README.md
└── PROGRESS-TRACKER.md # Hoja de ruta y seguimiento de desarrollo

🚀 Puesta en Marcha (Local)

# 1. Instalar dependencias del servidor y arrancar

cd server
npm install
npm run dev

# 2. En otra terminal, instalar dependencias del cliente y arrancar

cd client
npm install
npm run dev

📋 Seguimiento del Desarrollo

Para consultar el desglose detallado de funcionalidades y marcar el avance paso a paso, revisa el archivo PROGRESS-TRACKER.md.
