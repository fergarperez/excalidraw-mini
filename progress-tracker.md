✅ Progress Tracker — Pizarra Colaborativa

Guía de desarrollo incremental. Regla de oro: No avances a la siguiente feature hasta que el criterio de éxito de la actual funcione de forma estable.

📊 Resumen de Progreso

[x] Bloque 1: El Motor Local (Canvas 2D)

[ ] Bloque 2: Conexión y Presencia (WebSockets & Cursores)

[ ] Bloque 3: Sincronización de Trazos (Multijugador Real)

[ ] Bloque 4: Pulido de Ingeniería (Cámara Infinita & Geometría)

🧱 Bloque 1: El Motor Local (Solo Frontend, Cero Red)

Objetivo: Dominar el <canvas> de HTML5 y la estructura de datos del dibujo antes de introducir red.

Feature 1.1: Lienzo Responsive y Nítido

[x] Crear el componente principal con un elemento <canvas> a pantalla completa (100vw x 100vh).

[x] Configurar el escalado interno usando window.devicePixelRatio para pantallas Retina/HD.

[x] Manejar el evento resize de la ventana sin deformar el contenido.

Criterio de éxito: Dibujar una figura de prueba y comprobar que los bordes son completamente nítidos y no se pixelan al redimensionar.

Feature 1.2: Dibujo a Mano Alzada con Estado

[x] Definir la interfaz Stroke (id, color, width, points: { x, y }[]).

[x] Implementar los eventos onPointerDown, onPointerMove y onPointerUp.

[x] Almacenar los trazos en una referencia mutable (useRef) para evitar re-renders innecesarios de React.

[x] Crear la función render() que limpia el canvas (clearRect) y dibuja todos los trazos guardados.

Criterio de éxito: Poder dibujar múltiples líneas independientes en pantalla y que permanezcan guardadas en memoria.

Feature 1.3: Herramientas Básicas (Color, Grosor y Deshacer)

[x] Crear una barra de herramientas flotante (UI) con selector de color y grosor de trazo.

[x] Asociar el color y grosor activos a cada nuevo objeto Stroke al iniciar el trazo.

[x] Implementar la acción Deshacer (Ctrl+Z / botón) eliminando el último elemento del array y redibujando.

[x] Implementar la acción Limpiar Lienzo.

Criterio de éxito: Alternar colores y grosores en distintos trazos y deshacer el último sin afectar a los anteriores.

🌐 Bloque 2: Conexión y Presencia (WebSockets)

Objetivo: Levantar el servidor Node y lograr que múltiples pestañas compartan presencia en una sala.

Feature 2.1: Servidor WebSocket y Salas (Rooms)

[x] Inicializar proyecto Node.js con y Socket.io.

[x] Implementar soporte de salas dinámicas mediante URL en el cliente (ej. /room/:roomId).

[x] Gestionar eventos connection, join-room (socket.join(roomId)) y disconnect.

Criterio de éxito: Abrir dos pestañas en la misma URL y verificar en los logs del servidor que ambas comparten sala y se desconectan limpiamente.

Feature 2.2: Cursores en Vivo (Live Cursors)

[ ] Asignar un nombre y color aleatorio a cada usuario al conectarse.

[ ] Emitir evento cursor:move con { x, y } al mover el puntero sobre el canvas.

[ ] Retransmitir la posición desde el servidor al resto de usuarios de la sala (socket.to(roomId).emit(...)).

[ ] Renderizar los cursores remotos en el cliente (mediante canvas o elementos HTML superpuestos) y eliminarlos al desconectarse el usuario.

Criterio de éxito: Ver el cursor de la Pestaña A moverse en tiempo real dentro de la Pestaña B con su etiqueta de nombre.

Feature 2.3: Throttling de Red

[ ] Implementar una utilidad throttle para limitar la emisión de cursor:move a un máximo de ~30-45 veces por segundo (cada ~25ms).

