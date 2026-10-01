import { API_BASE_URL } from './api';

export type ReactionType = 'LIKE' | 'DISLIKE';
export type CommentEventType = 'new_comment' | 'created_comment' | 'update_comment' | 'delete_comment';

export interface RealtimeReaction {
  evaluation_form_id: string;
  reactions_count: number;
  user_id: string;
  reaction_type: ReactionType;
}

export interface RealtimeComment {
  id: string;
  evaluation_form_id: string;
  user_id: string;
  user_email: string;
  comment_text: string;
  created_at: string;
  updated_at: string | null;
}

export interface ReactionUpdatedEvent {
  type: 'reaction_updated';
  like: RealtimeReaction;
}

export interface CommentRealtimeEvent {
  type: CommentEventType;
  comment: RealtimeComment;
}

export type RealtimeEvent = ReactionUpdatedEvent | CommentRealtimeEvent;
type RealtimeListener = (event: RealtimeEvent) => void;

const buildRealtimeUrl = () => {
  const url = new URL(API_BASE_URL);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/ws';
  url.search = '';
  return url.toString();
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isReactionType = (value: unknown): value is ReactionType => {
  return value === 'LIKE' || value === 'DISLIKE';
};

const normalizeReactionEvent = (
  raw: Record<string, unknown>
): ReactionUpdatedEvent | null => {
  const like = raw.like;
  if (!isRecord(like)) return null;

  const rawReactionType = like.reaction_type ?? like.reaction;
  if (
    typeof like.evaluation_form_id !== 'string' ||
    typeof like.reactions_count !== 'number' ||
    typeof like.user_id !== 'string' ||
    !isReactionType(rawReactionType)
  ) {
    return null;
  }

  return {
    type: 'reaction_updated',
    like: {
      evaluation_form_id: like.evaluation_form_id,
      reactions_count: like.reactions_count,
      user_id: like.user_id,
      reaction_type: rawReactionType,
    },
  };
};

const normalizeCommentEvent = (
  raw: Record<string, unknown>,
  type: CommentEventType
): CommentRealtimeEvent | null => {
  const comment = raw.comment;
  if (!isRecord(comment)) return null;

  if (
    typeof comment.id !== 'string' ||
    typeof comment.evaluation_form_id !== 'string' ||
    typeof comment.user_id !== 'string' ||
    typeof comment.comment_text !== 'string' ||
    typeof comment.created_at !== 'string'
  ) {
    return null;
  }

  return {
    type,
    comment: {
      id: comment.id,
      evaluation_form_id: comment.evaluation_form_id,
      user_id: comment.user_id,
      user_email: typeof comment.user_email === 'string' ? comment.user_email : 'Пользователь',
      comment_text: comment.comment_text,
      created_at: comment.created_at,
      updated_at: typeof comment.updated_at === 'string' ? comment.updated_at : null,
    },
  };
};

const normalizeRealtimeEvent = (raw: unknown): RealtimeEvent | null => {
  if (!isRecord(raw) || typeof raw.type !== 'string') return null;

  if (raw.type === 'reaction_updated') {
    return normalizeReactionEvent(raw);
  }

  if (
    raw.type === 'new_comment' ||
    raw.type === 'created_comment' ||
    raw.type === 'update_comment' ||
    raw.type === 'delete_comment'
  ) {
    return normalizeCommentEvent(raw, raw.type);
  }

  return null;
};

class RealtimeClient {
  private socket: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private reconnectAttempt = 0;
  private manuallyClosed = false;
  private readonly listeners = new Set<RealtimeListener>();

  subscribe(listener: RealtimeListener) {
    this.listeners.add(listener);
    this.connect();

    return () => {
      this.listeners.delete(listener);

      if (this.listeners.size === 0) {
        this.close();
      }
    };
  }

  private connect() {
    if (
      this.socket?.readyState === WebSocket.OPEN ||
      this.socket?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    this.manuallyClosed = false;
    this.socket = new WebSocket(buildRealtimeUrl());

    this.socket.onopen = () => {
      this.reconnectAttempt = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const realtimeEvent = normalizeRealtimeEvent(JSON.parse(event.data));
        if (!realtimeEvent) {
          console.error('Некорректное realtime-событие:', event.data);
          return;
        }

        this.listeners.forEach((listener) => listener(realtimeEvent));
      } catch (error) {
        console.error('Не удалось обработать realtime-событие:', error);
      }
    };

    this.socket.onclose = () => {
      this.socket = null;

      if (!this.manuallyClosed && this.listeners.size > 0) {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = () => {
      this.socket?.close();
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer !== null) return;

    const delay = Math.min(1000 * 2 ** this.reconnectAttempt, 10000);
    this.reconnectAttempt += 1;

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private close() {
    this.manuallyClosed = true;

    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.socket?.close();
    this.socket = null;
  }
}

const realtimeClient = new RealtimeClient();

export const subscribeToRealtime = (listener: RealtimeListener) => {
  return realtimeClient.subscribe(listener);
};
