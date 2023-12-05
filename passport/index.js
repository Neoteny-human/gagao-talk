const passport = require('passport');
const local = require('./localStrategy');
const User = require('../schemas/user');


module.exports = () => {
    passport.serializeUser((user, done) => { // user === exUser
        console.log('serializeUser:', user);
        done(null, user._id); // user id만 추출
    });
    // session객체 { 1231241244214: 1 }     { 세션쿠키: 유저아이디 } -> 메모리에 저장됨.

    passport.deserializeUser((id, done) => { // id: 1
        console.log('deserializeUser:', id);
        User.findOne({ _id: id })
        .then((user) => done(null, user)) // req.user
        .catch(err => done(err));
    });

    local();
};