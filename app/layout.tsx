import './globals.css'

export const metadata = {
  title: 'Utah x Unchained',
  description: 'Utah AI-Initiative',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
