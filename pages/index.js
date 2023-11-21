import Script from "next/script";

function Home() {
  return (
    <div>
      <Script src="/brain.js" strategy="beforeInteractive" />
    </div>
  );
}

export default Home;
