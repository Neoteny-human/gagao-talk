exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) { //패스포트 통해서 로그인 했니
        next();
    } else {
        res.redirect('/login');
    }
};

exports.isNotLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        next();
    } else {
        const message = encodeURIComponent('로그인한 상태입니다.');
        res.redirect(`/?error=${message}`); // localhost:8005?error=메세지
    }
};