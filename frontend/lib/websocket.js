'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './auth';

export function useWebSocket() {
    const [connected, setConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState(null);
    const { user } = useAuth();
    const wsRef = useRef(null);
    const listenersRef = useRef(new Map());
    const reconnectTimeout = useRef(null);

    const connect = useCallback(() => {
        if (!user) return; // Wait for user to be available

        const url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';
        try {
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => {
                setConnected(true);
                console.log('🟢 WebSocket connected');
                // Send auth message
                ws.send(JSON.stringify({
                    type: 'auth',
                    workspaceId: user.workspace_id,
                    token: localStorage.getItem('token') // For extra security if backend checks it
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    setLastEvent(message);

                    // Notify listeners
                    const typeListeners = listenersRef.current.get(message.type) || [];
                    typeListeners.forEach(cb => cb(message.data));

                    // Notify wildcard listeners
                    const wildcardListeners = listenersRef.current.get('*') || [];
                    wildcardListeners.forEach(cb => cb(message));
                } catch {
                    // Ignore
                }
            };

            ws.onclose = () => {
                setConnected(false);
                console.log('🔴 WebSocket disconnected, reconnecting...');
                reconnectTimeout.current = setTimeout(connect, 3000);
            };

            ws.onerror = () => {
                ws.close();
            };
        } catch {
            reconnectTimeout.current = setTimeout(connect, 3000);
        }
    }, [user]);

    useEffect(() => {
        connect();
        return () => {
            if (wsRef.current) wsRef.current.close();
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        };
    }, [connect]);

    const subscribe = useCallback((eventType, callback) => {
        if (!listenersRef.current.has(eventType)) {
            listenersRef.current.set(eventType, []);
        }
        listenersRef.current.get(eventType).push(callback);

        return () => {
            const listeners = listenersRef.current.get(eventType) || [];
            listenersRef.current.set(eventType, listeners.filter(cb => cb !== callback));
        };
    }, []);

    const broadcastLocal = useCallback((type, data) => {
        if (wsRef.current && wsRef.current.readyState === 1) {
            wsRef.current.send(JSON.stringify({ type, data }));
        }
    }, []);

    return { connected, lastEvent, subscribe, broadcastLocal };
}
