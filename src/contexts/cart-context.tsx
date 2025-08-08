'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface CartItem {
  productId: string
  productName: string
  sizeId: string
  sizeName: string
  quantity: number
  price: number
  discount: number
  image?: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string, sizeId: string) => void
  updateQuantity: (productId: string, sizeId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemsCount: () => number
  getTotalWithDiscount: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      setItems(JSON.parse(savedCart))
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const addItem = (newItem: CartItem) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(
        item => item.productId === newItem.productId && item.sizeId === newItem.sizeId
      )

      if (existingItem) {
        return prevItems.map(item =>
          item.productId === newItem.productId && item.sizeId === newItem.sizeId
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        )
      }

      return [...prevItems, newItem]
    })
  }

  const removeItem = (productId: string, sizeId: string) => {
    setItems(prevItems =>
      prevItems.filter(item => !(item.productId === productId && item.sizeId === sizeId))
    )
  }

  const updateQuantity = (productId: string, sizeId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, sizeId)
      return
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId && item.sizeId === sizeId
          ? { ...item, quantity }
          : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const getTotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getTotalWithDiscount = () => {
    return items.reduce((total, item) => {
      const itemTotal = item.price * item.quantity
      const discount = (itemTotal * item.discount) / 100
      return total + (itemTotal - discount)
    }, 0)
  }

  const getItemsCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotal,
        getItemsCount,
        getTotalWithDiscount
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}