Criterio de éxito: Comprobar en DevTools (Network -> WS) que los paquetes salen a un ritmo constante y controlado sin perder fluidez visual.

🤝 Bloque 3: Sincronización de Trazos (Núcleo Colaborativo)

Objetivo: Lograr que el estado del dibujo sea compartido y consistente entre todos los clientes.

Feature 3.1: Sincronización al Terminar el Trazo (v1)

[x] Generar un id único en el cliente para cada trazo (crypto.randomUUID()).

[x] Al soltar el ratón (onPointerUp), emitir el evento stroke:complete con el objeto Stroke completo.

[x] Escuchar el evento en los demás clientes, añadir el trazo al estado local y disparar el renderizado.

Criterio de éxito: Dibujar un trazo en la ventana A y verlo aparecer en la ventana B al soltar el clic.

Feature 3.2: Sincronización Punto a Punto en Tiempo Real (v2)

[ ] Sustituir el envío único por tres eventos granulares:

stroke:start (envía metadatos iniciales + primer punto).

stroke:point (envía nuevos puntos asociados al id del trazo activo).

stroke:end (cierra el trazo).

[ ] Actualizar los trazos remotos en curso buscándolos por su id en el estado local.

Criterio de éxito: Dos usuarios dibujando simultáneamente ven cómo se forman ambos trazos línea a línea en tiempo real sin colisionar.

Feature 3.3: Hidratación de Estado (Sync on Join)

[x] Almacenar en memoria en el servidor un mapa Map<roomId, Stroke[]> con el historial de cada sala.

[x] Al unirse un nuevo cliente, emitirle un evento room:init con todos los trazos acumulados hasta ese momento.

[x] Sincronizar también el borrado/deshacer (stroke:delete) para que afecte a todos los clientes y al estado del servidor.

Criterio de éxito: Dibujar en la Pestaña A, abrir una Pestaña B nueva y cargar automáticamente todo el dibujo previo.

🚀 Bloque 4: Pulido de Ingeniería (Nivel Avanzado)

Objetivo: Elevar la calidad técnica y la experiencia de usuario de la herramienta.

Feature 4.1: Cámara Infinita (Pan & Zoom)

[ ] Crear estado de cámara (offsetX, offsetY, scale).

[ ] Implementar desplazamiento (Pan) arrastrando con el botón central del ratón o Espacio + Clic.

[ ] Implementar acercamiento (Zoom) con la rueda del ratón centrado en la posición del cursor.

[ ] Implementar funciones de conversión screenToWorld(x, y) y worldToScreen(x, y).

[ ] Asegurar que todas las coordenadas enviadas por WebSocket estén en World Space.

Criterio de éxito: Hacer zoom y desplazarse en una pantalla, dibujar, y comprobar que otro usuario con distinta vista ve el trazo en su sitio exacto.

Feature 4.2: Figuras Geométricas (Rectángulos y Flechas)

[ ] Refactorizar el modelo de datos a un tipo unión discriminada (Element = FreehandStroke | RectangleElement | ArrowElement).

[ ] Añadir botones en la barra de herramientas para seleccionar el modo de dibujo.

[ ] Implementar previsualización mientras se arrastra el ratón antes de confirmar la figura.

Criterio de éxito: Dibujar rectángulos y flechas y verificar que se sincronizan correctamente con el resto de usuarios.

Feature 4.3: Suavizado de Trazos (Curvas de Bézier)

[ ] Reemplazar el trazado poligonal (lineTo) por curvas cuadráticas (quadraticCurveTo) calculando los puntos medios entre coordenadas consecutivas.

Criterio de éxito: Realizar movimientos rápidos y curvos con el ratón obteniendo líneas suaves sin vértices bruscos.

📝 Notas Técnicas y Decisiones de Diseño

(Usa este espacio para apuntar bugs resueltos, fórmulas matemáticas o decisiones tomadas durante el desarrollo)

Formato de coordenadas: ...

Frecuencia de throttle elegida: ...
