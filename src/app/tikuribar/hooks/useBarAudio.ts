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

  const config: AudioConfig = {
    sampleRate: 16000,
    bufferSize: 1024,
    channels: 1,
    chunkDuration: 200    // 100ms → 200ms に変更（音質向上）
  };

  // WebSocket設定
  const setWebSocket = useCallback((ws: WebSocket) => {
    wsRef.current = ws;
  }, []);

  // 音声録音開始
  const startRecording = useCallback(async () => {
    if (isRecording) return;

    try {
      console.log('音声録音を開始します...');
      
      // マイクアクセス許可を取得
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: config.sampleRate,
          channelCount: config.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;

      // AudioContext作成
      audioContextRef.current = new AudioContext({
        sampleRate: config.sampleRate
      });

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

      // MediaRecorder設定を修正（75行目あたり）
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : undefined,
        audioBitsPerSecond: 32000  // ビットレートを上げる
      });

      let audioChunks: Blob[] = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0 && !isMuted) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        if (audioChunks.length > 0) {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          sendAudioChunk(audioBlob);
        }
        audioChunks = [];
      };

      // 定期的に音声チャンクを送信
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
      alert('マイクへのアクセスが許可されませんでした。ブラウザの設定を確認してください。');
    }
  }, [isRecording, isMuted, config]);

  // 音声チャンク送信
  const sendAudioChunk = useCallback(async (audioBlob: Blob) => {
    if (!wsRef.current || isMuted || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      wsRef.current.send(JSON.stringify({
        type: 'audio_chunk',
        audioData: base64Audio,
        timestamp: Date.now(),
        duration: config.chunkDuration
      }));

    } catch (error) {
      console.error('音声送信エラー:', error);
    }
  }, [isMuted, config.chunkDuration]);

  // 音声受信＆再生
  const handleAudioChunk = useCallback(async (data: {
    userId: string;
    username: string;
    audioData: string;
    timestamp: number;
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
        audioContextRef.current = new AudioContext({
          sampleRate: config.sampleRate
        });
        console.log('🎵 AudioContext作成成功');
      } catch (error) {
        console.error('🚫 AudioContext作成エラー:', error);
        return;
      }
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

      // WebM音声データをデコード
      console.log('🎵 AudioBufferデコード開始...');
      
      // デコードのタイムアウト処理
      const decodePromise = audioContextRef.current.decodeAudioData(bytes.buffer.slice());
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Decode timeout')), 1000)
      );
      
      const audioBuffer = await Promise.race([decodePromise, timeoutPromise]) as AudioBuffer;
      
      // 音声の長さチェック
      if (audioBuffer.duration < 0.01) {
        console.warn(`🚫 音声が短すぎます (${audioBuffer.duration}秒) - スキップ`);
        return;
      }
      
      console.log(`🎵 AudioBuffer作成成功 - 長さ: ${audioBuffer.duration.toFixed(3)}秒, チャンネル数: ${audioBuffer.numberOfChannels}, サンプルレート: ${audioBuffer.sampleRate}`);
      
      // 音声再生
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      console.log(`🔊 ${data.username}の音声を再生開始！`);
      source.start();
      
      // 再生終了の確認
      source.onended = () => {
        console.log(`✅ ${data.username}の音声再生完了`);
        setTimeout(() => processAudioQueue(), 10); // 少し間隔を空けて次を再生
      };

    } catch (error: unknown) {
      // デコードエラーは警告レベルに下げる（エラーとして扱わない）
      console.warn('⚠️ 音声デコードスキップ:', error);
      
      const errorDetails = {
        audioDataLength: data.audioData.length,
        username: data.username,
        timestamp: data.timestamp,
        audioContextState: audioContextRef.current?.state,
        ...(error instanceof Error 
          ? { errorName: error.name, errorMessage: error.message }
          : error instanceof DOMException
          ? { errorName: error.name, errorMessage: error.message, errorCode: error.code }
          : { errorName: 'Unknown', errorMessage: String(error) }
        )
      };
      
      console.warn('デコードエラー詳細:', errorDetails);
      
      // エラーが続く場合のみコンソールエラーとして出力
      // この部分は、useBarAudio内ではなく、この関数内で管理する方が適切かもしれません。
      // 現在のコードでは、useBarAudio内でlastDecodeErrorを追加していますが、
      // この関数内ではその変数にアクセスできません。
      // この問題を解決するために、useBarAudio内にlastDecodeErrorを追加するか、
      // この関数内でグローバルなエラー状態を管理する必要があります。
      // ここでは、エラーが発生した場合に警告を出力するようにします。
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