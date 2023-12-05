const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  renderLogin, renderFriend, renderMain, renderRoom, createRoom, enterRoom, leaveRoom, sendChat, sendGif, inviteFriend
} = require('../controllers');
const { isLoggedIn, isNotLoggedIn } = require('../middlewares');

const router = express.Router();

// router.use((req, res, next) => {
//   console.log('유저 아이디 전송!', req.user);
//   res.locals.user = req.user;
//   next();
// });


router.get('/login', isNotLoggedIn, renderLogin);
router.get('/', isLoggedIn, renderMain);
router.get('/friend', isLoggedIn, renderFriend);
router.get('/room', isLoggedIn, renderRoom);
router.post('/room', isLoggedIn, createRoom);
router.get('/room/:id', isLoggedIn, enterRoom);
router.delete('/room/:roomId/:userId', isLoggedIn, leaveRoom);
router.post('/room/:id/chat', isLoggedIn, sendChat);
router.post('/invite', isLoggedIn, inviteFriend);
// router.post('/create-room', isLoggedIn, createRoom);
try { // uploads 폴더가 없으면 생성.
  fs.readdirSync('uploads');
} catch (err) {
  console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
  fs.mkdirSync('uploads');
}
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads/');
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname); // 확장자 추출
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext); // 파일명 + 날짜 + 확장자
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB

});
router.post('/room/:id/gif', upload.single('gif'), sendGif);

module.exports = router;