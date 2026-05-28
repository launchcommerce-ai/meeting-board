import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f8f9fa;
          color: #333;
        }

        input[type="text"],
        select {
          font-family: inherit;
        }

        input[type="text"]:focus,
        select:focus {
          outline: none;
          border-color: #ff7a1a !important;
          box-shadow: 0 0 0 3px rgba(255, 122, 26, 0.1);
        }

        button {
          font-family: inherit;
        }
      `}</style>
      <Component {...pageProps} />
    </>
  )
}