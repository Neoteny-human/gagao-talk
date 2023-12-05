const SocketIO = require('socket.io');
const { removeRoom } = require('./services');
const User = require('./schemas/user');

module.exports = (server, app, sessionMiddleware) => {
    const io = SocketIO(server, { path: '/socket.io' });
    app.set('io', io); // 라우터에서 req.app.get('io')로 io 객체에 접근이 가능하도록 저장해둠.
    const room = io.of('/room');
    const chat = io.of('/chat');

    const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
    chat.use(wrap(sessionMiddleware));

    room.on('connection', (socket) => {
        console.log('room 네임스페이스 접속 성공');
        socket.on('disconnect', () => {
            console.log('room 네임스페이스 접속 해제')
        })
    });

    async function findUser(session) {
        return await User.findOne({ _id: session.passport.user });
    }
    chat.on('connection', async (socket) => {
        console.log('chat 네임스페이스 접속');
        socket.on('join', async (data) => { // data는 브라우저에서 보낸 방 아이디.
            // const session = socket.request.session;
            // const user = await findUser(session);
            // socket.user = user;
            console.log(`${data.user}가 ${data.url}에 조인함`)
            socket.join(data.url); // 네임스페이스 아래에 존재하는 방에 접속.
            // socket.to(data).emit('join', {
            //     user: 'system',
            //     chat: `${user.username}님이 입장하셨습니다.`
            // })
        });
        socket.on('disconnect', async () => {
            console.log('chat 네임스페이스 접속 해제');
            const { referer } = socket.request.headers;
            const roomId = new URL(referer).pathname.split('/').at(-1);
            // const currentRoom = chat.adapter.rooms.get(roomId);
            // const userCount = currentRoom?.size || 0;
            // if (userCount === 0) {
            //     await removeRoom(roomId);
            //     room.emit('removeRoom', roomId);
            //     console.log('방 제거 요청 성공');
            // } else {
            //     socket.to(roomId).emit('exit', {
            //         user: 'system',
            //         chat: `${socket.user.username}님이 퇴장하셨습니다.`
            //     })
            // }
            
            // socket.to(roomId).emit('exit', {
            //     user: 'system',
            //     chat: `${socket.user.username}님이 퇴장하셨습니다.`
            // })
        })
    });
};
