import React, { useState, useRef, useEffect } from 'react';
import { Camera, Send, CheckCheck, Loader2, Image as ImageIcon, X, Mic, FileText } from 'lucide-react';
import { analyzeReceipt, fileToBase64 } from '../services/geminiService';
import { mockBackend } from '../services/mockBackend';
import { User, ReceiptData } from '../types';

interface WhatsAppSimulatorProps {
  currentUser: User;
  onReceiptProcessed: () => void;
  // New prop to trigger the modal in parent
  onImageSelected?: (file: File, base64: string, preliminaryData: Partial<ReceiptData>) => void;
}

const WhatsAppSimulator: React.FC<WhatsAppSimulatorProps> = ({ currentUser, onReceiptProcessed, onImageSelected }) => {
  const [messages, setMessages] = useState<Array<{ type: 'in' | 'out', text?: string, image?: string, fileType?: string, data?: any }>>([
    { type: 'in', text: `Chat Interno Conectado.\nOlá ${currentUser.name}! Envie suas notas (Foto ou PDF) por aqui.` }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isTyping]);

  // Method called from Parent when Modal confirms the receipt
  // This simulates the system message "Receipt sent to accountant"
  const addSystemConfirmation = (receipt: ReceiptData) => {
      // Check if original upload was PDF based on image URL format (simple check)
      const isPdf = receipt.imageUrl?.includes('application/pdf');

      setMessages(prev => [...prev, { 
          type: 'out', 
          image: receipt.imageUrl,
          fileType: isPdf ? 'application/pdf' : 'image/jpeg',
          text: `Nota enviada com sucesso.\nID: #${receipt.id.substring(0,6)}` 
      }]);
      
      setTimeout(() => {
        setMessages(prev => [...prev, { 
            type: 'in', 
            text: `✅ Recebido pela contabilidade.\n\nResumo:\n${receipt.summary?.category} - R$ ${receipt.totalAmount?.toFixed(2)}` 
        }]);
      }, 1000);
  };

  // Expose this method to parent via custom event or ref
  useEffect(() => {
      const handleExternalConfirm = (e: CustomEvent) => {
          if (e.detail && e.detail.receipt) {
              addSystemConfirmation(e.detail.receipt);
          }
      };
      window.addEventListener('receipt-confirmed', handleExternalConfirm as EventListener);
      return () => window.removeEventListener('receipt-confirmed', handleExternalConfirm as EventListener);
  }, []);


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const startCamera = async () => {
    try {
      setShowCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Não foi possível acessar a câmera.");
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 300, 400);
        canvasRef.current.toBlob(async (blob) => {
           if(blob) {
               const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
               stopCamera();
               await processFile(file);
           }
        }, 'image/jpeg');
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const processFile = async (file: File) => {
    const base64 = await fileToBase64(file);
    // Determine mime type
    const mimeType = file.type || 'image/jpeg';
    
    setIsTyping(true);

    try {
      // 1. Analyze with Gemini (Passing mimeType)
      const extractedData = await analyzeReceipt(base64, mimeType);
      setIsTyping(false);
      
      // 2. Trigger Parent Modal (Smart Flow)
      if (onImageSelected) {
          onImageSelected(file, base64, extractedData);
      } else {
          // Fallback legacy behavior
          alert("Fluxo de confirmação não configurado");
      }

    } catch (error) {
      setIsTyping(false);
      setMessages(prev => [...prev, { type: 'in', text: "Erro ao ler o documento. Tente novamente." }]);
    }
  };

  const handleTextSend = async (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { type: 'out', text }]);
    // Mock auto-response
    setTimeout(() => {
        setMessages(prev => [...prev, { type: 'in', text: "Mensagem recebida. O contador responderá em breve." }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-md mx-auto bg-[#efeae2] rounded-xl shadow-2xl overflow-hidden border border-gray-200 relative">
      {/* Header */}
      <div className="bg-[#075e54] p-3 text-white flex items-center shadow-md z-10 justify-between">
        <div className="flex items-center">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
            <span className="font-bold text-lg">C</span>
            </div>
            <div>
            <h3 className="font-semibold">Chat Contabilidade</h3>
            <p className="text-xs text-green-100">Escritório Silva • Online</p>
            </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.type === 'out' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 shadow-sm ${msg.type === 'out' ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
              
              {/* Media Rendering Logic */}
              {msg.image && (
                <div className="mb-2 rounded overflow-hidden">
                    {msg.fileType === 'application/pdf' ? (
                        <div className="flex items-center gap-2 p-3 bg-red-50 rounded border border-red-100">
                             <FileText size={32} className="text-red-500" />
                             <span className="text-xs font-semibold text-red-700">Documento PDF</span>
                        </div>
                    ) : (
                        <img src={msg.image} alt="Upload" className="w-full h-auto object-cover max-h-60" />
                    )}
                </div>
              )}
              
              {msg.text && <p className="text-sm text-gray-800 whitespace-pre-line">{msg.text}</p>}
              <div className="flex justify-end mt-1 space-x-1">
                <span className="text-[10px] text-gray-500">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.type === 'out' && <CheckCheck size={14} className="text-blue-500" />}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
             <div className="bg-white rounded-lg p-3 rounded-tl-none shadow-sm flex items-center space-x-1">
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Camera Overlay */}
      {showCamera && (
        <div className="absolute inset-0 bg-black z-20 flex flex-col items-center justify-center">
             <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
             <canvas ref={canvasRef} width="300" height="400" className="hidden" />
             <div className="absolute bottom-8 flex space-x-8 items-center">
                 <button onClick={stopCamera} className="p-4 rounded-full bg-red-500 text-white"><X /></button>
                 <button onClick={capturePhoto} className="p-6 rounded-full bg-white border-4 border-gray-300"></button>
             </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-[#f0f0f0] p-2 flex items-center space-x-2">
        <input 
            type="file" 
            accept="image/*,application/pdf" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
        />
        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-gray-700">
          <ImageIcon size={24} />
        </button>
        <button onClick={startCamera} className="p-2 text-gray-500 hover:text-gray-700">
          <Camera size={24} />
        </button>
        <div className="flex-1 bg-white rounded-full px-4 py-2 shadow-sm">
            <input 
                type="text" 
                placeholder="Mensagem" 
                className="w-full bg-transparent outline-none text-sm"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        handleTextSend(e.currentTarget.value);
                        e.currentTarget.value = '';
                    }
                }}
            />
        </div>
        <button className="p-2 text-gray-500 hover:text-gray-700">
            <Mic size={24} />
        </button>
        <button 
            className="p-2 bg-[#075e54] text-white rounded-full hover:bg-[#128c7e] transition-colors"
            onClick={() => {
                const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                handleTextSend(input.value);
                input.value = '';
            }}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default WhatsAppSimulator;