import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#030308" />
        <meta name="talentapp:project_verification" content="dd37cf261777fe9809a7b7cbdf7ade559547a19fa03f833549a727820fe69b8086867db239c5242994aefae9059143c43b741c1a50a3b482334844a756f345ee" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
