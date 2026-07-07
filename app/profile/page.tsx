import AuthCheck from "@/components/AuthCheck";
import ProfileClient from "./ProfileClient";

export const metadata = {
  title: "Hồ sơ - Easy Chinese",
};

export default function ProfilePage() {
  return (
    <AuthCheck>
      <ProfileClient />
    </AuthCheck>
  );
}
