// app/layout.tsx
import { Inter } from 'next/font/google'
import './globals.css'
import { SocketProvider } from '../components/providers/socket-provider'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SocketProvider>
          {children}
        </SocketProvider>
      </body>
    </html>
  )
}