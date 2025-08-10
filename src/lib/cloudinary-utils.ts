/**
 * Utilidades para manejar imágenes de Cloudinary
 */

/**
 * Extrae el public_id de una URL de Cloudinary
 * Ejemplo: https://res.cloudinary.com/dwkwu8adz/image/upload/v1234/products/image.jpg
 * Retorna: products/image
 */
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    const regex = /\/v\d+\/(.+)\.\w+$/
    const match = url.match(regex)
    if (match && match[1]) {
      return match[1]
    }
    
    // Intento alternativo sin versión
    const regex2 = /upload\/(?:.*\/)?(.+)\.\w+$/
    const match2 = url.match(regex2)
    if (match2 && match2[1]) {
      return match2[1]
    }
    
    return null
  } catch (error) {
    console.error('Error extracting public_id:', error)
    return null
  }
}

/**
 * NOTA IMPORTANTE sobre el borrado de imágenes:
 * 
 * Para borrar imágenes de Cloudinary desde el frontend, necesitarías:
 * 1. Un endpoint en el backend que maneje el borrado
 * 2. O usar la API de Cloudinary con firma (requiere API Secret, NO seguro en frontend)
 * 
 * Por seguridad, el borrado debe hacerse desde el backend:
 * 
 * Backend endpoint ejemplo:
 * DELETE /api/cloudinary/delete
 * Body: { publicId: "products/image_id" }
 * 
 * El backend usaría:
 * cloudinary.uploader.destroy(publicId)
 * 
 * Alternativamente, puedes:
 * 1. No borrar las imágenes (Cloudinary tiene planes con almacenamiento generoso)
 * 2. Tener un proceso batch que limpie imágenes huérfanas periódicamente
 * 3. Usar el Admin API de Cloudinary para gestión manual
 */

/**
 * Función placeholder para borrado (debe implementarse en backend)
 */
export async function deleteImageFromCloudinary(url: string): Promise<boolean> {
  const publicId = extractPublicIdFromUrl(url)
  
  if (!publicId) {
    console.error('No se pudo extraer el public_id de la URL')
    return false
  }
  
  // TODO: Llamar al backend para borrar la imagen
  console.log('Para borrar imagen, implementar endpoint en backend:', publicId)
  
  // Por ahora, solo retornamos true simulando éxito
  return true
}

/**
 * Verifica si una URL es de Cloudinary
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com')
}