import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { supabaseAdmin } from '@/utils/supabase/server'; // 修正

// VAPID設定
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    // 環境変数チェック
    if (!process.env.NEXT_PUBLIC_VAPID_KEY || !process.env.VAPID_PRIVATE_KEY) {
      console.error('❌ VAPID keys not configured');
      return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 });
    }

    const { title, body, icon, badge, userId } = await request.json();

    // supabaseAdmin を使用
    let query = supabaseAdmin.from('push_subscriptions').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'No subscriptions found' });
    }

    // 各購読に通知を送信
    const promises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = JSON.parse(subscription.subscription);
        await webpush.sendNotification(pushSubscription, JSON.stringify({
          title,
          body,
          icon: icon || '/android-launchericon-192-192.png',
          badge: badge || '/android-launchericon-48-48.png',
          data: {
            url: '/',
            timestamp: Date.now(),
          },
        }));
      } catch (error) {
        console.error('Error sending notification:', error);
        // 無効な購読を削除
        await supabaseAdmin
          .from('push_subscriptions')
          .delete()
          .eq('id', subscription.id);
      }
    });

    await Promise.all(promises);

    return NextResponse.json({ 
      message: `Notification sent to ${subscriptions.length} subscribers` 
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
