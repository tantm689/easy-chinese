import { Metadata } from "next";
import SignupClient from "./SignupClient";

export const metadata: Metadata = {
  title: "Đăng ký - Easy Chinese",
  description: "Tạo tài khoản Easy Chinese để bắt đầu học",
};

export default function SignupPage() {
  return <SignupClient />;
}
