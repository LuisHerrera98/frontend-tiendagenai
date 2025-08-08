import type { NextConfig } from "next";

// Bundle Analyzer
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Headers de seguridad
  async headers() {
    return [
      {
        // Aplicar a todas las rutas
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            // CSP flexible para no romper funcionalidad
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://upload-widget.cloudinary.com https://widget.cloudinary.com;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com;
              font-src 'self' data:;
              connect-src 'self' https://api.cloudinary.com https://res.cloudinary.com http://localhost:3000 https://api.tiendagenai.com;
              frame-src 'self' https://widget.cloudinary.com;
              media-src 'self' https://res.cloudinary.com;
            `.replace(/\n/g, '').replace(/\s+/g, ' ').trim()
          }
        ],
      },
      {
        // Headers específicos para la API
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0'
          }
        ]
      }
    ]
  },
  
  // Configuración de rendimiento
  poweredByHeader: false,
  compress: true,
  
  // Optimizaciones de producción
  productionBrowserSourceMaps: false,
  
  // Configuración experimental para mejor rendimiento
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  }
};

export default withBundleAnalyzer(nextConfig);
