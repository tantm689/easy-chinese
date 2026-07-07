export function formatSpeakerName(speaker: string | null | undefined): string {
  if (!speaker) return "";
  if (speaker.startsWith("Nhân viên")) {
    return "Nhân viên";
  }
  return speaker;
}
