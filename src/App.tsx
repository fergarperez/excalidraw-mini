import { useCallback, useEffect, useRef } from "react";
import type { Stroke } from "./types/stroke";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const isDrawing = useRef(false);

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
    strokes.current.pop();
    renderCanvas();
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
    isDrawing.current = true;
    const { offsetX, offsetY } = event.nativeEvent;

    strokes.current.push({
      id: crypto.getRandomValues(new Uint32Array(1))[0],
      color: "#000000",
      width: 3,
      points: [{ x: offsetX, y: offsetY }],
    });

    renderCanvas();
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
    isDrawing.current = false;
  }

  return (
    <div className="App">
      <h1>Excalidraw Mini</h1>
      <div className="controls">
        <button
          onClick={undo}
          style={{ marginBottom: "8px", display: "block" }}
        >
          Deshacer
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
