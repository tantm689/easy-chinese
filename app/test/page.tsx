import { getTopics } from '@/lib/queries';

export default async function TestPage() {
  let topics: any[] = [];
  let errorMsg: string | null = null;

  try {
    topics = await getTopics();
    console.log("=== DATA FROM SUPABASE ===");
    console.log(topics);
    console.log("==========================");
  } catch (error: any) {
    console.error("Failed to fetch topics:", error);
    errorMsg = error.message;
  }

  return (
    <main className="p-8 min-h-screen bg-gray-50 text-gray-900">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      {errorMsg ? (
        <div className="p-4 bg-red-100 text-red-700 rounded-md border border-red-300">
          <p className="font-semibold">❌ Lỗi truy vấn:</p>
          <p>{errorMsg}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-green-100 text-green-800 rounded-md border border-green-300">
            <p className="font-semibold">✅ Lấy dữ liệu thành công!</p>
            <p className="text-sm">Đã log dữ liệu ra terminal server. Dưới đây là kết quả JSON trực tiếp:</p>
          </div>
          
          <pre className="bg-white p-4 rounded-md border border-gray-200 shadow-sm overflow-auto max-h-[600px] text-sm">
            {topics.length > 0 
              ? JSON.stringify(topics, null, 2) 
              : "Không có dữ liệu (Mảng rỗng)"}
          </pre>
        </div>
      )}
    </main>
  );
}
