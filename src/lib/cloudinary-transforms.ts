/**
 * Utilidades para transformar URLs de Cloudinary
 * Permite optimización de imágenes sin necesidad de backend
 */

/**
 * Aplica transformaciones a una URL de Cloudinary
 * @param url URL original de Cloudinary
 * @param options Opciones de transformación
 */
export function transformCloudinaryUrl(
  url: string, 
  options?: {
    width?: number;
    height?: number;
    quality?: 'auto' | 'auto:low' | 'auto:eco' | 'auto:good' | 'auto:best' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
    crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'crop';
    gravity?: 'auto' | 'face' | 'faces' | 'center';
    blur?: number;
    background?: string;
  }
): string {
  // Si no es una URL de Cloudinary, devolver la URL original
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  // Construir transformaciones
  const transforms: string[] = [];
  
  if (options?.width) transforms.push(`w_${options.width}`);
  if (options?.height) transforms.push(`h_${options.height}`);
  if (options?.quality) transforms.push(`q_${options.quality}`);
  if (options?.format) transforms.push(`f_${options.format}`);
  if (options?.crop) transforms.push(`c_${options.crop}`);
  if (options?.gravity) transforms.push(`g_${options.gravity}`);
  if (options?.blur) transforms.push(`e_blur:${options.blur}`);
  if (options?.background) transforms.push(`b_${options.background}`);
  
  // Si no hay opciones, aplicar optimización automática por defecto
  if (transforms.length === 0) {
    transforms.push('q_auto', 'f_auto');
  }

  // Insertar transformaciones en la URL
  const parts = url.split('/upload/');
  if (parts.length === 2) {
    return parts[0] + '/upload/' + transforms.join(',') + '/' + parts[1];
  }
  
  return url;
}

/**
 * Genera URLs optimizadas para diferentes tamaños (responsive)
 */
export function generateResponsiveUrls(baseUrl: string) {
  return {
    thumbnail: transformCloudinaryUrl(baseUrl, {
      width: 150,
      height: 150,
      crop: 'thumb',
      quality: 'auto:low'
    }),
    small: transformCloudinaryUrl(baseUrl, {
      width: 400,
      quality: 'auto:eco',
      format: 'auto'
    }),
    medium: transformCloudinaryUrl(baseUrl, {
      width: 800,
      quality: 'auto:good',
      format: 'auto'
    }),
    large: transformCloudinaryUrl(baseUrl, {
      width: 1200,
      quality: 'auto:best',
      format: 'auto'
    }),
    original: baseUrl
  };
}

/**
 * Optimiza URL para vista previa rápida
 */
export function getOptimizedThumbnail(url: string, size: number = 200): string {
  return transformCloudinaryUrl(url, {
    width: size,
    height: size,
    crop: 'fill',
    quality: 'auto:low',
    format: 'webp'
  });
}

/**
 * Optimiza URL para galería de productos
 */
export function getProductImage(url: string, size: 'thumb' | 'card' | 'detail' = 'card'): string {
  const configs = {
    thumb: { width: 100, height: 100, crop: 'thumb' as const, quality: 'auto:low' as const },
    card: { width: 400, height: 400, crop: 'fill' as const, quality: 'auto:good' as const },
    detail: { width: 800, quality: 'auto:best' as const, format: 'auto' as const }
  };
  
  const config = configs[size];
  return transformCloudinaryUrl(url, config);
}

/**
 * Aplica efecto de desenfoque (útil para fondos)
 */
export function getBlurredBackground(url: string): string {
  return transformCloudinaryUrl(url, {
    width: 1920,
    quality: 'auto:low',
    blur: 800,
    format: 'webp'
  });
}

/**
 * Comprime imagen antes de subir (en el navegador)
 */
export async function compressImageBeforeUpload(
  file: File,
  maxSizeMB: number = 5,
  maxDimension: number = 1920,
  quality: number = 0.85
): Promise<File> {
  // Solo comprimir si es mayor al límite
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;
      
      // Redimensionar si es necesario
      if (width > maxDimension || height > maxDimension) {
        const scale = Math.min(maxDimension / width, maxDimension / height);
        width *= scale;
        height *= scale;
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Detecta si una imagen es HEIC/HEIF
 */
export function isHeicImage(file: File | string): boolean {
  if (typeof file === 'string') {
    return file.toLowerCase().match(/\.(heic|heif)($|\?)/) !== null;
  }
  return file.type.includes('heic') || file.type.includes('heif');
}