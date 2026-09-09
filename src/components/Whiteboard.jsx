import { useEffect, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Rect,
  Ellipse,
  Line,
  Text,
  Transformer,
} from "react-konva";

import WhiteboardToolbar from "./WhiteboardToolbar";
import { getWorkspaceDocument, saveWorkspaceDocument } from "../data/workspaceStore";

import "./Whiteboard.css";

function Whiteboard({ workspaceId, onActivity }) {
  const containerRef = useRef(null);
  const transformerRef = useRef(null);
  const savedWhiteboard = getWorkspaceDocument(workspaceId).whiteboardState || {};

  const [size, setSize] = useState({
    width: 500,
    height: 500,
  });

  // =========================
  // SELECTED TOOL
  // =========================

  const [selectedTool, setSelectedTool] = useState("select");

  // =========================
  // OBJECTS
  // =========================

  const [rectangles, setRectangles] = useState(savedWhiteboard.rectangles || []);
  const [circles, setCircles] = useState(savedWhiteboard.circles || []);
  const [lines, setLines] = useState(savedWhiteboard.lines || []);
  const [freehandLines, setFreehandLines] = useState(savedWhiteboard.freehandLines || []);
  const [texts, setTexts] = useState(savedWhiteboard.texts || []);
  const [selectedObject, setSelectedObject] = useState(null);

  // =========================
  // DRAWING STATES
  // =========================

  const [newRectangle, setNewRectangle] = useState(null);
  const [newCircle, setNewCircle] = useState(null);
  const [newLine, setNewLine] = useState(null);
  const [newFreehandLine, setNewFreehandLine] = useState(null);

  // =========================================================
  // HISTORY
  // =========================================================

  const [history, setHistory] = useState([]);

  const [historyIndex, setHistoryIndex] = useState(-1);

  // =========================================================
  // SAVE CURRENT STATE TO HISTORY
  // =========================================================

  const saveToHistory = (
    newRectangles,
    newCircles,
    newLines,
    newFreehandLines,
    newTexts
  ) => {
    const newState = {
      rectangles: newRectangles,
      circles: newCircles,
      lines: newLines,
      freehandLines: newFreehandLines,
      texts: newTexts,
    };

    setHistory((previousHistory) => {
      const newHistory = previousHistory.slice(
        0,
        historyIndex + 1
      );

      newHistory.push(newState);

      return newHistory;
    });

    setHistoryIndex((previousIndex) => previousIndex + 1);
  };

  const handleSave = () => {
    saveWorkspaceDocument(workspaceId, { whiteboard: [
      ...rectangles,
      ...circles,
      ...lines,
      ...freehandLines,
      ...texts,
    ], whiteboardState: {
      rectangles,
      circles,
      lines,
      freehandLines,
      texts,
    } });
    onActivity("Saved the whiteboard", "whiteboard");
  };

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    const selectedNode = selectedTool === "select" && selectedObject
      ? transformer.getStage()?.findOne(`#${selectedObject}`)
      : null;
    transformer.nodes(selectedNode ? [selectedNode] : []);
    transformer.getLayer()?.batchDraw();
  }, [selectedObject, selectedTool, rectangles, circles, lines, freehandLines, texts]);

  // =========================================================
  // CANVAS SIZE
  // =========================================================

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateSize();

    window.addEventListener("resize", updateSize);

    return () => {
      window.removeEventListener(
        "resize",
        updateSize
      );
    };
  }, []);

  // =========================================================
  // MOUSE DOWN
  // =========================================================

  const handleMouseDown = (event) => {
    // SELECT
    if (selectedTool === "select") {
      return;
    }

    // ERASER
    if (selectedTool === "eraser") {
      return;
    }

    const stage = event.target.getStage();

    const pointerPosition =
      stage.getPointerPosition();

    // =========================
    // RECTANGLE
    // =========================

    if (selectedTool === "rectangle") {
      setNewRectangle({
        x: pointerPosition.x,
        y: pointerPosition.y,
        width: 0,
        height: 0,
      });
    }

    // =========================
    // CIRCLE
    // =========================

    if (selectedTool === "circle") {
      setNewCircle({
        x: pointerPosition.x,
        y: pointerPosition.y,
        radiusX: 0,
        radiusY: 0,
      });
    }

    // =========================
    // LINE
    // =========================

    if (selectedTool === "line") {
      setNewLine({
        points: [
          pointerPosition.x,
          pointerPosition.y,
          pointerPosition.x,
          pointerPosition.y,
        ],
      });
    }

    // =========================
    // PEN
    // =========================

    if (selectedTool === "pen") {
      setNewFreehandLine({
        points: [
          pointerPosition.x,
          pointerPosition.y,
        ],
      });
    }

    // =========================
    // TEXT
    // =========================

    if (selectedTool === "text") {
      const userText = window.prompt(
        "Enter your text:"
      );

      if (
        userText &&
        userText.trim() !== ""
      ) {
        const newText = {
          id: Date.now(),
          x: pointerPosition.x,
          y: pointerPosition.y,
          text: userText,
          fontSize: 20,
        };

        const updatedTexts = [
          ...texts,
          newText,
        ];

        setTexts(updatedTexts);

        saveToHistory(
          rectangles,
          circles,
          lines,
          freehandLines,
          updatedTexts
        );
      }
    }
  };

  const handleCanvasClick = (event) => {
    if (selectedTool === "eraser") {
      handleErase(event);
      return;
    }

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
      const updated = rectangles.map((item) => item.id === id ? { ...item, x, y, width: Math.max(8, item.width * scaleX), height: Math.max(8, item.height * scaleY) } : item);
      node.scale({ x: 1, y: 1 });
      setRectangles(updated);
      saveToHistory(updated, circles, lines, freehandLines, texts);
    }

    if (type === "circle") {
      const updated = circles.map((item) => item.id === id ? { ...item, x, y, radiusX: Math.max(6, item.radiusX * scaleX), radiusY: Math.max(6, item.radiusY * scaleY) } : item);
      node.scale({ x: 1, y: 1 });
      setCircles(updated);
      saveToHistory(rectangles, updated, lines, freehandLines, texts);
    }

    if (type === "text") {
      const updated = texts.map((item) => item.id === id ? { ...item, x, y, fontSize: Math.max(8, (item.fontSize || 20) * scaleY) } : item);
      node.scale({ x: 1, y: 1 });
      setTexts(updated);
      saveToHistory(rectangles, circles, lines, freehandLines, updated);
    }

    if (type === "line" || type === "freehand") {
      const updateLines = (items) => items.map((item) => item.id === id ? { ...item, x, y, points: item.points.map((point, index) => point * (index % 2 === 0 ? scaleX : scaleY)) } : item);
      const updated = type === "line" ? updateLines(lines) : updateLines(freehandLines);
      node.scale({ x: 1, y: 1 });
      if (type === "line") {
        setLines(updated);
        saveToHistory(rectangles, circles, updated, freehandLines, texts);
      } else {
        setFreehandLines(updated);
        saveToHistory(rectangles, circles, lines, updated, texts);
      }
    }
  };

  // =========================================================
  // MOUSE MOVE
  // =========================================================

  const handleMouseMove = (event) => {
    // SELECT
    if (selectedTool === "select") {
      return;
    }

    // ERASER
    if (selectedTool === "eraser") {
      return;
    }

    const stage = event.target.getStage();

    const pointerPosition =
      stage.getPointerPosition();

    // =========================
    // RECTANGLE
    // =========================

    if (newRectangle) {
      setNewRectangle({
        ...newRectangle,
        width:
          pointerPosition.x -
          newRectangle.x,
        height:
          pointerPosition.y -
          newRectangle.y,
      });
    }

    // =========================
    // CIRCLE
    // =========================

    if (newCircle) {
      setNewCircle({
        ...newCircle,
        radiusX: Math.abs(
          pointerPosition.x -
            newCircle.x
        ),
        radiusY: Math.abs(
          pointerPosition.y -
            newCircle.y
        ),
      });
    }

    // =========================
    // LINE
    // =========================

    if (newLine) {
      setNewLine({
        points: [
          newLine.points[0],
          newLine.points[1],
          pointerPosition.x,
          pointerPosition.y,
        ],
      });
    }

    // =========================
    // PEN
    // =========================

    if (newFreehandLine) {
      setNewFreehandLine({
        ...newFreehandLine,
        points: [
          ...newFreehandLine.points,
          pointerPosition.x,
          pointerPosition.y,
        ],
      });
    }
  };

  // =========================================================
  // MOUSE UP
  // =========================================================

  const handleMouseUp = () => {
    // SELECT
    if (selectedTool === "select") {
      return;
    }

    // ERASER
    if (selectedTool === "eraser") {
      return;
    }

    // =========================
    // RECTANGLE
    // =========================

    if (newRectangle) {
      const newObject = {
        ...newRectangle,
        id: Date.now(),
      };

      const updatedRectangles = [
        ...rectangles,
        newObject,
      ];

      setRectangles(updatedRectangles);

      saveToHistory(
        updatedRectangles,
        circles,
        lines,
        freehandLines,
        texts
      );

      setNewRectangle(null);
    }

    // =========================
    // CIRCLE
    // =========================

    if (newCircle) {
      const newObject = {
        ...newCircle,
        id: Date.now(),
      };

      const updatedCircles = [
        ...circles,
        newObject,
      ];

      setCircles(updatedCircles);

      saveToHistory(
        rectangles,
        updatedCircles,
        lines,
        freehandLines,
        texts
      );

      setNewCircle(null);
    }

    // =========================
    // LINE
    // =========================

    if (newLine) {
      const newObject = {
        ...newLine,
        x: 0,
        y: 0,
        id: Date.now(),
      };

      const updatedLines = [
        ...lines,
        newObject,
      ];

      setLines(updatedLines);

      saveToHistory(
        rectangles,
        circles,
        updatedLines,
        freehandLines,
        texts
      );

      setNewLine(null);
    }

    // =========================
    // PEN
    // =========================

    if (newFreehandLine) {
      const newObject = {
        ...newFreehandLine,
        x: 0,
        y: 0,
        id: Date.now(),
      };

      const updatedFreehandLines = [
        ...freehandLines,
        newObject,
      ];

      setFreehandLines(
        updatedFreehandLines
      );

      saveToHistory(
        rectangles,
        circles,
        lines,
        updatedFreehandLines,
        texts
      );

      setNewFreehandLine(null);
    }
  };

  // =========================================================
  // RECTANGLE MOVE
  // =========================================================

  const handleRectangleDrag = (
    event,
    rectangleId
  ) => {
    const newX = event.target.x();
    const newY = event.target.y();

    setRectangles((previousRectangles) =>
      previousRectangles.map((item) =>
        item.id === rectangleId
          ? {
              ...item,
              x: newX,
              y: newY,
            }
          : item
      )
    );
  };

  // =========================================================
  // RECTANGLE DRAG END
  // =========================================================

  const handleRectangleDragEnd = (
    event,
    rectangleId
  ) => {
    const newX = event.target.x();
    const newY = event.target.y();

    const updatedRectangles =
      rectangles.map((item) =>
        item.id === rectangleId
          ? {
              ...item,
              x: newX,
              y: newY,
            }
          : item
      );

    setRectangles(updatedRectangles);

    saveToHistory(
      updatedRectangles,
      circles,
      lines,
      freehandLines,
      texts
    );
  };

  // =========================================================
  // CIRCLE MOVE
  // =========================================================

  const handleCircleDrag = (
    event,
    circleId
  ) => {
    const newX = event.target.x();
    const newY = event.target.y();

    setCircles((previousCircles) =>
      previousCircles.map((item) =>
        item.id === circleId
          ? {
              ...item,
              x: newX,
              y: newY,
            }
          : item
      )
    );
  };

  const handleCircleDragEnd = (
    event,
    circleId
  ) => {
    const newX = event.target.x();
    const newY = event.target.y();

    const updatedCircles =
      circles.map((item) =>
        item.id === circleId
          ? {
              ...item,
              x: newX,
              y: newY,
            }
          : item
      );

    setCircles(updatedCircles);

    saveToHistory(
      rectangles,
      updatedCircles,
      lines,
      freehandLines,
      texts
    );
  };

  // =========================================================
  // LINE MOVE
  // =========================================================

  const handleLineDrag = (
    event,
    lineId
  ) => {
    const newX = event.target.x();
    const newY = event.target.y();

    setLines((previousLines) =>
      previousLines.map((item) =>
        item.id === lineId
          ? {
              ...item,
              x: newX,
              y: newY,
            }
          : item
      )
    );
  };

  const handleLineDragEnd = (
    event,
    lineId
  ) => {
    const newX = event.target.x();
    const newY = event.target.y();

    const updatedLines =
      lines.map((item) =>
        item.id === lineId
          ? {
              ...item,
              x: newX,
              y: newY,
            }
          : item
      );

    setLines(updatedLines);

    saveToHistory(
      rectangles,
      circles,
      updatedLines,
      freehandLines,
      texts
    );
  };

  // =========================================================
  // FREEHAND MOVE
  // =========================================================

  const handleFreehandDrag = (
    event,
    lineId
  ) => {
    const newX = event.target.x();
    const newY = event.target.y();

    setFreehandLines((previousLines) =>
      previousLines.map((item) =>
        item.id === lineId
          ? {
              ...item,
              x: newX,
              y: newY,
            }
          : item
      )
    );
  };

  const handleFreehandDragEnd = (
    event,
    lineId
  ) => {
    const newX = event.target.x();
    const newY = event.target.y();

    const updatedFreehandLines =
      freehandLines.map((item) =>
        item.id === lineId
          ? {
              ...item,
              x: newX,
              y: newY,
            }
          : item
      );

    setFreehandLines(
      updatedFreehandLines
    );

    saveToHistory(
      rectangles,
      circles,
      lines,
      updatedFreehandLines,
      texts
    );
  };

  // =========================================================
  // TEXT MOVE
  // =========================================================

  const handleTextDrag = (
    event,
    textId
  ) => {
    const newX = event.target.x();
    const newY = event.target.y();

    setTexts((previousTexts) =>
      previousTexts.map((item) =>
        item.id === textId
          ? {
              ...item,
              x: newX,
              y: newY,
            }
          : item
      )
    );
  };

  const handleTextDragEnd = (
    event,
    textId
  ) => {
    const newX = event.target.x();
    const newY = event.target.y();

    const updatedTexts =
      texts.map((item) =>
        item.id === textId
          ? {
              ...item,
              x: newX,
              y: newY,
            }
          : item
      );

    setTexts(updatedTexts);

    saveToHistory(
      rectangles,
      circles,
      lines,
      freehandLines,
      updatedTexts
    );
  };

  // =========================================================
  // ERASER
  // =========================================================

  const handleErase = (event) => {
    if (selectedTool !== "eraser") {
      return;
    }

    const target = event.target;

    // Don't erase the Stage
    if (target === target.getStage()) {
      return;
    }

    const id = target.id();
    const type = target.name();

    if (!id || !type) {
      return;
    }

    let updatedRectangles = rectangles;
    let updatedCircles = circles;
    let updatedLines = lines;
    let updatedFreehandLines =
      freehandLines;
    let updatedTexts = texts;

    // Rectangle
    if (type === "rectangle") {
      updatedRectangles =
        rectangles.filter(
          (item) =>
            item.id.toString() !== id
        );

      setRectangles(
        updatedRectangles
      );
    }

    // Circle
    if (type === "circle") {
      updatedCircles =
        circles.filter(
          (item) =>
            item.id.toString() !== id
        );

      setCircles(updatedCircles);
    }

    // Line
    if (type === "line") {
      updatedLines =
        lines.filter(
          (item) =>
            item.id.toString() !== id
        );

      setLines(updatedLines);
    }

    // Freehand
    if (type === "freehand") {
      updatedFreehandLines =
        freehandLines.filter(
          (item) =>
            item.id.toString() !== id
        );

      setFreehandLines(
        updatedFreehandLines
      );
    }

    // Text
    if (type === "text") {
      updatedTexts =
        texts.filter(
          (item) =>
            item.id.toString() !== id
        );

      setTexts(updatedTexts);
    }

    // Save deleted state
    saveToHistory(
      updatedRectangles,
      updatedCircles,
      updatedLines,
      updatedFreehandLines,
      updatedTexts
    );
  };

  // =========================================================
  // CLEAR
  // =========================================================

  const handleClear = () => {
    const confirmClear =
      window.confirm(
        "Are you sure you want to clear the whiteboard?"
      );

    if (!confirmClear) {
      return;
    }

    setRectangles([]);
    setCircles([]);
    setLines([]);
    setFreehandLines([]);
    setTexts([]);

    saveToHistory(
      [],
      [],
      [],
      [],
      []
    );
  };

  // =========================================================
  // UNDO
  // =========================================================

  const handleUndo = () => {
    if (historyIndex < 0) {
      return;
    }

    const previousIndex =
      historyIndex - 1;

    if (previousIndex < 0) {
      setRectangles([]);
      setCircles([]);
      setLines([]);
      setFreehandLines([]);
      setTexts([]);

      setHistoryIndex(-1);

      return;
    }

    const previousState =
      history[previousIndex];

    setRectangles(
      previousState.rectangles
    );

    setCircles(
      previousState.circles
    );

    setLines(
      previousState.lines
    );

    setFreehandLines(
      previousState.freehandLines
    );

    setTexts(
      previousState.texts
    );

    setHistoryIndex(
      previousIndex
    );
  };

  // =========================================================
  // REDO
  // =========================================================

  const handleRedo = () => {
    const nextIndex =
      historyIndex + 1;

    if (
      nextIndex >= history.length
    ) {
      return;
    }

    const nextState =
      history[nextIndex];

    setRectangles(
      nextState.rectangles
    );

    setCircles(
      nextState.circles
    );

    setLines(
      nextState.lines
    );

    setFreehandLines(
      nextState.freehandLines
    );

    setTexts(
      nextState.texts
    );

    setHistoryIndex(
      nextIndex
    );
  };

  return (
    <div className="whiteboard-wrapper">

      {/* =========================
          TOOLBAR
      ========================= */}

      <WhiteboardToolbar
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onSave={handleSave}
      />

      {/* =========================
          WHITEBOARD
      ========================= */}

      <div
        className="whiteboard-container"
        ref={containerRef}
      >
        <Stage
          width={size.width}
          height={size.height}

          onMouseDown={
            handleMouseDown
          }

          onMouseMove={
            handleMouseMove
          }

          onMouseUp={
            handleMouseUp
          }

          onClick={handleCanvasClick}
        >
          <Layer>

            {/* ==================================================
                RECTANGLES
            ================================================== */}

            {rectangles.map(
              (rectangle) => (
                <Rect
                  key={rectangle.id}

                  id={rectangle.id.toString()}
                  name="rectangle"

                  x={rectangle.x}
                  y={rectangle.y}

                  width={
                    rectangle.width
                  }
                  height={
                    rectangle.height
                  }

                  fill="#3b82f6"
                  stroke="#2563eb"
                  strokeWidth={2}

                  draggable={
                    selectedTool ===
                    "select"
                  }

                  onDragMove={(
                    event
                  ) =>
                    handleRectangleDrag(
                      event,
                      rectangle.id
                    )
                  }

                  onDragEnd={(
                    event
                  ) =>
                    handleRectangleDragEnd(
                      event,
                      rectangle.id
                    )
                  }
                  onTransformEnd={handleTransformEnd}
                />
              )
            )}

            {newRectangle && (
              <Rect
                x={newRectangle.x}
                y={newRectangle.y}
                width={
                  newRectangle.width
                }
                height={
                  newRectangle.height
                }
                fill="#93c5fd"
                stroke="#2563eb"
                strokeWidth={1}
                opacity={0.7}
              />
            )}

            {/* ==================================================
                CIRCLES
            ================================================== */}

            {circles.map(
              (circle) => (
                <Ellipse
                  key={circle.id}

                  id={circle.id.toString()}
                  name="circle"

                  x={circle.x}
                  y={circle.y}

                  radiusX={
                    circle.radiusX
                  }
                  radiusY={
                    circle.radiusY
                  }

                  fill="#a78bfa"
                  stroke="#7c3aed"
                  strokeWidth={1}

                  draggable={
                    selectedTool ===
                    "select"
                  }

                  onDragMove={(
                    event
                  ) =>
                    handleCircleDrag(
                      event,
                      circle.id
                    )
                  }

                  onDragEnd={(
                    event
                  ) =>
                    handleCircleDragEnd(
                      event,
                      circle.id
                    )
                  }
                  onTransformEnd={handleTransformEnd}
                />
              )
            )}

            {newCircle && (
              <Ellipse
                x={newCircle.x}
                y={newCircle.y}
                radiusX={
                  newCircle.radiusX
                }
                radiusY={
                  newCircle.radiusY
                }
                fill="#c4b5fd"
                stroke="#7c3aed"
                strokeWidth={1}
                opacity={0.7}
              />
            )}

            {/* ==================================================
                LINES
            ================================================== */}

            {lines.map(
              (line) => (
                <Line
                  key={line.id}

                  id={line.id.toString()}
                  name="line"

                  x={line.x}
                  y={line.y}

                  points={
                    line.points
                  }

                  stroke="#111827"
                  strokeWidth={3}

                  lineCap="round"
                  lineJoin="round"

                  draggable={
                    selectedTool ===
                    "select"
                  }

                  onDragMove={(
                    event
                  ) =>
                    handleLineDrag(
                      event,
                      line.id
                    )
                  }

                  onDragEnd={(
                    event
                  ) =>
                    handleLineDragEnd(
                      event,
                      line.id
                    )
                  }
                  onTransformEnd={handleTransformEnd}
                />
              )
            )}

            {newLine && (
              <Line
                points={
                  newLine.points
                }
                stroke="#64748b"
                strokeWidth={3}
                lineCap="round"
                lineJoin="round"
                opacity={0.7}
              />
            )}

            {/* ==================================================
                FREEHAND
            ================================================== */}

            {freehandLines.map(
              (line) => (
                <Line
                  key={line.id}

                  id={line.id.toString()}
                  name="freehand"

                  x={line.x}
                  y={line.y}

                  points={
                    line.points
                  }

                  stroke="#111827"
                  strokeWidth={3}

                  lineCap="round"
                  lineJoin="round"

                  tension={0.5}

                  draggable={
                    selectedTool ===
                    "select"
                  }

                  onDragMove={(
                    event
                  ) =>
                    handleFreehandDrag(
                      event,
                      line.id
                    )
                  }

                  onDragEnd={(
                    event
                  ) =>
                    handleFreehandDragEnd(
                      event,
                      line.id
                    )
                  }
                  onTransformEnd={handleTransformEnd}
                />
              )
            )}

            {newFreehandLine && (
              <Line
                points={
                  newFreehandLine.points
                }
                stroke="#64748b"
                strokeWidth={3}
                lineCap="round"
                lineJoin="round"
                tension={0.5}
                opacity={0.7}
              />
            )}

            {/* ==================================================
                TEXT
            ================================================== */}

            {texts.map(
              (item) => (
                <Text
                  key={item.id}

                  id={item.id.toString()}
                  name="text"

                  x={item.x}
                  y={item.y}

                  text={item.text}

                  fontSize={item.fontSize || 20}
                  fontFamily="Arial"

                  fill="#111827"

                  draggable={
                    selectedTool ===
                    "select"
                  }

                  onDragMove={(
                    event
                  ) =>
                    handleTextDrag(
                      event,
                      item.id
                    )
                  }

                  onDragEnd={(
                    event
                  ) =>
                    handleTextDragEnd(
                      event,
                      item.id
                    )
                  }
                  onTransformEnd={handleTransformEnd}
                />
              )
            )}

            <Transformer
              ref={transformerRef}
              rotateEnabled={false}
              enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
              boundBoxFunc={(oldBox, newBox) => (
                newBox.width < 8 || newBox.height < 8 ? oldBox : newBox
              )}
            />

          </Layer>
        </Stage>
      </div>
    </div>
  );
}

export default Whiteboard;