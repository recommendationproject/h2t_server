const dbs = require('../../utils/dbs');
const auth = require('../../utils/auth');
/* Authentication */


module.exports = (router) => {
    auth(router, 'employee');

    router.get('/', async (req, res) => {
        let rs = await dbs.execute('select * from employee');
        res.json(rs);
    });
};
