import React, { useRef, useState } from 'react';
import {
  Upload,
  X,
  Camera,
  Eye,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { uploadImage } from '../../services/storage';

interface SingleImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
}

export const SingleImageUpload: React.FC<SingleImageUploadProps> = ({
  value,
  onChange,
  label = 'Foto / Imagem (Opcional)',
  folder = 'general',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const url = await uploadImage(file, folder);
      onChange(url);
    } catch (err) {
      console.error('Erro no upload da imagem:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">{label}</label>}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video max-h-48 flex items-center justify-center">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewModalOpen(true)}
              className="p-2 bg-white/90 text-slate-800 rounded-lg hover:bg-white transition-colors"
              title="Visualizar em tamanho real"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-white/90 text-termoluc-700 rounded-lg hover:bg-white transition-colors"
              title="Trocar imagem"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 bg-white/90 text-red-600 rounded-lg hover:bg-white transition-colors"
              title="Remover imagem"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 hover:border-termoluc-400 hover:bg-termoluc-50/30 rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
        >
          {uploading ? (
            <div className="flex items-center gap-2 text-termoluc-600">
              <div className="w-5 h-5 border-2 border-termoluc-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium">Otimizando e enviando...</span>
            </div>
          ) : (
            <>
              <div className="p-2.5 rounded-full bg-termoluc-50 text-termoluc-600">
                <Camera className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-termoluc-600 hover:underline">Clique para enviar</span> ou tire uma foto
                <p className="text-slate-400 mt-0.5">JPG, PNG ou WebP até 10MB</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal de visualização ampliada */}
      {previewModalOpen && value && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewModalOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-xl bg-black">
            <button 
              onClick={() => setPreviewModalOpen(false)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black/80"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={value} alt="Visualização ampliada" className="max-w-full max-h-[85vh] object-contain mx-auto" />
          </div>
        </div>
      )}
    </div>
  );
};

interface MultiImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  label?: string;
  folder?: string;
  helperText?: string;
}

export const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  images,
  onChange,
  label = 'Fotos do Equipamento / Plaqueta Técnica / Local',
  folder = 'equipment',
  helperText = 'Adicione quantas fotos desejar (Plaqueta, Evaporadora, Condensadora, Instalação). Arraste os cards para reorganizar a ordem.',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setUploading(true);
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const url = await uploadImage(file, folder);
        uploadedUrls.push(url);
      }
      onChange([...images, ...uploadedUrls]);
    } catch (err) {
      console.error('Erro ao enviar múltiplas imagens:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  // Reordering helpers
  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length || fromIndex === toIndex) return;
    const updated = [...images];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedItem);
    onChange(updated);
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnter = (index: number) => {
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      moveImage(draggedIndex, dragOverIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-2">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-termoluc-600" />
            {label} ({images.length})
          </label>
          {helperText && (
            <p className="text-[11px] text-slate-400 font-normal">
              {helperText}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="self-start sm:self-auto text-xs font-bold text-white bg-termoluc-600 hover:bg-termoluc-700 px-3.5 py-1.5 rounded-xl shadow-xs shadow-termoluc-200 transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>+ Adicionar Fotos</span>
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Grid of uploaded images */}
      {images.length > 0 ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((url, idx) => {
              const isFirst = idx === 0;
              const isDragging = draggedIndex === idx;
              const isOver = dragOverIndex === idx && draggedIndex !== idx;

              return (
                <div
                  key={`${url}-${idx}`}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragEnter={() => handleDragEnter(idx)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  className={`group relative aspect-square rounded-2xl overflow-hidden border bg-slate-100 shadow-xs transition-all select-none cursor-grab active:cursor-grabbing ${
                    isDragging
                      ? 'opacity-40 scale-95 border-dashed border-termoluc-500'
                      : isOver
                      ? 'border-2 border-termoluc-500 ring-4 ring-termoluc-100 scale-102'
                      : isFirst
                      ? 'border-termoluc-400 ring-2 ring-termoluc-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Background Image (Click to View/Zoom) */}
                  <img
                    src={url}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-full object-cover pointer-events-none"
                  />

                  {/* Darkening Hover Overlay (z-10) */}
                  <div
                    onClick={() => setActiveImageIndex(idx)}
                    className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer flex items-center justify-center"
                    title="Clique para ampliar"
                  >
                    <div className="p-2.5 rounded-full bg-white/90 text-slate-800 shadow-md hover:scale-110 transition-transform">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Top Bar: Badge & Remove Button (z-20 - Always on top and clickable) */}
                  <div className="absolute top-2 inset-x-2 flex items-center justify-between z-20 pointer-events-auto">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-md flex items-center gap-1 ${
                        isFirst
                          ? 'bg-termoluc-600 text-white'
                          : 'bg-slate-900/80 text-white backdrop-blur-xs'
                      }`}
                    >
                      {isFirst ? (
                        <>
                          <Sparkles className="w-2.5 h-2.5" />
                          Foto Principal
                        </>
                      ) : (
                        `#${idx + 1}`
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleRemove(idx, e);
                      }}
                      className="w-7 h-7 flex items-center justify-center bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-full shadow-lg transition-all cursor-pointer"
                      title="Excluir esta foto"
                    >
                      <X className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Bottom Bar: Reordering Controls (z-20) */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-2 inset-x-2 flex items-center justify-between gap-1 bg-slate-900/85 backdrop-blur-xs p-1 rounded-xl text-white z-20 pointer-events-auto shadow-md"
                  >
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveImage(idx, idx - 1);
                      }}
                      className="p-1 hover:bg-white/20 active:scale-95 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                      title="Mover para a esquerda"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1 text-[10px] font-semibold opacity-90 cursor-grab">
                      <GripVertical className="w-3 h-3 text-termoluc-300" />
                      <span>Arraste</span>
                    </div>

                    <button
                      type="button"
                      disabled={idx === images.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveImage(idx, idx + 1);
                      }}
                      className="p-1 hover:bg-white/20 active:scale-95 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                      title="Mover para a direita"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Dropzone Card for adding more */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-termoluc-400 hover:bg-termoluc-50/50 rounded-2xl aspect-square flex flex-col items-center justify-center text-slate-400 hover:text-termoluc-600 cursor-pointer transition-all gap-1.5 text-center p-3"
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-termoluc-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <div className="p-2 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-termoluc-100">
                    <Upload className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-600">+ Mais fotos</span>
                  <span className="text-[10px] text-slate-400">Sem limites</span>
                </>
              )}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-termoluc-600" />
              Total de <strong>{images.length} foto(s)</strong> vinculadas
            </span>
            <span className="text-slate-400">A 1ª foto será usada como capa</span>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 hover:border-termoluc-400 hover:bg-termoluc-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
        >
          {uploading ? (
            <div className="flex items-center gap-2 text-termoluc-600">
              <div className="w-5 h-5 border-2 border-termoluc-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium">Otimizando e enviando imagens...</span>
            </div>
          ) : (
            <>
              <div className="p-3 rounded-2xl bg-termoluc-50 text-termoluc-600 shadow-2xs">
                <Camera className="w-6 h-6" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-termoluc-600 hover:underline">Clique para adicionar fotos</span> ou arraste do seu dispositivo
                <p className="text-slate-400 mt-0.5">Sem limite de quantidade • Suporta JPG, PNG ou WebP</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal de visualização ampliada com navegação */}
      {activeImageIndex !== null && images[activeImageIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveImageIndex(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Close */}
            <div className="w-full flex items-center justify-between text-white mb-2 px-2">
              <span className="text-xs font-semibold">
                Foto {activeImageIndex + 1} de {images.length}
              </span>
              <button
                onClick={() => setActiveImageIndex(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Image with Prev / Next */}
            <div className="relative flex items-center justify-center">
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((activeImageIndex - 1 + images.length) % images.length)}
                  className="absolute left-2 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all shadow-xl z-10"
                  title="Foto anterior"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              <img
                src={images[activeImageIndex]}
                alt={`Foto ${activeImageIndex + 1}`}
                className="max-w-full max-h-[78vh] object-contain rounded-xl shadow-2xl"
              />

              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((activeImageIndex + 1) % images.length)}
                  className="absolute right-2 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all shadow-xl z-10"
                  title="Próxima foto"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
