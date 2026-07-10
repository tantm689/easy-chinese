import FloatingAssistantButton from "@/components/FloatingAssistantButton";

export default function LessonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <FloatingAssistantButton />
    </>
  );
}
