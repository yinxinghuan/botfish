import { useCallback, useEffect, useRef, useState } from 'react';

function toBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}
function fromBase64(str: string): string {
  return decodeURIComponent(escape(atob(str)));
}

export interface LeaderboardEntry {
  user_id: string;
  name: string;
  avatar_url: string;
  score: number;
  rank: number;
  isMe?: boolean;
}

interface AigramUser {
  telegram_id: string;
  name: string;
  head_url: string;
}

interface AigramResponse<T> {
  retcode: number;
  errcode?: number;
  msg: string;
  data: T;
}

// Wire format returned by /note/aigram/ai/game/rank/score/list/by/session_id
interface RankRow {
  id: string;
  game_id: string;
  session_id: string;
  user_id: string;
  score: string;        // server returns score as string
  rank: number;
  user_name: string;
  head_url: string;
  create_time: number;
  update_time: number;
}

function getAigramContext() {
  const params = new URLSearchParams(window.location.search);
  const telegramId = params.get('telegram_id') ?? null;
  const rawOrigin = params.get('api_origin');
  const apiOrigin = rawOrigin ? decodeURIComponent(rawOrigin) : null;
  const sessionId = params.get('session_id') ?? null;
  return { telegramId, apiOrigin, sessionId };
}

function callAigramAPI<T>(
  apiOrigin: string,
  url: string,
  method: 'GET' | 'POST' = 'GET',
  data: unknown = null,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();
    let timer: ReturnType<typeof setTimeout>;
    const targetOrigin = new URL(apiOrigin).origin;

    const handler = (event: MessageEvent) => {
      if (event.origin !== targetOrigin) return;
      const msg = typeof event.data === 'string' ? event.data : '';
      if (!msg.startsWith('callAPIResult-')) return;
      try {
        const result = JSON.parse(fromBase64(msg.slice('callAPIResult-'.length)));
        if (result.request_id !== requestId) return;
        window.removeEventListener('message', handler);
        clearTimeout(timer);
        if (result.success) resolve(result.data as T);
        else reject(new Error(result.error ?? 'API error'));
      } catch { /* ignore */ }
    };

    window.addEventListener('message', handler);
    window.parent.postMessage(
      `callAPI-${toBase64(JSON.stringify({
        url,
        method,
        data,
        request_id: requestId,
        emitter: window.location.origin,
      }))}`,
      targetOrigin
    );
    timer = setTimeout(() => {
      window.removeEventListener('message', handler);
      reject(new Error('timeout'));
    }, 15_000);
  });
}

export function useGameScore() {
  const { telegramId, apiOrigin, sessionId } = getAigramContext();
  const isInAigram = !!telegramId && !!apiOrigin;
  // canRank is the real gate — both server endpoints require session_id, and
  // submit also needs the parent (apiOrigin) to attach the user's token.
  const canRank = isInAigram && !!sessionId;

  const [currentUser, setCurrentUser] = useState<AigramUser | null>(null);
  const currentUserRef = useRef<AigramUser | null>(null);

  useEffect(() => {
    if (!isInAigram || !telegramId || !apiOrigin) return;
    callAigramAPI<AigramResponse<AigramUser>>(
      apiOrigin,
      `/note/telegram/user/get/info/by/telegram_id?telegram_id=${telegramId}`
    )
      .then(res => {
        setCurrentUser(res.data);
        currentUserRef.current = res.data;
      })
      .catch(() => { /* silent */ });
  }, []);

  const submitScore = useCallback(async (score: number) => {
    if (!canRank || score <= 0) return;
    try {
      await callAigramAPI<AigramResponse<null>>(
        apiOrigin!,
        '/note/aigram/ai/game/rank/score/save',
        'POST',
        { session_id: sessionId, score },
      );
    } catch { /* silent */ }
  }, [canRank, apiOrigin, sessionId]);

  const fetchLeaderboard = useCallback(async (): Promise<LeaderboardEntry[]> => {
    if (!canRank) return [];
    try {
      const res = await callAigramAPI<AigramResponse<RankRow[]>>(
        apiOrigin!,
        `/note/aigram/ai/game/rank/score/list/by/session_id?session_id=${encodeURIComponent(sessionId!)}`,
      );
      const rows: RankRow[] = Array.isArray(res?.data) ? res.data : [];
      return rows.map(r => ({
        user_id: String(r.user_id),
        name: r.user_name,
        avatar_url: r.head_url,
        score: Number(r.score),
        rank: r.rank,
        isMe: telegramId != null && String(r.user_id) === telegramId,
      }));
    } catch {
      return [];
    }
  }, [canRank, apiOrigin, sessionId, telegramId]);

  const postToAigram = useCallback(async (photoUrl: string): Promise<string | null> => {
    if (!isInAigram || !apiOrigin) throw new Error('not in aigram');
    const res = await callAigramAPI<{ data: string }>(
      apiOrigin,
      '/note/telegram/post/app/send/have/users',
      'POST',
      { photo_url: photoUrl, type: 7, telegram_id_list: telegramId ? [telegramId] : [], style: 'No Style' },
    );
    const postId = typeof res === 'string' ? res : (res as { data: string })?.data ?? null;
    if (postId) {
      try {
        window.parent.postMessage(
          `AW.POST.OPEN-${toBase64(JSON.stringify({ post_id: postId }))}`,
          new URL(apiOrigin).origin
        );
      } catch { /* ignore */ }
    }
    return postId;
  }, [isInAigram, apiOrigin, telegramId]);

  return {
    isInAigram,
    telegramId,
    sessionId,
    canRank,
    currentUser,
    submitScore,
    fetchLeaderboard,
    postToAigram,
  };
}
