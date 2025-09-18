import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { supabaseAdmin } from '@/utils/supabase/server'; // 変更

// VAPID設定
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const { postId, likerId, postOwnerId } = await request.json();

    if (!postId || !likerId || !postOwnerId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 自分自身の投稿にいいねした場合は通知しない
    if (likerId === postOwnerId) {
      return NextResponse.json({ message: 'No notification needed for self-like' });
    }

    // いいねしたユーザーの情報を取得
    const { data: likerData } = await supabaseAdmin // supabaseAdminを使用
      .from('usels')
      .select('username, displayName')
      .eq('user_id', likerId)
      .single();

    const likerName = likerData?.displayName || likerData?.username || 'ユーザー';

    // 投稿内容の一部を取得
    const { data: postData } = await supabaseAdmin // supabaseAdminを使用
      .from('todos')
      .select('title')
      .eq('id', postId)
      .single();

    const postPreview = postData?.title ? 
      (postData.title.length > 50 ? postData.title.substring(0, 50) + '...' : postData.title) : 
      '投稿';

    // データベースに通知を保存
    const { error: insertError } = await supabaseAdmin.from('notifications').insert({ // supabaseAdminを使用
      user_id: postOwnerId,
      type: 'like',
      title: 'いいねされました',
      message: `${likerName}さんがあなたの投稿にいいねしました`,
      data: {
        postId: postId,
        likerId: likerId,
        postPreview: postPreview,
      },
    });

    if (insertError) {
      console.error('Error inserting notification:', insertError);
      return NextResponse.json({ error: 'Failed to save notification' }, { status: 500 });
    }

    // プッシュ通知の送信
    const { data: subscriptions } = await supabaseAdmin // supabaseAdminを使用
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', postOwnerId);

    if (subscriptions && subscriptions.length > 0) {
      const promises = subscriptions.map(async (subscription) => {
        try {
          const pushSubscription = JSON.parse(subscription.subscription);
          await webpush.sendNotification(pushSubscription, JSON.stringify({
            title: '💖 いいねされました',
            body: `${likerName}さんがあなたの投稿にいいねしました`,
            icon: '/android-launchericon-192-192.png',
            badge: '/android-launchericon-48-48.png',
          }));
        } catch (error) {
          console.error('Error sending push notification:', error);
        }
      });
      await Promise.all(promises);
    }

    return NextResponse.json({ message: 'Like notification sent successfully' });

  } catch (error) {
    console.error('Error in send-like-notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
