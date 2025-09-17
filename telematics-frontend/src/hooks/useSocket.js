import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import io from 'socket.io-client';

export function useSocket() {
    const [socket, setSocket] = useState(null);
    const { token } = useAuth();

    useEffect(() => {
        if (token) {
            const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
                auth: { token }
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
                setSocket(null);
            };
        }
    }, [token]);

    return socket;
}
