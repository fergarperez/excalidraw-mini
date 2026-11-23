import { useCallback, useEffect, useRef, useState } from "react";
import type { Stroke } from "./types/stroke";
import { socket } from "./lib/socket";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const isDrawing = useRef(false);
  const pencil = useRef(true);
  const eraser = useRef(false);
  const room = useRef<string | null>(null);
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(3);

  // Función pura de renderizado: lee el estado (strokes) y lo pinta desde cero
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // 1. Limpiamos todo el lienzo antes de redibujar
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Recorremos cada trazo guardado en memoria
    for (const stroke of strokes.current) {
      if (stroke.points.length === 0) continue;

      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;

      // Movemos el lápiz al primer punto del trazo
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      // Conectamos con los puntos siguientes
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      ctx.stroke();
    }
  }, []);

  useEffect(() => {
    socket.on("room:init", (newStrokes: Stroke[]) => {
      if (newStrokes.length !== 0) {
        strokes.current = newStrokes;
        renderCanvas();
      }
    });

    socket.on("stroke:add", (stroke: Stroke) => {
      if (!stroke) return;
      strokes.current.push(stroke);
      renderCanvas();
    });

    socket.on("stroke:remove", (id: number) => {
      strokes.current = strokes.current.filter((s) => s.id !== id);
      renderCanvas();
    });

    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = window.innerWidth / 1.5;
    const displayHeight = window.innerHeight / 1.5;

    // Tamaño visual en CSS
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    canvas.style.border = "1px solid black";

    // Resolución interna real (píxeles físicos)
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const undo = useCallback(() => {
    if (strokes.current.length === 0) return;
    const removed = strokes.current.pop();
    renderCanvas();
    if (removed) socket.emit("stroke:remove", removed.id, room.current);
  }, [renderCanvas]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Limpieza al desmontar el componente
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [undo]);

  function handleMouseDown(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!pencil.current && !eraser.current) return;

    if (pencil.current) {
      isDrawing.current = true;
      const { offsetX, offsetY } = event.nativeEvent;

      strokes.current.push({
        id: crypto.getRandomValues(new Uint32Array(1))[0],
        color,
        width: strokeWidth,
        points: [{ x: offsetX, y: offsetY }],
      });

      renderCanvas();
    } else if (eraser.current) {
      isDrawing.current = true;
      const { offsetX, offsetY } = event.nativeEvent;

      strokes.current.push({
        id: crypto.getRandomValues(new Uint32Array(1))[0],
        color: "#FFFFFF", // Color del borrador (blanco)
        width: strokeWidth, // Ancho del borrador
        points: [{ x: offsetX, y: offsetY }],
      });
      renderCanvas();
    }
  }

  function handleMouseMove(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    const { offsetX, offsetY } = event.nativeEvent;

    const currentStroke = strokes.current[strokes.current.length - 1];
    if (currentStroke) {
      currentStroke.points.push({ x: offsetX, y: offsetY });
      renderCanvas();
    }
  }

  function handleMouseUp() {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const last = strokes.current[strokes.current.length - 1];
    if (!last) return;
    socket.emit("stroke:add", last, room.current);
  }

  return (
    <div className="App">
      <section
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          backgroundColor: "#f0f0f0",
        }}
        id="header"
        className="header"
      >
        <h1>Excalidraw Mini</h1>
        <div id="room">
          <label style={{ fontFamily: "fantasy", fontSize: 20 }}>Room: </label>
          <input
            type="text"
            onChange={(e) => {
              room.current = e.target.value;
            }}
          />
          <button
            onClick={(e) => {
              socket.emit("join", room.current);
            }}
          >
            Conectar
          </button>
        </div>
      </section>
      <div
        className="controls"
        style={{
          zIndex: 10,
          display: "flex",
          gap: "8px",
          justifyContent: "center",
          alignItems: "center",
          padding: "8px 12px",
          margin: "10px auto",
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        <input
          type="color"
          title="Color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <input
          type="range"
          title="Grosor"
          min={1}
          max={30}
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
        />
        <span style={{ minWidth: 28 }}>{strokeWidth}px</span>
        <button onClick={undo}>Deshacer</button>
        <button
          onClick={() => {
            pencil.current = !pencil.current;
            if (pencil.current) eraser.current = false; // Desactivar borrador si se activa lápiz
          }}
        >
          Lápiz
        </button>
        <button
          onClick={() => {
            eraser.current = !eraser.current;
            if (eraser.current) pencil.current = false; // Desactivar lápiz si se activa borrador
          }}
        >
          Borrador
        </button>
        <button
          onClick={() => {
            strokes.current = [];
            renderCanvas();
          }}
        >
          Limpiar
        </button>
      </div>
      <canvas
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        ref={canvasRef}
      />
    </div>
  );
}

export default App;
