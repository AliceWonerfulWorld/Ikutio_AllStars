"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Home, 
  Download, 
  Trash2, 
  Palette, 
  Undo, 
  Redo, 
  Brush,
  Sparkles,
  Layers,
  Settings,
  Save,
  RotateCcw,
  RotateCw
} from "lucide-react";

interface Point {
  x: number;
  y: number;
  color: string;
  size: number;
}

interface DrawingAction {
  type: 'draw' | 'clear';
  points?: Point[];
  timestamp: number;
}

export default function ReactionsPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState("#FF6B6B");
  const [brushSize, setBrushSize] = useState(10);
  const [history, setHistory] = useState<DrawingAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeTool, setActiveTool] = useState<'brush' | 'eraser'>('brush');

  // より豊富な色の選択肢（グラデーション風）
  const colorPalettes = {
    vibrant: [
      "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
      "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9"
    ],
    pastel: [
      "#FFB3BA", "#FFDFBA", "#FFFFBA", "#BAFFC9", "#BAE1FF",
      "#E6B3FF", "#FFB3E6", "#B3FFE6", "#FFE6B3", "#E6FFB3"
    ],
    monochrome: [
      "#000000", "#333333", "#666666", "#999999", "#CCCCCC",
      "#FFFFFF", "#2C2C2C", "#4A4A4A", "#707070", "#A0A0A0"
    ],
    nature: [
      "#8B4513", "#228B22", "#32CD32", "#87CEEB", "#F0E68C",
      "#D2691E", "#2E8B57", "#20B2AA", "#FFA500", "#DC143C"
    ]
  } as const;

  const [selectedPalette, setSelectedPalette] = useState<keyof typeof colorPalettes>('vibrant');

  // ブラシサイズの選択肢
  const brushSizes = [
    { size: 3, label: "細い", icon: "•" },
    { size: 8, label: "中", icon: "●" },
    { size: 15, label: "太い", icon: "●" },
    { size: 25, label: "極太", icon: "●" },
    { size: 40, label: "特大", icon: "●" }
  ] as const;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // キャンバスを白で初期化
    ctx.fillStyle = "rgb(255,255,255)";
    ctx.fillRect(0, 0, 800, 600);
    ctx.strokeStyle = "#E5E7EB";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 800, 600);

    // 初期状態を履歴に追加
    const initialAction: DrawingAction = {
      type: 'clear',
      timestamp: Date.now()
    };
    setHistory([initialAction]);
    setHistoryIndex(0);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    drawPoint(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    drawPoint(x, y);
  };

  const drawPoint = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (activeTool === 'eraser') {
      // 消しゴム機能：白い円で描画して消去
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();
      ctx.globalCompositeOperation = 'source-over'; // 通常の描画モードに戻す
    } else {
      // ブラシ機能：通常の描画
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = currentColor;
      ctx.fill();
      ctx.closePath();
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  };

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const newAction: DrawingAction = {
      type: 'draw',
      timestamp: Date.now()
    };

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAction);
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "rgb(255,255,255)";
    ctx.fillRect(0, 0, 800, 600);
    ctx.strokeStyle = "#E5E7EB";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 800, 600);

    const clearAction: DrawingAction = {
      type: 'clear',
      timestamp: Date.now()
    };
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(clearAction);
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      restoreFromHistory(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      restoreFromHistory(historyIndex + 1);
    }
  };

  const restoreFromHistory = (index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "rgb(255,255,255)";
    ctx.fillRect(0, 0, 800, 600);
    ctx.strokeStyle = "#E5E7EB";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 800, 600);
  };

  const saveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png", 1.0);
    link.download = `reaction-${Date.now()}.png`;
    link.click();
  };

  const handleColorChange = (color: string) => {
    setCurrentColor(color);
    setShowColorPicker(false);
  };

  const handleBrushSizeChange = (size: number) => {
    setBrushSize(size);
  };

  const handleToolChange = (tool: 'brush' | 'eraser') => {
    setActiveTool(tool);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white relative overflow-hidden">
      {/* 背景装飾 */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23FFFFFF%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => router.push("/")}
              className="group flex items-center space-x-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-gray-500/25 border border-gray-600"
            >
              <Home size={20} className="group-hover:rotate-12 transition-transform duration-300" />
              <span className="font-semibold">ホームに戻る</span>
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl shadow-lg border border-gray-600">
                <Sparkles size={24} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-300 to-white bg-clip-text text-transparent">
                クリエイティブスタジオ
              </h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* メインキャンバスエリア */}
          <div className="xl:col-span-3">
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700 shadow-2xl">
              <div className="bg-white rounded-xl p-4 shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  className={`w-full h-auto border border-gray-200 rounded-lg shadow-lg ${
                    activeTool === 'eraser' ? 'cursor-crosshair' : 'cursor-crosshair'
                  }`}
                  style={{
                    cursor: activeTool === 'eraser' ? 'crosshair' : 'crosshair'
                  }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
              </div>
            </div>
          </div>

          {/* ツールパネル */}
          <div className="xl:col-span-1 space-y-6">
            {/* ツール選択 */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700 shadow-xl">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
                <Layers size={20} className="mr-2" />
                ツール
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleToolChange('brush')}
                  className={`p-4 rounded-xl transition-all duration-300 ${
                    activeTool === 'brush'
                      ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg scale-105 border border-gray-500'
                      : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white border border-gray-700'
                  }`}
                >
                  <Brush size={24} className="mx-auto mb-2" />
                  <span className="text-sm font-medium">ブラシ</span>
                </button>
                <button
                  onClick={() => handleToolChange('eraser')}
                  className={`p-4 rounded-xl transition-all duration-300 ${
                    activeTool === 'eraser'
                      ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg scale-105 border border-gray-500'
                      : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white border border-gray-700'
                  }`}
                >
                  <Trash2 size={24} className="mx-auto mb-2" />
                  <span className="text-sm font-medium">消しゴム</span>
                </button>
              </div>
            </div>

            {/* 色パレット選択 */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700 shadow-xl">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
                <Palette size={20} className="mr-2" />
                カラーパレット
              </h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {Object.keys(colorPalettes).map((palette) => (
                  <button
                    key={palette}
                    onClick={() => setSelectedPalette(palette as keyof typeof colorPalettes)}
                    className={`p-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                      selectedPalette === palette
                        ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg border border-gray-500'
                        : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border border-gray-700'
                    }`}
                  >
                    {palette === 'vibrant' && '鮮やか'}
                    {palette === 'pastel' && 'パステル'}
                    {palette === 'monochrome' && 'モノクロ'}
                    {palette === 'nature' && 'ナチュラル'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {colorPalettes[selectedPalette].map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={`w-10 h-10 rounded-xl border-2 transition-all duration-300 transform hover:scale-110 ${
                      currentColor === color
                        ? "border-white shadow-lg scale-110 ring-2 ring-white/50"
                        : "border-gray-600 hover:border-gray-400"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <div className="mt-4">
                <label className="block text-sm text-gray-300 mb-2">
                  カスタムカラー
                </label>
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-full h-12 rounded-xl border border-gray-600 cursor-pointer bg-transparent"
                />
              </div>
            </div>

            {/* ブラシサイズ */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700 shadow-xl">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
                <Settings size={20} className="mr-2" />
                ブラシサイズ
              </h3>
              <div className="space-y-3">
                {brushSizes.map(({ size, label, icon }) => (
                  <button
                    key={size}
                    onClick={() => handleBrushSizeChange(size)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${
                      brushSize === size
                        ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg transform scale-105 border border-gray-500"
                        : "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white border border-gray-700"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="rounded-full bg-current flex items-center justify-center text-white"
                        style={{ width: Math.min(size * 1.5, 30), height: Math.min(size * 1.5, 30) }}
                      >
                        <span className="text-xs">{icon}</span>
                      </div>
                      <span className="font-medium">{label}</span>
                    </div>
                    <span className="text-sm opacity-75">{size}px</span>
                  </button>
                ))}
              </div>
            </div>

            {/* アクションボタン */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700 shadow-xl">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
                <Save size={20} className="mr-2" />
                アクション
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={undo}
                    disabled={historyIndex <= 0}
                    className="flex items-center justify-center space-x-2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 disabled:from-gray-800 disabled:to-gray-900 disabled:text-gray-500 text-white px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 border border-gray-600"
                  >
                    <RotateCcw size={16} />
                    <span className="text-sm font-medium">元に戻す</span>
                  </button>
                  <button
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    className="flex items-center justify-center space-x-2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 disabled:from-gray-800 disabled:to-gray-900 disabled:text-gray-500 text-white px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 border border-gray-600"
                  >
                    <RotateCw size={16} />
                    <span className="text-sm font-medium">やり直し</span>
                  </button>
                </div>
                
                <button
                  onClick={clearCanvas}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/25 border border-red-500"
                >
                  <Trash2 size={16} />
                  <span className="font-medium">クリア</span>
                </button>
                
                <button
                  onClick={saveImage}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25 border border-blue-500"
                >
                  <Download size={16} />
                  <span className="font-medium">保存</span>
                </button>
              </div>
            </div>

            {/* 現在の設定表示 */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700 shadow-xl">
              <h3 className="text-lg font-semibold mb-4 text-white">現在の設定</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">ツール:</span>
                  <span className="text-white font-semibold">
                    {activeTool === 'brush' ? 'ブラシ' : '消しゴム'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">色:</span>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-6 h-6 rounded-full border border-gray-600 shadow-lg"
                      style={{ backgroundColor: currentColor }}
                    />
                    <span className="text-white font-mono">{currentColor}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">ブラシサイズ:</span>
                  <span className="text-white font-semibold">{brushSize}px</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">履歴:</span>
                  <span className="text-white font-semibold">{historyIndex + 1} / {history.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
