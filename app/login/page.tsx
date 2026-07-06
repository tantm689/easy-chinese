import { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Đăng nhập - Easy Chinese",
  description: "Đăng nhập vào Easy Chinese để tiếp tục quá trình học",
};

export default function LoginPage() {
  return <LoginClient />;
}
