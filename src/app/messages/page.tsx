'use client';

export default function MessagePage(){
  return (
    {/* ヘッダー */}
    <h1 className="text-x1 font-bold">メッセージ</h1>
   
   
   {/* メッセージ一覧 */}
  <div className="bg-gray-800 rounded-2xl p-4">
              <h2 className="text-xl font-bold mb-4">メッセージ一覧</h2>
              <div className="space-y-3">
                {['user1', 'user2', 'user3'].map((user) => (
                  <div key={user} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold">{user}</div>
                        <div className="text-sm text-gray-500">@{user}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
           )
}