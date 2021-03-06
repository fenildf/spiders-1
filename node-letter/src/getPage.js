var superagent = require('superagent');
var cheerio = require('cheerio');
var mongo = require('./mongo');

var targetUrl = 'http://cs.cqut.edu.cn/DeanMail/MailList.aspx';
var dbHandler = {}
var data;
var pid;
const COLLECTION = 'pageState';

function getPage(pageId, callback) {

  // 计算页面的对应的session id并在mongo中查找对应state
  pid = Math.floor(pageId / 10) * 10 + 1;
  if ((pageId % 10 === 1) || (pageId % 10 === 0)) {
    pid -= 10;
  }
  mongo.connect(COLLECTION, function(res) {
    dbHandler = res;
    mongo.selectData(dbHandler.collection, { pageId: pid }, function(res) {
      dbHandler.db.close();

      // 如果存在pid则返回state当前第一页则直接post，否则抛出异常
      if ((res instanceof Array) && res.length) {
        data = {
          __EVENTTARGET: 'ctl00$ContentPlaceHolder_main$DeanMailList1$GridView1',
          __EVENTARGUMENT: 'Page$' + pageId,
          __VIEWSTATE: res[0].__VIEWSTATE,
          __EVENTVALIDATION: res[0].__EVENTVALIDATION
        };
      } else if (pageId === 1) {
        data = null;
      } else {
        throw new Error('page isn\'t exist');
        return;
      }

      superagent
        .post(targetUrl)
        .set({
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': 'ASP.NET_SessionId=yqknhl45hxw0t255d54r2u45',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36'
        })
        .send(data)
        .end(function(err, res) {
          if (err) {
            // console.log(err);
            console.log('get page done!', err.meesage);
          }
          callback && callback(res);
        });
      });
  });
}

module.exports = getPage;
