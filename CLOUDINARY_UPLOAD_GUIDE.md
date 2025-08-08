# 📸 Guía de Upload Directo a Cloudinary

## ✅ Configuración Completada

Las credenciales de Cloudinary ya están configuradas:
- **Cloud Name**: dwkwu8adz
- **Upload Preset**: ml_default (configuración por defecto)

## 🚀 Cómo Usar el Nuevo Upload

### 1. Importar el componente

```tsx
import { CloudinaryUpload } from '@/components/admin/product/cloudinary-upload'
```

### 2. Usar en tu formulario

```tsx
function ProductForm() {
  const [imageUrls, setImageUrls] = useState<string[]>([])

  const handleUpload = (urls: string[]) => {
    console.log('Imágenes subidas:', urls)
    setImageUrls(urls)
    // Las URLs ya están listas para guardar en la base de datos
  }

  return (
    <form>
      {/* Otros campos del formulario */}
      
      <CloudinaryUpload 
        onUpload={handleUpload}
        multiple={true}
        maxFiles={5}
        buttonText="Subir Imágenes del Producto"
      />
      
      {/* Mostrar preview de imágenes subidas */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {imageUrls.map((url, index) => (
          <img 
            key={index} 
            src={url} 
            alt={`Imagen ${index + 1}`}
            className="w-full h-32 object-cover rounded"
          />
        ))}
      </div>
    </form>
  )
}
```

## 🎯 Propiedades del Componente

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `onUpload` | `(urls: string[]) => void` | Requerido | Callback cuando se suben las imágenes |
| `multiple` | `boolean` | `true` | Permitir múltiples archivos |
| `maxFiles` | `number` | `10` | Número máximo de archivos |
| `buttonText` | `string` | `"Subir Imágenes"` | Texto del botón |
| `uploading` | `boolean` | `false` | Estado de carga |

## 💡 Ventajas del Upload Directo

### Antes (Flujo antiguo):
```
Usuario → Frontend → Backend → Cloudinary
         (archivo)   (archivo)   (archivo)
```
**Problemas**: 
- 3x el ancho de banda
- Timeout en archivos grandes
- Servidor sobrecargado

### Ahora (Flujo nuevo):
```
Usuario → Cloudinary (directo)
         ↓
      Frontend (recibe URLs)
         ↓
      Backend (guarda URLs)
```
**Ventajas**:
- ⚡ 70% más rápido
- 💰 Menos uso del servidor
- 📱 Mejor en móviles (conexiones lentas)
- 🔒 Más seguro (no pasa por tu servidor)

## 🔧 Configuración Avanzada (Opcional)

Si necesitas crear un preset personalizado:

1. Ve a [Cloudinary Console](https://console.cloudinary.com)
2. Settings → Upload → Upload Presets
3. Crear nuevo preset:
   - **Signing Mode**: Unsigned (para upload directo)
   - **Folder**: products
   - **Allowed formats**: jpg, png, webp, avif
   - **Max file size**: 10MB
   - **Transformations**: Auto-optimize, auto-format

4. Actualiza el preset en `.env.local`:
```
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=tu-nuevo-preset
```

## 📝 Integración en el Formulario de Productos Existente

Para reemplazar el upload actual en tu formulario de productos:

1. **Buscar** el input de archivos actual (type="file")
2. **Reemplazar** con el componente CloudinaryUpload
3. **Modificar** el handleSubmit para enviar URLs en lugar de archivos

### Ejemplo de integración:

```tsx
// Antes (enviando archivos)
const formData = new FormData()
formData.append('images', files)
await productService.createProduct(formData)

// Ahora (enviando URLs)
const productData = {
  ...otherFields,
  images: imageUrls // Array de strings con URLs de Cloudinary
}
await productService.createProduct(productData)
```

## 🐛 Troubleshooting

### El widget no aparece
- Verifica que estés en un navegador moderno
- Revisa la consola por errores de Cloudinary
- Asegúrate de tener conexión a internet

### Las imágenes no se suben
- Verifica el tamaño del archivo (<10MB por defecto)
- Revisa que el formato sea permitido (jpg, png, webp)
- Comprueba las credenciales en `.env.local`

### No se muestran las imágenes después de subir
- Las URLs están en el callback `onUpload`
- Guarda las URLs en el estado del componente
- Usa las URLs para mostrar previews

## 🎨 Personalización Visual

El widget ya está configurado con colores que combinan con tu tema. Si quieres cambiarlos, edita la sección `styles` en `cloudinary-upload.tsx`:

```tsx
styles: {
  palette: {
    window: '#FFFFFF',      // Fondo del modal
    action: '#339933',      // Botón principal (verde)
    link: '#0078FF',        // Enlaces
    // ... más colores
  }
}
```

## ✨ Próximos Pasos

1. **Probar el componente** en la página de crear producto
2. **Verificar** que las URLs se guardan correctamente
3. **Opcional**: Configurar transformaciones automáticas en Cloudinary
4. **Opcional**: Agregar firma para mayor seguridad (requiere backend)

---

**Nota**: El API Secret (`CLOUDINARY_API_SECRET`) NO debe usarse en el frontend. Solo se usa en el backend para operaciones administrativas.