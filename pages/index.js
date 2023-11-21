import Script from "next/script";

function Home() {
  return (
    <div>
      <Script src="/brain.js" strategy="beforeInteractive" />
    </div>
  );
}

export default Home;

function Test() {
  return (
    <div>
      <Script src="/brain.js" strategy="beforeInteractive" />
    </div>
  );
}

function Test2() {
  console.log("test2");
}
