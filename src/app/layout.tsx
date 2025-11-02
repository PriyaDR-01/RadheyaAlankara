import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ShoppingCart } from '@/components/ShoppingCart'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Radheya Alankara - Premium Jewelry Collection',
  description: 'Discover exquisite handcrafted jewelry pieces that blend traditional artistry with contemporary design.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Header />
          <main>
            {children}
          </main>
          <Footer />
          <ShoppingCart />
        </Providers>
      </body>
    </html>
  )
}
