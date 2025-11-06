import React, { useRef, useState, useEffect } from 'react';
import './DrawingCanvas.css';

function DrawingCanvas({ prompt, onSubmit }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (e) e.preventDefault();
    setIsDrawing(false);
  };

  const handleClear = () => {
    if (showClearConfirm) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  };

  const handleSubmit = () => {
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL('image/png');
    onSubmit(imageData);
  };

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', 
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'
  ];

  return (
    <div className="drawing-container">
      <div className="drawing-card">
        <div className="prompt-section">
          <h2>Draw this:</h2>
          <div className="prompt-box">{prompt}</div>
        </div>

        <div className="canvas-wrapper">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="drawing-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{ touchAction: 'none' }}
          />
        </div>

        <div className="drawing-controls">
          <div className="color-picker">
            <label>Color:</label>
            <div className="color-options">
              {colors.map((c) => (
                <button
                  key={c}
                  className={`color-btn ${color === c ? 'active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  title={c}
                />
              ))}
            </div>
          </div>

          <div className="brush-size">
            <label>Brush Size: {brushSize}px</label>
            <input
              type="range"
              min="2"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
            />
          </div>

          <div className="drawing-actions">
            <button
              className="btn-clear"
              onClick={handleClear}
            >
              {showClearConfirm ? 'Click again to clear' : 'Clear'}
            </button>
            <button
              className="btn-submit"
              onClick={handleSubmit}
            >
              Submit Drawing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DrawingCanvas;

