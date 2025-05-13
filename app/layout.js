import Link from "next/link";
import "./globals.css";
import {Fugaz_One, Open_Sans} from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import Head from "./head";

// const geistSans = localFont({
//   src: "./fonts/GeistVF.woff",
//   variable: "--font-geist-sans",
//   weight: "100 900",
// });
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });

const opensans=Open_Sans({subsets:["latin"]})
const fugaz=Fugaz_One({subsets:["latin"],weight:['400']})

 
export const metadata = {
  title: "Moodl",
  description: "Track your daily mood everyday of the year!!",
};

export default function RootLayout({ children }) {
  const header=(
    <header className="p-4 sm:p-8 items-center flex justify-between gap-4">
      <Link href={'/'}>
        <h1 className={'text-base sm:text-lg textGradient '+fugaz.className}>Moodl</h1>
      </Link>
        <div className="flex items-center justify-between">
          Placeholder CTA||Stats
        </div>
    </header>
  )

  const footer=(
    <footer className="p-4 sm:p-8 grid place-items-center">
      <p className={'text-indigo-500 '+fugaz.className}>Created with LOVE</p>
    </footer>
  )

  return (
    <html lang="en">
      <Head/>
      <AuthProvider>
      <body className={'w-full max-w-[1000px] mx-auto text-sm sm:text-base min-h-screen flex flex-col text-slate-800 '+opensans.className}>
        {header}
        {children}
        {footer}
      </body>
      </AuthProvider>
    </html>
  );
}
