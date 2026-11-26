import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={title:"Bé vui học Tiếng Việt",description:"Khám phá từ ngữ tiếng Việt qua hình ảnh, âm thanh và video."};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="vi"><body>{children}</body></html>;}
