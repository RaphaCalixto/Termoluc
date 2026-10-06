import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Redimensiona e comprime uma imagem no browser antes de salvar
 */
export async function optimizeImage(file: File, maxWidth = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Faz upload de imagem para o Supabase Storage ou retorna Base64 otimizado
 */
export async function uploadImage(file: File, folder = 'uploads'): Promise<string> {
  const optimizedDataUrl = await optimizeImage(file);

  if (isSupabaseConfigured && supabase) {
    try {
      // Converte dataURL para Blob
      const response = await fetch(optimizedDataUrl);
      const blob = await response.blob();
      const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;

      const { data, error } = await supabase.storage
        .from('termoluc-media')
        .upload(filename, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.warn('Falha no upload para Supabase Storage, usando dataUrl local:', error);
        return optimizedDataUrl;
      }

      const { data: publicUrlData } = supabase.storage
        .from('termoluc-media')
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.warn('Erro no envio para storage, fallback para dataUrl:', err);
      return optimizedDataUrl;
    }
  }

  return optimizedDataUrl;
}
