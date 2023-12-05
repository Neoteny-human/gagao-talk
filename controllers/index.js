const Room = require("../schemas/room");
const Chat = require("../schemas/chat");
const User = require("../schemas/user");

const mongoose = require("mongoose");
const { removeRoom: removeRoomService } = require("../services");
const user = require("../schemas/user");

exports.renderLogin = (req, res, next) => {
  res.render("login");
};

exports.renderMain = async (req, res, next) => {
  try {
    const rooms = await Room.find({});
    res.render("main", { rooms, title: "GIF 채팅방" });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.renderFriend = async (req, res, next) => {
  try {
    const friends = await User.find({});
    const rooms = await Room.find({ users: { $in: [req.user._id] } }).populate(
      "users"
    );
    res.render("friend", {
      friends,
      title: "가가오톡",
      user: req.user._id,
      rooms,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};
exports.renderRoom = (req, res, next) => {
  res.render("room", { title: "GIF 채팅방 생성 " });
};
exports.createRoom = async (req, res, next) => {
  try {
    const { users } = req.body;
    // const userId1 = new mongoose.Types.ObjectId(users[0]);
    // const userId2 = new mongoose.Types.ObjectId(users[1]);
    const userId1 = users[0];
    const userId2 = users[1];

    // 같은 사람이 같은 방에 들어가는 것을 방지
    if (userId1 === userId2) {
      return res.status(403).send("같은 사람이 같은 방에 들어갈 수 없습니다.");
    }

    // 단 둘만 있는 방이 있는지 확인
    let room = await Room.findOne({
      users: { $all: [userId1, userId2], $size: 2 },
    });
    if (!room) {
      // 한 명은 과거에 나갔고, 한 명만 있는 방이 있는지 확인
      room = await Room.findOne({
        $or: [
          {
            users: { $all: [userId1], $size: 1 },
            leavedUsers: { $in: [userId2] },
          },
          {
            users: { $all: [userId2], $size: 1 },
            leavedUsers: { $in: [userId1] },
          },
        ],
      });
      //방에 입장시키기
      if (room) {
        if (room.users.includes(userId1)) {
          room.leavedUsers.remove(userId2);
          room.users.push(userId2);
          await room.save();
          const enteredUser = await User.findOne({ _id: userId2 });
          await Chat.create({
            room: room._id,
            chat: `${enteredUser.username}님이 입장하셨습니다.`,
            type: 'system',
            inout: 'in',
          });
          req.app
            .get("io")
            .of("/chat")
            .to(room._id.toString())
            .emit("enterRoom", {
              chat: `${enteredUser.username}님이 입장하셨습니다.`,
            });
        } else if (room.users.includes(userId2)) {
          room.leavedUsers.remove(userId1);
          room.users.push(userId1);
          await room.save();
          const enteredUser = await User.findOne({ _id: userId1 });
          await Chat.create({
            room: room._id,
            chat: `${enteredUser.username}님이 입장하셨습니다.`,
            type: 'system',
            inout: 'in',
          });
          req.app
            .get("io")
            .of("/chat")
            .to(room._id.toString())
            .emit("enterRoom", {
              chat: `${enteredUser.username}님이 입장하셨습니다.`,
            });
        }
      }
      // 그런 방이 없는 경우 새로 방을 생성
      else {
        room = await Room.create({
          users: [userId1, userId2],
        });
      }
    }
    // const io = req.app.get('io');
    // io.of('/room').emit('newRoom', room);

    await User.findByIdAndUpdate(userId1, { $addToSet: { rooms: room._id } });
    await User.findByIdAndUpdate(userId2, { $addToSet: { rooms: room._id } });

    //생성하면서 방에 들어가는 부분
    res.status(200).json({ roomId: room._id });
  } catch (err) {
    console.error(err);
    next(err);
  }
};
exports.enterRoom = async (req, res, next) => {
  try {
    const room = await Room.findOne({ _id: req.params.id }).populate("users");
    if (!room) {
      return res.redirect(`/?error=존재하지 않는 방입니다.`);
    }
    // if (room.password && room.password !== req.query.password) {
    //   return res.redirect(`/?error=비밀번호가 틀렸습니다.`);
    // }
    // const io = req.app.get('io');
    // const { rooms } = io.of('/chat').adapter;
    // if (room.max <= rooms.get(req.param.id)?.size){
    //   return res.render('/?error=허용 인원을 초과했습니다.')
    // }
    const chats = await Chat.find({ room: room._id })
      .sort("createdAt")
      .populate("user", "username");
    res.render("chat", {
      title: "GIF 채팅방 생성",
      chats,
      room,
      user: req.user._id,
      username: req.user.username,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};
exports.removeRoom = async (req, res, next) => {
  try {
    await removeRoomService(req.params.id);
    res.send("ok");
  } catch (err) {
    console.error(err);
    next(err);
  }
};
exports.leaveRoom = async (req, res, next) => {
  try {
    //User 스키마에 있는 rooms 필드에서 방을 빼줌.
    const user = await User.findByIdAndUpdate(req.params.userId, {
      $pull: { rooms: req.params.roomId },
    });

    //Room 스키마에 있는 users 필드에서 유저를 빼줌.
    const room = await Room.findById(req.params.roomId);
    if (!room) {
      return res.status(404).send("방이 존재하지 않습니다.");
    }
    const index = room.users.indexOf(req.params.userId);
    if (index === -1) {
      return res.status(404).send("유저가 존재하지 않습니다.");
    }
    room.users.splice(index, 1);
    if (!room.leavedUsers.includes(req.params.userId)) {
      room.leavedUsers.push(req.params.userId);
    }
    await room.save();

    if (room.users.length === 0) {
      await removeRoomService(req.params.roomId);
      // req.app.get('io').of('/room').emit('removeRoom', req.params.roomId);
    } else {
      await Chat.create({
        room: req.params.roomId,
        user: user._id,
        chat: `${user.username}님이 퇴장하셨습니다.`,
        type: "system",
        inout: "out",
      });
      req.app
        .get("io")
        .of("/chat")
        .to(req.params.roomId)
        .emit("leaveRoom", {
          chat: `${user.username}님이 퇴장하셨습니다.`,
          user: user._id,
        });
    }
    res.send("ok");
  } catch (err) {
    console.error(err);
    next(err);
  }
};
exports.sendChat = async (req, res, next) => {
  try {
    const chat = await Chat.create({
      room: req.params.id,
      user: req.user._id,
      chat: req.body.chat,
      type: "user",
    });
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      {
        lastMessage: req.body.chat,
        gif: false,
      },
      { new: true }
    ).populate("users");
    const populatedChat = await Chat.findById(chat._id).populate(
      "user",
      "username"
    );
    req.app.get("io").of("/chat").to(req.params.id).emit("chat", populatedChat);
    req.app.get("io").of("/room").emit("newChat", {
      roomId: req.params.id,
      chat: req.body.chat,
      users: room.users,
    });
    res.send("ok");
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.sendGif = async (req, res, next) => {
  try {
    const chat = await Chat.create({
      room: req.params.id,
      user: req.user._id,
      gif: req.file.filename,
      type: "user",
    });
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      {
        lastMessage: req.file.filename,
        gif: true,
      },
      { new: true }
    ).populate("users");
    const populatedChat = await Chat.findById(chat._id).populate(
      "user",
      "username"
    );
    req.app.get("io").of("/chat").to(req.params.id).emit("chat", populatedChat);
    req.app.get("io").of("/room").emit("newChat", {
      roomId: req.params.id,
      chat: "GIF 이미지가 도착했습니다.",
      users: room.users,
    });
    res.send("ok");
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.inviteFriend = async (req, res, next) => {
  try {
    const roomId = req.body.room_id;
    const userId = req.body.user_id;
    console.log("룸 아이디와 유저아이디:", roomId, userId);
    //User 스키마에 있는 rooms 필드에서 방을 넣어줌.
    const user = await User.findByIdAndUpdate(userId, {
      $addToSet: { rooms: roomId },
    });
    //Room 스키마의 leavedUsers 필드에 유저가 있으면 빼주고, users 필드에 유저를 넣어줌.

    const roomBeforeUpdate = await Room.findById(roomId);
    const isUserInLeavedUsers = roomBeforeUpdate.leavedUsers.includes(userId);

    const room = await Room.findByIdAndUpdate(
      roomId,
      {
        $pull: { leavedUsers: userId },
        $addToSet: { users: userId },
      },
      { new: true }
    ).populate("users");

    if (isUserInLeavedUsers) {
      req.app
        .get("io")
        .of("/chat")
        .to(roomId)
        .emit("enterRoom", {
          chat: `${user.username}님이 입장하셨습니답.`,
        });
      await Chat.create({
        room: roomId,
        chat: `${user.username}님이 입장하셨습니당.`,
        type: "system",
        inout: "in",
      });
    }
    res.send("ok");
  } catch (err) {
    console.error(err);
    next(err);
  }
};
