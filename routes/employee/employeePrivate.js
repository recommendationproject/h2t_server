const dbs = require('../../utils/dbs');
const auth = require('../../utils/auth');
const { check, validationResult, body } = require('express-validator');
const bcrypt = require('bcryptjs');

/* Authentication */


module.exports = (router) => {
    // auth(router, 'employee');

    /* Add Employee */
    router.post('/', [
        check('name', 'Username field is required').notEmpty(),
        check('username', 'Username field is required').notEmpty(),
        check('pass', 'Password field is required').notEmpty(),
        check('pass', 'Password field is min 5 character').isLength({ min: 5 }),
        check('phone', 'Password field is min 10 character').isLength({ min: 10 }),
        body('username').custom(async value => {
            let user = await dbs.execute('select * from employee where username = ?', [value])
            if (user[0]) {
                return Promise.reject('Tên đăng nhập đã tồn tại !');
            }
        }),
        body('pass2').custom((value, { req }) => {
            if (value !== req.body.pass) {
                throw new Error('Password confirmation does not match password');
            }
            return true;
        })
    ], async (req, res) => {

        try {
            // Check Errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(422).json({ errors: errors.array() });
            } else {
                const saltRounds = 10;
                let salt = bcrypt.genSaltSync(saltRounds);
                let pass = bcrypt.hashSync(req.body.pass, salt);
                let sql = `insert into employee(id, name, address, phone, username, password, Position_id) values(?, ?, ?, ?, ?, ?, ?)`;
                let employee_id = await dbs.getNextID('employee', 'id');
                let bind = [employee_id, req.body.name, req.body.address, req.body.phone, req.body.username, pass, req.body.position_id];
                let rs = await dbs.execute(sql, bind);
                res.json(rs)
            }
        } catch (error) {
            //console.log(error);
            res.json({ err: error });
        }

    });

    router.get('/', async (req, res, next) => {
        let rs = await dbs.execute(`SELECT id, name, address, phone, username FROM employee`, []);
        console.log(rs);
        
        res.json(rs);
    });

};
