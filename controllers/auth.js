const User = require('../schemas/user');
const bcrypt = require('bcrypt');
const passport = require('passport');

exports.join = async (req, res, next) => {
    const { username, email, password } = req.body;
    console.log(req.body);
    try {
        const exUser = await User.findOne({ email: email });
        if (exUser) {
            return res.redirect('/join?error=exist');
        }
        const hash = await bcrypt.hash(password, 12);
        await User.create({
            username,
            email,
            password: hash,
        });
        return res.redirect('/'); // 302
    } catch (error) {
        console.error(error);
        next(error);  
    };
};


// POST /auth/login
exports.login = (req, res, next) => {
    passport.authenticate('local', (authError, user, info) => {
        if (authError) { //서버실패
            console.error(authError);
            next(authError);
        }
        if (!user) { //로직실패
            console.log(info.message);
            return res.redirect(`/?loginError=${info.message}`);
        }
        console.log('Session:', req.session);
        return req.login(user, (loginError) => {
            if (loginError) {
                console.log('Session after failed login:', req.session);
                console.error('LoginError: ', loginError); //Failed to serialize user into session
                return next(loginError);
            }
            console.log('Session after successful login:', req.session);
            return res.redirect('/friend');
        });
    })(req, res, next);
};

exports.logout = (req, res, next) => {
    req.logout(() => {
        res.redirect('/');
    });
};