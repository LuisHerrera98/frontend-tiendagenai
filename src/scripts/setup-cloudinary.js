/**
 * Script para configurar Cloudinary correctamente
 * 
 * IMPORTANTE: Para que funcione el upload desde el frontend,
 * necesitas crear un "Upload Preset" unsigned en Cloudinary:
 * 
 * 1. Ve a https://console.cloudinary.com/settings/upload
 * 2. Busca la sección "Upload presets"
 * 3. Click en "Add upload preset"
 * 4. Configuración:
 *    - Preset name: ml_default
 *    - Signing Mode: UNSIGNED (muy importante!)
 *    - Folder: products (opcional)
 *    - Allowed formats: jpg, png, gif, webp (opcional)
 * 5. Click en "Save"
 * 
 * Si ya tienes el preset "ml_default", asegúrate que:
 * - Esté configurado como UNSIGNED
 * - No como SIGNED
 * 
 * Credenciales actuales:
 * - Cloud Name: dwkwu8adz
 * - Upload Preset: ml_default (debe ser UNSIGNED)
 */

console.log(`
=================================================
CONFIGURACIÓN DE CLOUDINARY PARA UPLOAD DIRECTO
=================================================

Para que funcione el upload de imágenes, sigue estos pasos:

1. Abre: https://console.cloudinary.com/settings/upload

2. En "Upload presets", verifica si existe "ml_default"

3. Si NO existe:
   - Click en "Add upload preset"
   - Preset name: ml_default
   - Signing Mode: UNSIGNED ← MUY IMPORTANTE
   - Click en "Save"

4. Si YA existe:
   - Click en "ml_default" para editarlo
   - Verifica que Signing Mode = UNSIGNED
   - Si dice SIGNED, cámbialo a UNSIGNED
   - Click en "Save"

Cloud Name: dwkwu8adz
Upload Preset: ml_default

=================================================
`)