import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Ellipse, Line, Text, Transformer } from "react-konva";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";
import WhiteboardToolbar from "./WhiteboardToolbar";
import { getWorkspaceDocument, saveWorkspaceDocument } from "../data/workspaceStore";
import { getCurrentUserName } from "../data/currentUser";
import "./Whiteboard.css";

const createShapeId = () => Date.now() + Math.random();

function Whiteboard({ workspaceId, roomId, onActivity }) {
  const containerRef = useRef(null);
  const transformerRef = useRef(null);
  const savedWhiteboard = getWorkspaceDocument(workspaceId).whiteboardState || {};

  const [size, setSize] = useState({ width: 500, height: 500 });
  const [selectedTool, setSelectedTool] = useState("select");
  const [rectangles, setRectangles] = useState(savedWhiteboard.rectangles || []);
  const [circles, setCircles] = useState(savedWhiteboard.circles || []);
  const [lines, setLines] = useState(savedWhiteboard.lines || []);
  const [freehandLines, setFreehandLines] = useState(savedWhiteboard.freehandLines || []);
  const [texts, setTexts] = useState(savedWhiteboard.texts || []);
  const [selectedObject, setSelectedObject] = useState(null);
  const [newRectangle, setNewRectangle] = useState(null);
  const [newCircle, setNewCircle] = useState(null);
  const [newLine, setNewLine] = useState(null);
  const [newFreehandLine, setNewFreehandLine] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [remoteCursors, setRemoteCursors] = useState({});

  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const yShapesRef = useRef(null);

  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new SocketIOProvider("http://localhost:5001", `whiteboard-${roomId || workspaceId || "default"}`, ydoc, { autoConnect: true });
    const yShapes = ydoc.getArray("shapes");
    ydocRef.current = ydoc;
    providerRef.current = provider;
    yShapesRef.current = yShapes;

    const applyRemoteShapes = () => {
      const all = yShapes.toArray();
      setRectangles(all.filter((s) => s.type === "rectangle"));
      setCircles(all.filter((s) => s.type === "circle"));
      setLines(all.filter((s) => s.type === "line"));
      setFreehandLines(all.filter((s) => s.type === "freehand"));
      setTexts(all.filter((s) => s.type === "text"));
    };
    yShapes.observe(applyRemoteShapes);

    provider.on("sync", (isSynced) => {
      if (isSynced && yShapes.length === 0) {
        const local = [
          ...rectangles.map((s) => ({ ...s, type: "rectangle" })),
          ...circles.map((s) => ({ ...s, type: "circle" })),
          ...lines.map((s) => ({ ...s, type: "line" })),
          ...freehandLines.map((s) => ({ ...s, type: "freehand" })),
          ...texts.map((s) => ({ ...s, type: "text" })),
        ];
        if (local.length > 0) yShapes.push(local);
      }
    });

    const awareness = provider.awareness;
    const userName = getCurrentUserName() || "Anonymous";
    const userColor = `hsl(${Math.abs(userName.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % 360}, 70%, 55%)`;
    awareness.setLocalStateField("user", { name: userName, color: userColor });

    const handleAwarenessChange = () => {
      const states = awareness.getStates();
      const cursors = {};
      states.forEach((state, clientId) => {
        if (clientId === awareness.clientID) return;
        if (state.cursor) {
          cursors[clientId] = { ...state.cursor, name: state.user?.name || "Anonymous", color: state.user?.color || "#888" };
        }
      });
      setRemoteCursors(cursors);
    };
    awareness.on("change", handleAwarenessChange);

    return () => {
      yShapes.unobserve(applyRemoteShapes);
      awareness.off("change", handleAwarenessChange);
      provider.disconnect();
      ydoc.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const pushShapeToYjs = (type, shape) => yShapesRef.current?.push([{ ...shape, type }]);

  const updateShapeInYjs = (id, updates) => {
    const yShapes = yShapesRef.current;
    if (!yShapes) return;
    const index = yShapes.toArray().findIndex((s) => s.id === id);
    if (index === -1) return;
    const existing = yShapes.get(index);
    yShapes.delete(index, 1);
    yShapes.insert(index, [{ ...existing, ...updates }]);
  };

  const deleteShapeFromYjs = (id) => {
    const yShapes = yShapesRef.current;
    if (!yShapes) return;
    const index = yShapes.toArray().findIndex((s) => s.id === id);
    if (index !== -1) yShapes.delete(index, 1);
  };

  const clearShapesInYjs = () => yShapesRef.current?.delete(0, yShapesRef.current.length);

  const saveToHistory = (r, c, l, f, t) => {
    const newState = { rectangles: r, circles: c, lines: l, freehandLines: f, texts: t };
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), newState]);
    setHistoryIndex((prev) => prev + 1);
  };

  const handleSave = () => {
    saveWorkspaceDocument(workspaceId, {
      whiteboard: [...rectangles, ...circles, ...lines, ...freehandLines, ...texts],
      whiteboardState: { rectangles, circles, lines, freehandLines, texts },
    });
    onActivity("Saved the whiteboard", "whiteboard");
  };

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    const node = selectedTool === "select" && selectedObject ? transformer.getStage()?.findOne(`#${selectedObject}`) : null;
    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [selectedObject, selectedTool, rectangles, circles, lines, freehandLines, texts]);

  useEffect(() => {
    const updateSize = () => containerRef.current && setSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleMouseDown = (event) => {
    if (selectedTool === "select" || selectedTool === "eraser") return;
    const stage = event.target.getStage();
    const p = stage.getPointerPosition();

    if (selectedTool === "rectangle") setNewRectangle({ x: p.x, y: p.y, width: 0, height: 0 });
    if (selectedTool === "circle") setNewCircle({ x: p.x, y: p.y, radiusX: 0, radiusY: 0 });
    if (selectedTool === "line") setNewLine({ points: [p.x, p.y, p.x, p.y] });
    if (selectedTool === "pen") setNewFreehandLine({ points: [p.x, p.y] });

    if (selectedTool === "text") {
      const userText = window.prompt("Enter your text:");
      if (userText && userText.trim() !== "") {
        const newText = { id: createShapeId(), x: p.x, y: p.y, text: userText, fontSize: 20 };
        const updated = [...texts, newText];
        setTexts(updated);
        pushShapeToYjs("text", newText);
        saveToHistory(rectangles, circles, lines, freehandLines, updated);
      }
    }
  };

  const handleCanvasClick = (event) => {
    if (selectedTool === "eraser") return handleErase(event);
    if (selectedTool !== "select") return;
    const target = event.target;
    setSelectedObject(target === target.getStage() ? null : target.id() || null);
  };

  const handleTransformEnd = (event) => {
    const node = event.target;
    const id = Number(node.id());
    const type = node.name();
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const x = node.x();
    const y = node.y();

    if (type === "rectangle") {
      const updated = rectangles.map((i) => i.id === id ? { ...i, x, y, width: Math.max(8, i.width * scaleX), height: Math.max(8, i.height * scaleY) } : i);
      node.scale({ x: 1, y: 1 });
      setRectangles(updated);
      const c = updated.find((i) => i.id === id);
      if (c) updateShapeInYjs(id, { x: c.x, y: c.y, width: c.width, height: c.height });
      saveToHistory(updated, circles, lines, freehandLines, texts);
    }
    if (type === "circle") {
      const updated = circles.map((i) => i.id === id ? { ...i, x, y, radiusX: Math.max(6, i.radiusX * scaleX), radiusY: Math.max(6, i.radiusY * scaleY) } : i);
      node.scale({ x: 1, y: 1 });
      setCircles(updated);
      const c = updated.find((i) => i.id === id);
      if (c) updateShapeInYjs(id, { x: c.x, y: c.y, radiusX: c.radiusX, radiusY: c.radiusY });
      saveToHistory(rectangles, updated, lines, freehandLines, texts);
    }
    if (type === "text") {
      const updated = texts.map((i) => i.id === id ? { ...i, x, y, fontSize: Math.max(8, (i.fontSize || 20) * scaleY) } : i);
      node.scale({ x: 1, y: 1 });
      setTexts(updated);
      const c = updated.find((i) => i.id === id);
      if (c) updateShapeInYjs(id, { x: c.x, y: c.y, fontSize: c.fontSize });
      saveToHistory(rectangles, circles, lines, freehandLines, updated);
    }
    if (type === "line" || type === "freehand") {
      const upd = (items) => items.map((i) => i.id === id ? { ...i, x, y, points: i.points.map((pt, idx) => pt * (idx % 2 === 0 ? scaleX : scaleY)) } : i);
      const updated = type === "line" ? upd(lines) : upd(freehandLines);
      node.scale({ x: 1, y: 1 });
      const c = updated.find((i) => i.id === id);
      if (type === "line") {
        setLines(updated);
        if (c) updateShapeInYjs(id, { x: c.x, y: c.y, points: c.points });
        saveToHistory(rectangles, circles, updated, freehandLines, texts);
      } else {
        setFreehandLines(updated);
        if (c) updateShapeInYjs(id, { x: c.x, y: c.y, points: c.points });
        saveToHistory(rectangles, circles, lines, updated, texts);
      }
    }
  };

  const handleMouseMove = (event) => {
    const stageForCursor = event.target.getStage();
    const cursorPos = stageForCursor?.getPointerPosition();
    if (cursorPos && providerRef.current) {
      providerRef.current.awareness.setLocalStateField("cursor", { x: cursorPos.x, y: cursorPos.y });
    }

    if (selectedTool === "select" || selectedTool === "eraser") return;
    const p = cursorPos;
    if (!p) return;

    if (newRectangle) setNewRectangle({ ...newRectangle, width: p.x - newRectangle.x, height: p.y - newRectangle.y });
    if (newCircle) setNewCircle({ ...newCircle, radiusX: Math.abs(p.x - newCircle.x), radiusY: Math.abs(p.y - newCircle.y) });
    if (newLine) setNewLine({ points: [newLine.points[0], newLine.points[1], p.x, p.y] });
    if (newFreehandLine) setNewFreehandLine({ ...newFreehandLine, points: [...newFreehandLine.points, p.x, p.y] });
  };

  const handleMouseUp = () => {
    if (selectedTool === "select" || selectedTool === "eraser") return;

    if (newRectangle) {
      const obj = { ...newRectangle, id: createShapeId() };
      const updated = [...rectangles, obj];
      setRectangles(updated);
      pushShapeToYjs("rectangle", obj);
      saveToHistory(updated, circles, lines, freehandLines, texts);
      setNewRectangle(null);
    }
    if (newCircle) {
      const obj = { ...newCircle, id: createShapeId() };
      const updated = [...circles, obj];
      setCircles(updated);
      pushShapeToYjs("circle", obj);
      saveToHistory(rectangles, updated, lines, freehandLines, texts);
      setNewCircle(null);
    }
    if (newLine) {
      const obj = { ...newLine, x: 0, y: 0, id: createShapeId() };
      const updated = [...lines, obj];
      setLines(updated);
      pushShapeToYjs("line", obj);
      saveToHistory(rectangles, circles, updated, freehandLines, texts);
      setNewLine(null);
    }
    if (newFreehandLine) {
      const obj = { ...newFreehandLine, x: 0, y: 0, id: createShapeId() };
      const updated = [...freehandLines, obj];
      setFreehandLines(updated);
      pushShapeToYjs("freehand", obj);
      saveToHistory(rectangles, circles, lines, updated, texts);
      setNewFreehandLine(null);
    }
  };

  const handleRectangleDrag = (e, id) => setRectangles((prev) => prev.map((i) => i.id === id ? { ...i, x: e.target.x(), y: e.target.y() } : i));
  const handleRectangleDragEnd = (e, id) => {
    const x = e.target.x(), y = e.target.y();
    const updated = rectangles.map((i) => i.id === id ? { ...i, x, y } : i);
    setRectangles(updated);
    updateShapeInYjs(id, { x, y });
    saveToHistory(updated, circles, lines, freehandLines, texts);
  };

  const handleCircleDrag = (e, id) => setCircles((prev) => prev.map((i) => i.id === id ? { ...i, x: e.target.x(), y: e.target.y() } : i));
  const handleCircleDragEnd = (e, id) => {
    const x = e.target.x(), y = e.target.y();
    const updated = circles.map((i) => i.id === id ? { ...i, x, y } : i);
    setCircles(updated);
    updateShapeInYjs(id, { x, y });
    saveToHistory(rectangles, updated, lines, freehandLines, texts);
  };

  const handleLineDrag = (e, id) => setLines((prev) => prev.map((i) => i.id === id ? { ...i, x: e.target.x(), y: e.target.y() } : i));
  const handleLineDragEnd = (e, id) => {
    const x = e.target.x(), y = e.target.y();
    const updated = lines.map((i) => i.id === id ? { ...i, x, y } : i);
    setLines(updated);
    updateShapeInYjs(id, { x, y });
    saveToHistory(rectangles, circles, updated, freehandLines, texts);
  };

  const handleFreehandDrag = (e, id) => setFreehandLines((prev) => prev.map((i) => i.id === id ? { ...i, x: e.target.x(), y: e.target.y() } : i));
  const handleFreehandDragEnd = (e, id) => {
    const x = e.target.x(), y = e.target.y();
    const updated = freehandLines.map((i) => i.id === id ? { ...i, x, y } : i);
    setFreehandLines(updated);
    updateShapeInYjs(id, { x, y });
    saveToHistory(rectangles, circles, lines, updated, texts);
  };

  const handleTextDrag = (e, id) => setTexts((prev) => prev.map((i) => i.id === id ? { ...i, x: e.target.x(), y: e.target.y() } : i));
  const handleTextDragEnd = (e, id) => {
    const x = e.target.x(), y = e.target.y();
    const updated = texts.map((i) => i.id === id ? { ...i, x, y } : i);
    setTexts(updated);
    updateShapeInYjs(id, { x, y });
    saveToHistory(rectangles, circles, lines, freehandLines, updated);
  };

  const handleErase = (event) => {
    if (selectedTool !== "eraser") return;
    const target = event.target;
    if (target === target.getStage()) return;
    const id = target.id();
    const type = target.name();
    if (!id || !type) return;

    let updatedRectangles = rectangles, updatedCircles = circles, updatedLines = lines, updatedFreehandLines = freehandLines, updatedTexts = texts;
    if (type === "rectangle") { updatedRectangles = rectangles.filter((i) => i.id.toString() !== id); setRectangles(updatedRectangles); }
    if (type === "circle") { updatedCircles = circles.filter((i) => i.id.toString() !== id); setCircles(updatedCircles); }
    if (type === "line") { updatedLines = lines.filter((i) => i.id.toString() !== id); setLines(updatedLines); }
    if (type === "freehand") { updatedFreehandLines = freehandLines.filter((i) => i.id.toString() !== id); setFreehandLines(updatedFreehandLines); }
    if (type === "text") { updatedTexts = texts.filter((i) => i.id.toString() !== id); setTexts(updatedTexts); }

    deleteShapeFromYjs(Number(id));
    saveToHistory(updatedRectangles, updatedCircles, updatedLines, updatedFreehandLines, updatedTexts);
  };

  const handleClear = () => {
    if (!window.confirm("Are you sure you want to clear the whiteboard?")) return;
    setRectangles([]); setCircles([]); setLines([]); setFreehandLines([]); setTexts([]);
    clearShapesInYjs();
    saveToHistory([], [], [], [], []);
  };

  const handleUndo = () => {
    if (historyIndex < 0) return;
    const prevIndex = historyIndex - 1;
    if (prevIndex < 0) {
      setRectangles([]); setCircles([]); setLines([]); setFreehandLines([]); setTexts([]);
      setHistoryIndex(-1);
      return;
    }
    const s = history[prevIndex];
    setRectangles(s.rectangles); setCircles(s.circles); setLines(s.lines); setFreehandLines(s.freehandLines); setTexts(s.texts);
    setHistoryIndex(prevIndex);
  };

  const handleRedo = () => {
    const nextIndex = historyIndex + 1;
    if (nextIndex >= history.length) return;
    const s = history[nextIndex];
    setRectangles(s.rectangles); setCircles(s.circles); setLines(s.lines); setFreehandLines(s.freehandLines); setTexts(s.texts);
    setHistoryIndex(nextIndex);
  };

  return (
    <div className="whiteboard-wrapper">
      <WhiteboardToolbar selectedTool={selectedTool} setSelectedTool={setSelectedTool} onUndo={handleUndo} onRedo={handleRedo} onClear={handleClear} onSave={handleSave} />
      <div className="whiteboard-container" ref={containerRef}>
        <Stage width={size.width} height={size.height} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onClick={handleCanvasClick}>
          <Layer>
            {rectangles.map((r, index) => (
              <Rect key={`${r.id}-${index}`} id={r.id.toString()} name="rectangle" x={r.x} y={r.y} width={r.width} height={r.height} fill="#3b82f6" stroke="#2563eb" strokeWidth={2}
                draggable={selectedTool === "select"} onDragMove={(e) => handleRectangleDrag(e, r.id)} onDragEnd={(e) => handleRectangleDragEnd(e, r.id)} onTransformEnd={handleTransformEnd} />
            ))}
            {newRectangle && <Rect x={newRectangle.x} y={newRectangle.y} width={newRectangle.width} height={newRectangle.height} fill="#93c5fd" stroke="#2563eb" strokeWidth={1} opacity={0.7} />}

            {circles.map((c, index) => (
              <Ellipse key={`${c.id}-${index}`} id={c.id.toString()} name="circle" x={c.x} y={c.y} radiusX={c.radiusX} radiusY={c.radiusY} fill="#a78bfa" stroke="#7c3aed" strokeWidth={1}
                draggable={selectedTool === "select"} onDragMove={(e) => handleCircleDrag(e, c.id)} onDragEnd={(e) => handleCircleDragEnd(e, c.id)} onTransformEnd={handleTransformEnd} />
            ))}
            {newCircle && <Ellipse x={newCircle.x} y={newCircle.y} radiusX={newCircle.radiusX} radiusY={newCircle.radiusY} fill="#c4b5fd" stroke="#7c3aed" strokeWidth={1} opacity={0.7} />}

            {lines.map((l, index) => (
              <Line key={`${l.id}-${index}`} id={l.id.toString()} name="line" x={l.x} y={l.y} points={l.points} stroke="#111827" strokeWidth={3} lineCap="round" lineJoin="round"
                draggable={selectedTool === "select"} onDragMove={(e) => handleLineDrag(e, l.id)} onDragEnd={(e) => handleLineDragEnd(e, l.id)} onTransformEnd={handleTransformEnd} />
            ))}
            {newLine && <Line points={newLine.points} stroke="#64748b" strokeWidth={3} lineCap="round" lineJoin="round" opacity={0.7} />}

            {freehandLines.map((l, index) => (
              <Line key={`${l.id}-${index}`} id={l.id.toString()} name="freehand" x={l.x} y={l.y} points={l.points} stroke="#111827" strokeWidth={3} lineCap="round" lineJoin="round" tension={0.5}
                draggable={selectedTool === "select"} onDragMove={(e) => handleFreehandDrag(e, l.id)} onDragEnd={(e) => handleFreehandDragEnd(e, l.id)} onTransformEnd={handleTransformEnd} />
            ))}
            {newFreehandLine && <Line points={newFreehandLine.points} stroke="#64748b" strokeWidth={3} lineCap="round" lineJoin="round" tension={0.5} opacity={0.7} />}

            {texts.map((t, index) => (
              <Text key={`${t.id}-${index}`} id={t.id.toString()} name="text" x={t.x} y={t.y} text={t.text} fontSize={t.fontSize || 20} fontFamily="Arial" fill="#111827"
                draggable={selectedTool === "select"} onDragMove={(e) => handleTextDrag(e, t.id)} onDragEnd={(e) => handleTextDragEnd(e, t.id)} onTransformEnd={handleTransformEnd} />
            ))}

            <Transformer ref={transformerRef} rotateEnabled={false} enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
              boundBoxFunc={(oldBox, newBox) => (newBox.width < 8 || newBox.height < 8 ? oldBox : newBox)} />

            {Object.entries(remoteCursors).map(([clientId, cursor]) => (
              <React.Fragment key={clientId}>
                <Ellipse x={cursor.x} y={cursor.y} radiusX={5} radiusY={5} fill={cursor.color} />
                <Text x={cursor.x + 8} y={cursor.y - 6} text={cursor.name} fontSize={12} fill={cursor.color} fontStyle="bold" />
              </React.Fragment>
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

export default Whiteboard;