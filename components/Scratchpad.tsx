
import React, { useRef, useEffect, useState } from 'react';

interface ScratchpadProps {
  onClose: () => void;
  onSubmit: (dataUrl: string) => void;
}

const Scratchpad: React.FC<ScratchpadProps> = ({ onClose, onSubmit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Set a white background
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.lineCap = 'round';
    context.strokeStyle = 'black';
    context.lineWidth = 3;
  }, []);

  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = nativeEvent;
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const stopDrawing = () => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    context.closePath();
    setIsDrawing(false);
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSubmit = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onSubmit(dataUrl);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
        <h3 className="text-xl font-bold mb-4">Digital Scratchpad</h3>
        <canvas
          ref={canvasRef}
          width={500}
          height={400}
          className="border border-gray-300 rounded-md bg-white cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onMouseMove={draw}
        />
        <div className="mt-4 flex gap-4">
          <button onClick={handleClear} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Clear</button>
          <button onClick={onClose} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600">Submit Work</button>
        </div>
      </div>
    </div>
  );
};

export default Scratchpad;
