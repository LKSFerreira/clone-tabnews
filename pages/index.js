import Script from 'next/script'

export default function Home() {
  return (
    <div>
      <Script src="/brain.js" strategy="beforeInteractive" />
    </div>
  )
}
