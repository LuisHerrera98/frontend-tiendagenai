import { Header } from '@/components/layout/header'
import { ProductCatalog } from '@/components/product/product-catalog'

export default function HomePage() {
  return (
    <div className="min-h-screen w-full bg-gray-50">
      <Header />
      <main className="w-full">
        <ProductCatalog />
      </main>
    </div>
  )
}
