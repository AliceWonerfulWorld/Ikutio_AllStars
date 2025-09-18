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
    
    console.log('=== Like Notification API Called ===');
    console.log('postId:', postId);
    console.log('likerId:', likerId);
    console.log('postOwnerId:', postOwnerId);

    if (!postId || !likerId || !postOwnerId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 自分自身の投稿にいいねした場合は通知しない
    if (likerId === postOwnerId) {
      return NextResponse.json({ message: 'No notification needed for self-like' });
    }

    // いいねしたユーザーの情報を取得
    console.log('Fetching liker data...');
    const { data: likerData, error: likerError } = await supabaseAdmin
      .from('usels')
      .select('username, displayName, user_id')
      .eq('user_id', likerId)
      .maybeSingle();

    console.log('Liker query result:', { data: likerData, error: likerError });

    // ユーザー名の決定ロジック
    let likerName = 'ユーザー';
    if (likerData) {
      likerName = likerData.displayName || likerData.username || `ユーザー${likerId.slice(-4)}`;
    } else {
      // uselsテーブルにデータがない場合、likerIdの一部を使用
      likerName = `ユーザー${likerId.slice(-4)}`;
    }

    console.log('Final liker name:', likerName);

    // 投稿内容の一部を取得
    const { data: postData } = await supabaseAdmin
      .from('todos')
      .select('title')
      .eq('id', postId)
      .single();

    const postPreview = postData?.title ? 
      (postData.title.length > 50 ? postData.title.substring(0, 50) + '...' : postData.title) : 
      '投稿';

    // データベースに通知を保存
    const { error: insertError } = await supabaseAdmin.from('notifications').insert({
      user_id: postOwnerId,
      type: 'like',
      title: 'いいねされました',
      message: `${likerName}さんがあなたの投稿にいいねしました`,
      data: {
        postId: postId,
        likerId: likerId,
        postPreview: postPreview,
        likerName: likerName, // 追加：通知データにも名前を保存
      },
    });

    if (insertError) {
      console.error('Error inserting notification:', insertError);
      return NextResponse.json({ error: 'Failed to save notification' }, { status: 500 });
    }

    console.log('Notification saved successfully');

    // プッシュ通知の送信
    const { data: subscriptions } = await supabaseAdmin
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

    console.log('=== Like Notification API Completed Successfully ===');
    return NextResponse.json({ message: 'Like notification sent successfully' });

  } catch (error) {
    console.error('Error in send-like-notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
