import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { WebSocketProvider } from './contexts/WebSocketContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pictionary Game',
  description: 'A real-time multiplayer drawing and guessing game',
}

function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <WebSocketProvider>
      {children}
    </WebSocketProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
} 