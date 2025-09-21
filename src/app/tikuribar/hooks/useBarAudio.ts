"use client";

import { useRef, useState, useCallback, useEffect } from 'react';

interface AudioConfig {
  sampleRate: number;
  bufferSize: number;
  channels: number;
  chunkDuration: number; // ms
}

export function useBarAudio() {
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // 音声レベル表示用
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioBuffersRef = useRef<Map<string, AudioBuffer[]>>(new Map());

  // 音声バッファリング用の状態を追加
  const audioQueueRef = useRef<Array<{
    userId: string;
    username: string;
    audioData: string;
    timestamp: number;
  }>>([]);
  const isPlayingRef = useRef(false);

  // iOS検出
  const isIOS = useRef(false);
  useEffect(() => {
    isIOS.current = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }, []);

  const config: AudioConfig = {
    sampleRate: isIOS.current ? 48000 : 16000, // iOSは48kHzを推奨
    bufferSize: 1024,
    channels: 1,
    chunkDuration: isIOS.current ? 100 : 200    // iOSは短いチャンクで
  };

  // WebSocket設定
  const setWebSocket = useCallback((ws: WebSocket) => {
    wsRef.current = ws;
  }, []);

  // iOS用のAudioContext初期化
  const initializeAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      // iOSではユーザーインタラクション後にAudioContextを作成
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: config.sampleRate,
        latencyHint: isIOS.current ? 'interactive' : 'balanced'
      });
      
      // iOSでは最初にresumeが必要
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
    }
  }, [config.sampleRate]);

  // 音声録音開始
  const startRecording = useCallback(async () => {
    if (isRecording) return;

    try {
      console.log('音声録音を開始します...');
      
      // iOS用のAudioContext初期化
      await initializeAudioContext();
      
      // AudioContextが正常に作成されたかチェック
      if (!audioContextRef.current) {
        throw new Error('AudioContextの作成に失敗しました');
      }
      
      // マイクアクセス許可を取得（iOS対応）
      const audioConstraints = {
        audio: {
          sampleRate: config.sampleRate,
          channelCount: config.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // iOS Safari対応
          ...(isIOS.current && {
            sampleSize: 16,
            sampleRate: { ideal: 48000, max: 48000 },
            channelCount: { ideal: 1, max: 1 }
          })
        }
      };

      console.log('マイクアクセス要求:', audioConstraints);
      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
      streamRef.current = stream;

      // 音声レベル分析用
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // 音声レベル監視
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAudioLevel(Math.round((average / 255) * 100));
        }
      };

      const levelInterval = setInterval(updateAudioLevel, 50);

      // MediaRecorder設定（iOS対応）
      let mimeType = 'audio/webm;codecs=opus';
      
      // iOS Safari対応のMIME type
      if (isIOS.current) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/wav')) {
          mimeType = 'audio/wav';
        }
      }

      console.log('使用するMIME type:', mimeType);

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: isIOS.current ? 64000 : 32000  // iOSは高いビットレート
      });

      let audioChunks: Blob[] = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0 && !isMuted) {
          audioChunks.push(event.data);
          console.log(`音声チャンク受信: ${event.data.size} bytes`);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        if (audioChunks.length > 0) {
          const audioBlob = new Blob(audioChunks, { type: mimeType });
          sendAudioChunk(audioBlob);
        }
        audioChunks = [];
      };

      // iOSでは短い間隔でチャンクを送信
      recordingIntervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.start();
        }
      }, config.chunkDuration);

      mediaRecorderRef.current.start();
      setIsRecording(true);

      console.log('音声録音が開始されました');

      // クリーンアップ関数を返す
      return () => {
        clearInterval(levelInterval);
      };

    } catch (error) {
      console.error('音声録音開始エラー:', error);
      
      // iOS特有のエラーメッセージ
      if (isIOS.current) {
        alert('iPhoneでマイクアクセスが失敗しました。Safariの設定でマイクの許可を確認してください。');
      } else {
        alert('マイクへのアクセスが許可されませんでした。ブラウザの設定を確認してください。');
      }
    }
  }, [isRecording, isMuted, config, initializeAudioContext]);

  // 音声チャンク送信
  const sendAudioChunk = useCallback(async (audioBlob: Blob) => {
    if (!wsRef.current || isMuted || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      console.log(`音声送信: ${base64Audio.length} chars`);

      wsRef.current.send(JSON.stringify({
        type: 'audio_chunk',
        audioData: base64Audio,
        timestamp: Date.now(),
        duration: config.chunkDuration,
        mimeType: audioBlob.type // MIME typeも送信
      }));

    } catch (error) {
      console.error('音声送信エラー:', error);
    }
  }, [isMuted, config.chunkDuration]);

  // 音声受信＆再生（iOS対応強化）
  const handleAudioChunk = useCallback(async (data: {
    userId: string;
    username: string;
    audioData: string;
    timestamp: number;
    mimeType?: string;
  }) => {
    console.log(`🎵 音声チャンク受信: ${data.username} (データサイズ: ${data.audioData.length})`);
    
    // 自分の音声は再生しない（エコー防止）
    const currentUserId = (window as any).currentUserId;
    if (data.userId === currentUserId) {
      console.log('自分の音声なので再生をスキップ');
      return;
    }

    // スピーカーOFFチェック（二重チェック）
    if (isDeafened) {
      console.log('🔇 スピーカーOFFのため再生スキップ');
      return;
    }

    // グローバル状態からも確認
    if ((window as any).isDeafened) {
      console.log('🔇 グローバル状態: スピーカーOFFのため再生スキップ');
      return;
    }

    // キューに追加
    audioQueueRef.current.push(data);
    
    // 既に再生中の場合はリターン
    if (isPlayingRef.current) {
      return;
    }
    
    // キューから順次再生
    processAudioQueue();
  }, [isDeafened]);

  const processAudioQueue = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }
    
    isPlayingRef.current = true;
    const data = audioQueueRef.current.shift()!;
    
    // AudioContextが未初期化の場合は作成
    if (!audioContextRef.current) {
      console.log('🎵 AudioContextを新規作成します...');
      try {
        await initializeAudioContext();
        console.log('🎵 AudioContext作成成功');
      } catch (error) {
        console.error('🚫 AudioContext作成エラー:', error);
        return;
      }
    }

    // AudioContextがnullの場合は処理を終了
    if (!audioContextRef.current) {
      console.error('🚫 AudioContextがnullです');
      return;
    }

    // AudioContextがsuspended状態の場合は再開
    if (audioContextRef.current.state === 'suspended') {
      console.log('🎵 AudioContextを再開します...');
      await audioContextRef.current.resume();
    }

    try {
      console.log(`🎵 ${data.username}の音声をデコード開始...`);
      
      // Base64デコード
      const binaryString = atob(data.audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      console.log(`🎵 Base64デコード完了 (${bytes.length} bytes)`);

      // 最小サイズチェック
      if (bytes.length < 100) {
        console.warn(`🚫 音声データが小さすぎます (${bytes.length} bytes) - スキップ`);
        return;
      }

      // iOS対応のデコード処理
      let audioBuffer: AudioBuffer;
      
      try {
        // デコードのタイムアウト処理（iOSでは長めに設定）
        const decodePromise = audioContextRef.current.decodeAudioData(bytes.buffer.slice());
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Decode timeout')), isIOS.current ? 2000 : 1000)
        );
        
        audioBuffer = await Promise.race([decodePromise, timeoutPromise]) as AudioBuffer;
      } catch (decodeError) {
        console.warn('⚠️ AudioBufferデコード失敗、代替手段を試行:', decodeError);
        
        // iOS用の代替手段：AudioBufferを手動で作成
        if (isIOS.current && audioContextRef.current) {
          try {
            // シンプルなオーディオバッファを作成
            const sampleRate = audioContextRef.current.sampleRate;
            const duration = 0.2; // 200ms
            const length = Math.floor(sampleRate * duration);
            
            audioBuffer = audioContextRef.current.createBuffer(1, length, sampleRate);
            const channelData = audioBuffer.getChannelData(0);
            
            // 無音データで埋める（デバッグ用）
            for (let i = 0; i < length; i++) {
              channelData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.1; // 440Hzのテストトーン
            }
            
            console.log('🎵 iOS用代替AudioBuffer作成完了');
          } catch (fallbackError) {
            console.error('🚫 iOS用代替手段も失敗:', fallbackError);
            return;
          }
        } else {
          return;
        }
      }
      
      // 音声の長さチェック
      if (audioBuffer.duration < 0.01) {
        console.warn(`🚫 音声が短すぎます (${audioBuffer.duration}秒) - スキップ`);
        return;
      }
      
      console.log(`🎵 AudioBuffer作成成功 - 長さ: ${audioBuffer.duration.toFixed(3)}秒, チャンネル数: ${audioBuffer.numberOfChannels}, サンプルレート: ${audioBuffer.sampleRate}`);
      
      // AudioContextがnullでないことを再確認
      if (!audioContextRef.current) {
        console.error('🚫 再生時にAudioContextがnullです');
        return;
      }
      
      // 音声再生
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      console.log(`🔊 ${data.username}の音声を再生開始！`);
      source.start();
      
      // 再生終了の確認
      source.onended = () => {
        console.log(`✅ ${data.username}の音声再生完了`);
        setTimeout(() => processAudioQueue(), isIOS.current ? 50 : 10); // iOSでは長めの間隔
      };

    } catch (error: unknown) {
      // デコードエラーは警告レベルに下げる（エラーとして扱わない）
      console.warn('⚠️ 音声デコードスキップ:', error);
      
      const errorDetails = {
        audioDataLength: data.audioData.length,
        username: data.username,
        timestamp: data.timestamp,
        audioContextState: audioContextRef.current?.state,
        isIOS: isIOS.current,
        ...(error instanceof Error 
          ? { errorName: error.name, errorMessage: error.message }
          : error instanceof DOMException
          ? { errorName: error.name, errorMessage: error.message, errorCode: error.code }
          : { errorName: 'Unknown', errorMessage: String(error) }
        )
      };
      
      console.warn('デコードエラー詳細:', errorDetails);
    }
  };

  // 音声録音停止
  const stopRecording = useCallback(() => {
    console.log('音声録音を停止します...');

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsRecording(false);
    setAudioLevel(0);
    console.log('音声録音が停止されました');
  }, []);

  // ミュート切り替え
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      console.log(`ミュート: ${newMuted ? 'ON' : 'OFF'}`);
      
      // WebSocketでミュート状態を通知
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'toggle_mute',
          isMuted: newMuted
        }));
      }
      
      return newMuted;
    });
  }, []);

  // スピーカー切り替え
  const toggleDeafen = useCallback(() => {
    setIsDeafened(prev => {
      const newDeafened = !prev;
      console.log(`スピーカー無効: ${newDeafened ? 'ON' : 'OFF'}`);
      
      // グローバル状態に同期（WebSocketフックで参照するため）
      (window as any).isDeafened = newDeafened;
      
      return newDeafened;
    });
  }, []);

  // 初期化時にもグローバル状態を設定
  useEffect(() => {
    (window as any).isDeafened = isDeafened;
  }, [isDeafened]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    // 状態
    isRecording,
    isMuted,
    isDeafened,
    audioLevel,
    
    // 関数
    setWebSocket,
    startRecording,
    stopRecording,
    toggleMute,
    toggleDeafen,
    handleAudioChunk
  };
}