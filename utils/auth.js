const dbs = require('./dbs');
const jwt = require('jsonwebtoken');
const config = require('./config');

module.exports = (router, path) => {
    // Xác thực
    router.use(async (req, res, next) => {
        
        try {
            let header = req.headers && req.headers.authorization, matches = header ? /^Bearer (\S+)$/.exec(header) : null, token = matches && matches[1];     
            if (!token) return res.status(403).send({ msg: 'Xác thực không thành công. Vui lòng đăng nhập lại!' });

            jwt.verify(token, config.secret,async (err, decoded) => {
                if (err) return res.status(403).send({ msg: 'Hết phiên làm việc. Vui lòng đăng nhập lại!' });
                
                // let per = await dbs.execute(`SELECT gp.* from group_permission gp, map_employee_group meg
                // where gp.group_id=meg.group_id and meg.employee_id= ? and gp.path = ? and ?? = 1`, [decoded.id, req.path =='/'?`/${path}`:`/${path}${req.path}`, req.method=='DELETE' ? 'del' : req.method])                    
                // if(!per[0]){
                //     return res.status(403).send({ msg: 'Bạn không có quyền truy cập !' });
                // }
                
                return next();
            })
        }
        catch (err) {
            next(err)
        }
    });
}    