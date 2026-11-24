import { useCallback, useEffect, useRef, useState } from "react";
import type { Stroke } from "./types/stroke";
import { socket } from "./lib/socket";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const isDrawing = useRef(false);
  const room = useRef<string | null>(null);
  const [tool, setTool] = useState<"pencil" | "eraser">("pencil");
  const [roomInput, setRoomInput] = useState("");
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null);
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

    // Resolución interna real (píxeles físicos)
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const joinRoom = () => {
    const name = roomInput.trim();
    if (!name || joinedRoom) return;
    room.current = name;
    setJoinedRoom(name);
    socket.emit("join", name);
  };

  const leaveRoom = () => {
    if (!joinedRoom) return;
    socket.emit("leave", joinedRoom);
    room.current = null;
    setJoinedRoom(null);
    strokes.current = [];
    renderCanvas();
  };

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
    isDrawing.current = true;
    const { offsetX, offsetY } = event.nativeEvent;

    strokes.current.push({
      id: crypto.getRandomValues(new Uint32Array(1))[0],
      color: tool === "eraser" ? "#FFFFFF" : color,
      width: strokeWidth,
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
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const last = strokes.current[strokes.current.length - 1];
    if (!last) return;
    socket.emit("stroke:add", last, room.current);
  }

  const btn =
    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
  const btnGhost = `${btn} text-slate-700 hover:bg-slate-100`;
  const toolBtn = (active: boolean) =>
    `${btn} ${active ? "bg-indigo-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"}`;

  return (
    <div className="flex min-h-svh flex-col items-center gap-6 pb-10">
      <header className="flex w-full items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur">
        <h1 className="bg-gradient-to-r from-indigo-600 to-fuchsia-500 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
          Excalidraw Mini
        </h1>

        <div className="flex items-center gap-3">
          {joinedRoom && (
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              {joinedRoom}
            </span>
          )}
          <input
            type="text"
            placeholder="Nombre de la room"
            value={roomInput}
            disabled={!!joinedRoom}
            onChange={(e) => setRoomInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && joinRoom()}
            className="w-48 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100 disabled:text-slate-400"
          />
          {joinedRoom ? (
            <button
              onClick={leaveRoom}
              className={`${btn} bg-rose-600 text-white hover:bg-rose-700`}
            >
              Desconectar
            </button>
          ) : (
            <button
              onClick={joinRoom}
              disabled={!roomInput.trim()}
              className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}
            >
              Conectar
            </button>
          )}
        </div>
      </header>

      <div className="z-10 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-lg shadow-slate-200/60">
        <input
          type="color"
          title="Color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded-md border border-slate-300 bg-transparent p-0.5"
        />
        <input
          type="range"
          title="Grosor"
          min={1}
          max={30}
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          className="w-32 accent-indigo-600"
        />
        <span className="min-w-10 text-sm tabular-nums text-slate-500">
          {strokeWidth}px
        </span>
        <div className="h-6 w-px bg-slate-200" />
        <button className={toolBtn(tool === "pencil")} onClick={() => setTool("pencil")}>
          Lápiz
        </button>
        <button className={toolBtn(tool === "eraser")} onClick={() => setTool("eraser")}>
          Borrador
        </button>
        <div className="h-6 w-px bg-slate-200" />
        <button className={btnGhost} onClick={undo}>
          Deshacer
        </button>
        <button
          className={`${btn} text-rose-600 hover:bg-rose-50`}
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
        className="cursor-crosshair rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-300/50"
      />
    </div>
  );
}

export default App;
