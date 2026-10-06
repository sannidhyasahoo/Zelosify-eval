"use client";

import React from "react";
import AllProvider from "@/redux/core/AllProvider";
import "@/styles/globals.css";

export default function MyApp({ Component, pageProps }) {
  return (
    <AllProvider>
      <Component {...pageProps} />
    </AllProvider>
  );
}
