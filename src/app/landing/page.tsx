'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Store, 
  Zap, 
  Shield, 
  Smartphone, 
  CreditCard, 
  BarChart3,
  Check,
  ArrowRight
} from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: <Store className="w-6 h-6" />,
      title: 'Tienda Personalizable',
      description: 'Personaliza colores, logo y diseño de tu tienda'
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: '100% Responsive',
      description: 'Tu tienda se ve perfecta en cualquier dispositivo'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Seguro y Confiable',
      description: 'Protegemos tus datos y los de tus clientes'
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: 'Múltiples Pagos',
      description: 'Acepta efectivo, transferencias, QR y tarjetas'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Métricas en Tiempo Real',
      description: 'Controla tus ventas y ganancias al instante'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Rápido y Simple',
      description: 'Tu tienda lista en menos de 5 minutos'
    }
  ];

  const plans = [
    {
      name: 'Gratis',
      price: '$0',
      description: 'Perfecto para empezar',
      features: [
        'Hasta 50 productos',
        'Ventas ilimitadas',
        'Subdominio personalizado',
        'Soporte por email',
        'Métricas básicas'
      ],
      cta: 'Empezar Gratis',
      featured: false
    },
    {
      name: 'Profesional',
      price: '$19',
      period: '/mes',
      description: 'Para tiendas en crecimiento',
      features: [
        'Productos ilimitados',
        'Dominio personalizado',
        'WhatsApp Business integrado',
        'Soporte prioritario',
        'Métricas avanzadas',
        'Sin comisiones por venta'
      ],
      cta: 'Probar 30 días gratis',
      featured: true
    },
    {
      name: 'Enterprise',
      price: 'Personalizado',
      description: 'Para grandes empresas',
      features: [
        'Todo lo del plan Profesional',
        'API personalizada',
        'Integraciones especiales',
        'Soporte dedicado 24/7',
        'SLA garantizado',
        'Capacitación incluida'
      ],
      cta: 'Contactar Ventas',
      featured: false
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Store className="w-8 h-8 text-green-600" />
              <span className="text-xl font-bold">Tu Tienda Online</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900">
                Características
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900">
                Precios
              </Link>
              <Link href="/auth/login" className="text-gray-600 hover:text-gray-900">
                Iniciar Sesión
              </Link>
              <Link href="/auth/register">
                <Button>Crear Tienda</Button>
              </Link>
            </nav>
            <div className="md:hidden">
              <Link href="/auth/register">
                <Button size="sm">Empezar</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Crea tu tienda online<br />
            <span className="text-green-600">en minutos</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            La plataforma más simple para vender online. 
            Sin comisiones, sin complicaciones. Tu tienda lista en 5 minutos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="w-full sm:w-auto">
                Crear mi tienda gratis
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Ver demo
            </Button>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            No necesitas tarjeta de crédito • 30 días de prueba gratis
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas para vender online
            </h2>
            <p className="text-xl text-gray-600">
              Herramientas profesionales, fáciles de usar
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Precios transparentes, sin sorpresas
            </h2>
            <p className="text-xl text-gray-600">
              Elige el plan que mejor se adapte a tu negocio
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`rounded-lg p-8 ${
                  plan.featured
                    ? 'bg-green-600 text-white ring-4 ring-green-600 ring-opacity-50'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {plan.featured && (
                  <div className="text-sm font-medium mb-4">MÁS POPULAR</div>
                )}
                <h3 className={`text-2xl font-bold mb-2 ${plan.featured ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className={`text-4xl font-bold ${plan.featured ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={plan.featured ? 'text-green-100' : 'text-gray-600'}>
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className={`mb-6 ${plan.featured ? 'text-green-100' : 'text-gray-600'}`}>
                  {plan.description}
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className={`w-5 h-5 mr-2 flex-shrink-0 ${
                        plan.featured ? 'text-green-200' : 'text-green-600'
                      }`} />
                      <span className={plan.featured ? 'text-white' : 'text-gray-700'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register" className="block">
                  <Button
                    className="w-full"
                    variant={plan.featured ? 'secondary' : 'default'}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ¿Listo para empezar a vender?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Únete a miles de emprendedores que ya están vendiendo online
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary">
              Crear mi tienda ahora
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Store className="w-6 h-6 text-green-500" />
                <span className="text-white font-semibold">Tu Tienda Online</span>
              </div>
              <p className="text-sm">
                La plataforma más simple para crear tu tienda online y vender en minutos.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="hover:text-white">Características</Link></li>
                <li><Link href="#pricing" className="hover:text-white">Precios</Link></li>
                <li><Link href="#" className="hover:text-white">Roadmap</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Recursos</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">Blog</Link></li>
                <li><Link href="#" className="hover:text-white">Guías</Link></li>
                <li><Link href="#" className="hover:text-white">Soporte</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">Términos</Link></li>
                <li><Link href="#" className="hover:text-white">Privacidad</Link></li>
                <li><Link href="#" className="hover:text-white">Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2024 Tu Tienda Online. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}