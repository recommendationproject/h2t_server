'use strict'
const dbs = require('./dbs')

const genRecommendProductTogether = async () => {
    try {
        // Lấy các sản phẩm mua cùng nhau trong đơn hàng
        let rs = await dbs.execute(`SELECT GROUP_CONCAT(product_id) gid FROM order_detail group by order_id`, []);
        let mainarr = [];
        // lưu từng sản và sản phẩm mua cùng dưới dạng 1-1
        rs.forEach(e => {
            let arr = e.gid.split(',');
            for (let i = 0; i < arr.length; i++) {
                for (let j = 0; j < arr.length; j++) {
                    if (arr[i] !== arr[j]) {
                        mainarr.push(arr[i] + '-' + arr[j])
                    }
                }
            }
        });
        mainarr.sort();
        var current = null;
        var cnt = 0;
        let tmpArr = [];
        // đếm số lần sản phẩm được mua cùng nhau
        for (var i = 0; i < mainarr.length; i++) {
            if (mainarr[i] != current) {
                if (cnt > 0) {
                    let checkexist = false;
                    tmpArr.forEach(e => {
                        if (e[current.split('-')[0]]) {
                            e[current.split('-')[0]].push([current.split('-')[0], current.split('-')[1], cnt]);
                            checkexist = true;
                        }
                    });
                    if (checkexist === false) {
                        // console.log({[current.split('-')[0]]: [[current.split('-')[0], current.split('-')[1], cnt]]});

                        tmpArr.push({ [current.split('-')[0]]: [[current.split('-')[0], current.split('-')[1], cnt]] })
                    }
                }
                current = mainarr[i];
                cnt = 1;
            } else {
                cnt++;
            }
        }
        if (cnt > 0) {
            let checkexist = false;
            tmpArr.forEach(e => {
                if (e[current.split('-')[0]]) {

                    e[current.split('-')[0]].push([current.split('-')[0], current.split('-')[1], cnt]);
                    checkexist = true;


                }
            });
            if (checkexist === false) {
                tmpArr.push({ [current.split('-')[0]]: [[current.split('-')[0], current.split('-')[1], cnt]] })
            }
        }
        // sắp xếp mảng con và lấy 5 sản phẩm gợi ý cho mỗi sản phẩm
        let arrIns = [];
        tmpArr.forEach(arr => {
            let tmp = quickSort(Object.values(arr)[0]);
            tmp.reverse();
            for (let i = 0; i < 5; i++) {
                if (tmp[i]) {
                    arrIns.push(tmp[i])
                }
            }
        });
        await dbs.execute(`delete from recommendproducttogether`, [])
        await dbs.execute(`insert into recommendproducttogether(productid, productrecommendid, val) values ?`, [arrIns]);
    }
    catch (err) {
        console.log(err)
    }
}

const quickSort = (arr) => {

    if (arr.length < 2) return arr;

    const pivotIndex = arr.length - 1;
    const pivot = arr[pivotIndex];

    const left = [];
    const right = [];

    let currentItem;
    for (let i = 0; i < pivotIndex; i++) {
        currentItem = arr[i];

        if (currentItem[2] < pivot[2]) {
            left.push(currentItem);
        } else {
            right.push(currentItem);
        }
    }

    return [...quickSort(left), pivot, ...quickSort(right)];
}

const genRecommend = async () => {
    try {
        let rs = await dbs.execute(`SELECT o.customer_id, od.product_id, od.rating FROM order_detail od, orders o WHERE o.id = od.order_id`, []);
        let userToRecommend = await dbs.execute(`SELECT distinct customer_id FROM orders`, []);

        var groups = {};
        for (var i = 0; i < rs.length; i++) {
            var groupName = rs[i].customer_id;
            if (!groups[groupName]) {
                groups[groupName] = {};
            }
            // groups[groupName].push({[rs[i].product_id]: rs[i].rating})
            groups[groupName][rs[i].product_id] = rs[i].rating
        }
        let recommend = [];
        userToRecommend.forEach(element => {
            let item = recommendation_eng(groups, element.customer_id, euclidean_score);
            item[0].forEach(i => {
                recommend.push([i.items, element.customer_id, Math.round(i.val)])
            })
        });
        await dbs.execute(`delete from recommend_product`, []);
        await dbs.execute(`insert into recommend_product(product_id, user_id, val) values ?`, [recommend]);
        console.log('Đồng bộ gợi ý thành công !');

    }
    catch (err) {
        console.log(err)
    }
}
var euclidean_score = function (dataset, p1, p2) {

    var existp1p2 = {};
    for (var key in dataset[p1]) {
        if (key in dataset[p2]) {
            existp1p2[key] = 1
        }
        if (len(existp1p2) == 0) return 0;//check if it has a data
        var sum_of_euclidean_dist = [];//store the  euclidean distance


        for (let item in dataset[p1]) {
            if (item in dataset[p2]) {
                sum_of_euclidean_dist.push(Math.pow(dataset[p1][item] - dataset[p2][item], 2));
            }
        }
        var sum = 0;
        for (var i = 0; i < sum_of_euclidean_dist.length; i++) {
            sum += sum_of_euclidean_dist[i];
        }
        var sum_sqrt = 1 / (1 + Math.sqrt(sum));
        return sum_sqrt;
    }
}

var len = function (obj) {
    var len = 0;
    for (var i in obj) {
        len++
    }
    return len;
}

var similar_user = function (dataset, person, num_user, distance) {
    var scores = [];
    for (var others in dataset) {
        if (others != person && typeof (dataset[others]) != "function") {
            var val = distance(dataset, person, others)
            var p = others
            scores.push({ val: val, p: p });
        }
    }
    scores.sort(function (a, b) {
        return b.val < a.val ? -1 : b.val > a.val ? 1 : b.val >= a.val ? 0 : NaN;
    });
    var score = [];
    for (var i = 0; i < num_user; i++) {
        score.push(scores[i]);
    }
    return score;

}

var recommendation_eng = function (dataset, person, distance) {

    var totals = {
        //you can avoid creating a setter function
        //like this in the object you found them
        //since it just check if the object has the property if not create
        //and add the value to it.
        //and  because of this setter that why a function property
        // is created in the dataset, when we transform them.
        setDefault: function (props, value) {
            if (!this[props]) {
                this[props] = 0;
            }
            this[props] += value;
        }
    },
        simsum = {
            setDefault: function (props, value) {
                if (!this[props]) {
                    this[props] = 0;
                }

                this[props] += value;
            }
        },
        rank_lst = [];
    for (var other in dataset) {
        if (other === person) continue;
        var similar = distance(dataset, person, other);

        if (similar <= 0) continue;
        for (var item in dataset[other]) {
            if (!(item in dataset[person]) || (dataset[person][item] == 0)) {
                //the setter help to make this look nice.
                totals.setDefault(item, dataset[other][item] * similar);
                simsum.setDefault(item, similar);


            }

        }


    }

    for (var item in totals) {
        //this what the setter function does
        //so we have to find a way to avoid the function in the object     
        if (typeof totals[item] != "function") {

            var val = totals[item] / simsum[item];
            rank_lst.push({ val: val, items: item });
        }
    }
    rank_lst.sort(function (a, b) {
        return b.val < a.val ? -1 : b.val > a.val ?
            1 : b.val >= a.val ? 0 : NaN;
    });
    var recommend = [];
    for (var i in rank_lst) {
        recommend.push(rank_lst[i].items);
    }
    return [rank_lst, recommend];
}

module.exports.genRecommend = genRecommend

module.exports.genRecommendProductTogether = genRecommendProductTogether