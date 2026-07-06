"use client";

// Danh sách các bước theo thứ tự chuẩn
export const LESSON_STEPS = [
  { id: "dialogue", name: "Bài khóa", path: "dialogue" },
  { id: "vocabulary", name: "Từ vựng", path: "vocabulary" },
  { id: "vocab-exercise", name: "Luyện từ", path: "vocab-exercise" },
  { id: "patterns", name: "Câu mẫu", path: "patterns" },
];

export function markStepVisited(lessonId: string, stepId: string) {
  if (typeof window === "undefined") return;
  
  const key = `lesson_${lessonId}_visited_steps`;
  try {
    const stored = sessionStorage.getItem(key);
    let visited: string[] = stored ? JSON.parse(stored) : [];
    
    if (!visited.includes(stepId)) {
      visited.push(stepId);
      sessionStorage.setItem(key, JSON.stringify(visited));
    }
  } catch (err) {
    console.error("Error saving step progress", err);
  }
}

export function getMissingStep(lessonId: string) {
  if (typeof window === "undefined") return null;
  
  const key = `lesson_${lessonId}_visited_steps`;
  try {
    const stored = sessionStorage.getItem(key);
    const visited: string[] = stored ? JSON.parse(stored) : [];
    
    // Tìm bước đầu tiên bị thiếu theo thứ tự
    for (const step of LESSON_STEPS) {
      if (!visited.includes(step.id)) {
        return step;
      }
    }
    return null; // Đã đủ
  } catch (err) {
    console.error("Error reading step progress", err);
    return LESSON_STEPS[0]; // Fallback
  }
}
