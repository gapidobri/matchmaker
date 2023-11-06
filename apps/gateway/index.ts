import { Server } from 'socket.io';
import cookie from 'cookie';

const io = new Server(3000, {
  cors: { credentials: true },
});

io.on('connection', (socket) => {
  console.log('new connection');

  const cookieString = socket.request.headers.cookie;
  if (!cookieString) return;

  const cookies = cookie.parse(cookieString);
  const sessionToken = cookies['next-auth.session-token'];
  if (!sessionToken) return;

  setTimeout(() => {
    socket.emit('updateParty');
  }, 3000);
});
