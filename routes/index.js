const express = require('express')
const path = require('path')
const svgCaptcha = require('svg-captcha')
const router = express.Router()

/* GET home page. */
router.get('/', async function(req, res, next) {      //登录中转
  res.sendFile(path.join(__dirname, '../public/src', 'index.html'))
})

router.get('/user', async function(req, res, next) {      //登录中转
  let datas = await db.all('SELECT * FROM contents ORDER BY id DESC')
  if(req.session && req.session.login) {
    res.json({user:req.user, datas})
  }
  else {
    if (req.signedCookies.userID - 0 >= 0) {
      let findUser = await db.get('SELECT id FROM users WHERE id = ?', req.signedCookies.userID - 0)
      if (findUser) {
        req.session.login = true
        req.session.userID = findUser.id
        res.json({user:req.user, datas})
      } else {
        res.clearCookie('userID')
        res.json({user:null, datas})
      }
    } else res.json({user:null, datas})
  }
})


router.get('/captcha', function(req, res, next) {   //发送验证码
  let captcha = svgCaptcha.createMathExpr({noise:3, color:true, height:33.9, width:80,})
  req.session.captcha = captcha.text.toUpperCase()
  req.session.latsCaptchaTime = Date.now()
  console.log(req.session.captcha)
  console.log(req.session.latsCaptchaTime)
  res.type('svg')
  res.json({status:200, result:captcha.data, msg:"验证码"})
})

router.post('/registerORlogin', async (req, res, next) => {     //登录或注册
  req.session.latsCaptchaTime = req.session.latsCaptchaTime || Date.now()
  if (Date.now() - req.session.latsCaptchaTime > 180000)  {
    console.log("验证码超时")
    return res.json({status:205, type:req.body.type, msg:"验证码超时"})
  }

  if (req.body.captcha !== req.session.captcha) {
    console.log("验证码错误")
    return res.json({status:203, type:req.body.type, msg:"验证码错误"})
  }

  let cookieConfig = req.body.keepLogin 
                    ? {maxAge: 60 * 1000 * 24 * 60 * 30, httpOnly: true, signed: true} 
                    : {httpOnly: true, signed: true}

  if (req.body.type === "register") {
    let findUser = await db.get('SELECT name FROM users WHERE name = ?', req.body.username)
    if (findUser) return res.json({status:201, type:req.body.type, msg:"用户名已存在"})
    else {
        db.run('INSERT INTO users (name, password, avatarPath) VALUES (?,?,?)', 
        req.body.username, 
        req.body.password,
        req.body.avatar)
      let user = await db.get('SELECT * FROM users WHERE name = ?', req.body.username)
      res.cookie('userID', user.id, cookieConfig)
      req.session.login = true
      req.session.userID = user.id
      res.json({status:100, type:req.body.type, user: user, msg:"注册成功"})
    }
  }

  if (req.body.type === "login") {    //登录
    let findUser = await db.get('SELECT name FROM users WHERE name = ?', req.body.username)
    if (!findUser) return res.json({status:201, type:req.body.type, msg:"用户名不存在"})
    else {
      let user = await db.get('SELECT * FROM users WHERE name = ?', req.body.username)
      if (user.password !== req.body.password) return res.json({status:202, type:req.body.type, msg:"密码错误"})
      res.cookie('userID', user.id, cookieConfig)
      req.session.login = true
      req.session.userID = user.id
      res.json({status:100, type:req.body.type, user: user, msg:"登陆成功"})
    }
  }

})

router.get('/logOut', (req, res, next) => {  //退出登录
  req.session.login = false
  res.clearCookie('userID')
  res.json({status:100})
})


router.post('/add_post', async (req, res, next) => {     //发表文章
  if (req.user && req.user.id - 0 >= 0) {
    db.run('INSERT INTO contents (title, content, time, userid, username, greatNumber, browseNumber) VALUES (?,?,?,?,?,?,?)', 
           req.body.title, req.body.content, new Date().toLocaleString(), req.user.id - 0, req.user.name, 0, 0)
    let content = await db.get('SELECT * FROM contents WHERE  username=? ORDER BY id DESC LIMIT 1', req.user.name)
    res.json({status:300, msg:"发帖成功", content })
  } else user_error(req, res)

})



router.get('/content/:contentID', async (req, res, next) => {   //获取文章详情页
  let datas, commentData, commentsGreat
  if (req.user) {
    datas = await Promise.all([db.all('SELECT * FROM comments WHERE contentid=? ORDER BY id ASC', req.params.contentID - 0),
                               db.get('SELECT * FROM contents WHERE id=?', req.params.contentID - 0),
                               db.get('SELECT browsingHistory FROM users WHERE id=?', req.user.id)])
    if (datas[2].browsingHistory && datas[2].browsingHistory.indexOf(`[${req.params.contentID}]`) === -1) {   
      datas[2] = `[${req.params.contentID}]` + (datas[2].browsingHistory ? datas[2].browsingHistory : "")
      db.run('UPDATE users SET browsingHistory = ? WHERE id = ?', datas[2], req.user.id - 0)
      db.run('UPDATE contents SET browseNumber = browseNumber + 1 WHERE id = ?', req.params.contentID)
    } 
  } else {
    datas = await Promise.all([db.all('SELECT * FROM comments WHERE contentid=? ORDER BY id ASC', req.params.contentID - 0),
                               db.get('SELECT * FROM contents WHERE id=?', req.params.contentID - 0)])
  }
  commentData = await db.all('SELECT * FROM comments WHERE contentid=? ORDER BY id ASC', req.params.contentID - 0)
  res.json({contentData: datas[1], commentData: datas[0]})
})


router.post('/add_comment', async (req, res, next) => {     //提交评论
  if (req.user && req.user.id - 0 >= 0) {
    await db.run('INSERT INTO comments (comment, contentid, userid, username, time, sumComments, greatNumber) VALUES (?,?,?,?,?,?,?)', 
           req.body.text, req.body.contentID - 0, req.user.id - 0, req.user.name, new Date().toLocaleString(), 0, 0)
    let data = await db.get('SELECT * FROM comments WHERE  contentid=? ORDER BY id DESC LIMIT 1', req.body.contentID - 0)
    res.json({status:108, msg:"评论成功", data})
  } else user_error(req, res)
})


router.post('/add_commentsComments', async (req, res, next) => {     //提交评论的评论
  let time = new Date().toLocaleString()
  let isCommentuser
  if (req.user && req.user.id - 0 >= 0) {
    db.run('UPDATE comments SET sumComments = sumComments + 1 WHERE id = ?', req.body.commentid - 0)
    db.run('INSERT INTO commentsComments (userid, username, commentid, time, text, contentid) VALUES (?,?,?,?,?,?)', 
           req.user.id - 0, req.user.name, req.body.commentid - 0, time, req.body.text, req.body.contentID - 0)
    if (req.body.tousername === req.user.name) isCommentuser = true
    res.json({status:101, msg:"评论成功", text:req.body.text, time, 
              isCommentuser, username:req.user.name, commentid:req.body.commnetid})
  } else user_error(req, res)
})

router.get('/commentsComments/:commentID', async (req, res, next) => {     //获取评论的评论
  let commentCommentsData = await db.all('SELECT * FROM commentsComments WHERE commentid=? ORDER BY id ASC', req.params.commentID - 0)
  res.json({status:102, commentCommentsData, msg:"拉取成功"})  
})


router.post('/replyComment', async (req, res, next) => {     //提交评论的评论的评论  哈哈哈哈
  let time = new Date().toLocaleString()
  if (req.user && req.user.id - 0 >= 0) {
    db.run('UPDATE comments SET sumComments = sumComments + 1 WHERE id = ?', req.body.commentid - 0)
    await db.run('INSERT INTO commentsComments (userid, username, commentsCommentsId, commentid, tousername, time, text, contentid) VALUES (?,?,?,?,?,?,?,?)', 
           req.user.id - 0, req.user.name, req.body.commentsCommentsId - 0, req.body.commentid - 0, req.body.tousername, time, req.body.text, req.body.contentID - 0)
    if (req.body.tousername === req.user.name) isCommentuser = true
    let commentCommentsData = await db.get('SELECT * FROM commentsComments WHERE userid =? AND time =?', req.user.id - 0, time)
    res.json({status:109, msg:"评论成功", commentCommentsData})
  } else user_error(req, res)
})


router.get('/usersTalk/:contentID/:commentid/:lookUserID/:tousername', async (req, res, next) => {     //获取对话评论
  let data = await db.all('SELECT * FROM commentsComments WHERE contentid=? AND commentid=? AND (userid=? OR username=?) ORDER BY id ASC', 
    req.params.contentID - 0, req.params.commentid - 0, req.params.lookUserID - 0, decodeURI(req.params.tousername))
  res.json({status:119, data, msg:"拉取成功"})  
})


router.delete('/delete/content/:contentid', async (req, res, next) => {     //删除文章
  if (req.user && req.user.id - 0 >= 0) {
    let contentUser = await db.get('SELECT * FROM contents WHERE id=?', req.params.contentid - 0)
    if (req.user.id === contentUser.userid && req.user.name === contentUser.username) {
      db.run('DELETE FROM contents WHERE id = ?', req.params.contentid - 0)
      db.run('DELETE FROM comments WHERE contentid = ?', req.params.contentid - 0)
      db.run('DELETE FROM commentsComments WHERE contentid = ?', req.params.contentid - 0)
      res.json({status:50, msg:"删除成功", id:req.params.contentid - 0})  
    } else user_error(req, res)
  } else user_error(req, res)
})




router.delete('/delete/comment/:contentid/:commentid', async (req, res, next) => {     //删除文章评论
  if (req.user && req.user.id - 0 >= 0) {
    let commentUser = await db.get('SELECT * FROM comments WHERE id=?', req.params.commentid - 0)
    if (req.user.id === commentUser.userid && req.user.name === commentUser.username) {
      db.run('DELETE FROM comments WHERE id = ?', req.params.commentid - 0)
      db.run('DELETE FROM commentsComments WHERE commentid = ?', req.params.commentid - 0)
      res.json({status:51, msg:"删除成功"})  
    } else user_error(req, res)
  } else user_error(req, res)
})


router.delete('/delete/commentsComments/:contentid/:commentid/:commentsCommentsid', async (req, res, next) => {     //删除文章评论的评论
  if (req.user && req.user.id - 0 >= 0) {
    let commentsCommentsUser = await db.get('SELECT * FROM commentsComments WHERE id=?', req.params.commentsCommentsid - 0)
    if (req.user.id === commentsCommentsUser.userid && req.user.name === commentsCommentsUser.username) {
      db.run('DELETE FROM commentsComments WHERE id = ?', req.params.commentsCommentsid - 0)
      db.run('UPDATE comments SET sumComments = sumComments - 1 WHERE id = ?', req.params.commentid - 0)
      res.json({status:52, msg:"删除成功"})  
    } else user_error(req, res)
  } else user_error(req, res)
})

router.put('/greatNumber/:contentid/:target/:status/:commentid',  async (req, res, next) => {     //更新点赞数据
  if (req.user && req.user.id - 0 >= 0) {
    let userContentGreat, userCommentGreat
    if (req.params.status - 0 === 1) {
      if (req.params.target - 0 === 1) {
        let userContentGreat = await db.get('SELECT greatHistory FROM users WHERE id=?', req.user.id)
        if (userContentGreat.greatHistory && userContentGreat.greatHistory.indexOf(`[${req.params.contentid}]`) >= 0) {
          return res.json({status:'error', msg:"已经点过赞"})  
        }
        db.run('UPDATE contents SET greatNumber = greatNumber + 1 WHERE id = ?', req.params.contentid - 0)
        userContentGreat = `[${req.params.contentid}]` + (userContentGreat.greatHistory ? userContentGreat.greatHistory : "")
        db.run('UPDATE users SET greatHistory = ? WHERE id = ?', userContentGreat, req.user.id - 0)
      }
      else {
        let userCommentGreat = await db.get('SELECT greatCommentsHistory FROM users WHERE id=?', req.user.id - 0)
        if (userCommentGreat.greatCommentsHistory && userCommentGreat.greatCommentsHistory.indexOf(`[${req.params.commentid}]`) >= 0) {
          return res.json({status:'error', msg:"已经点过赞"})  
        }
        db.run('UPDATE comments SET greatNumber = greatNumber + 1 WHERE id = ?', req.params.commentid - 0)
        userCommentGreat = `[${req.params.commentid}]` + (userCommentGreat.greatCommentsHistory ? userCommentGreat.greatCommentsHistory : "")
        db.run('UPDATE users SET greatCommentsHistory = ? WHERE id = ?', userCommentGreat, req.user.id - 0)
      }
    } else {
      if (req.params.target - 0 === 1) {
        let userContentGreat = await db.get('SELECT greatHistory FROM users WHERE id=?', req.user.id)
        if (!userContentGreat.greatHistory ||(userContentGreat.greatHistory && userContentGreat.greatHistory.indexOf(`[${req.params.contentid}]`) === -1)) {
          return res.json({status:'error', msg:"已经取消赞"})  
        }
        db.run('UPDATE contents SET greatNumber = greatNumber - 1 WHERE id = ?', req.params.contentid - 0)
        userContentGreat = userContentGreat.greatHistory.replace(`[${req.params.contentid}]`, "")
        db.run('UPDATE users SET greatHistory = ? WHERE id = ?', userContentGreat, req.user.id - 0)
      }
      else {
        let userCommentGreat = await db.get('SELECT greatCommentsHistory FROM users WHERE id=?', req.user.id - 0)
        if (!userCommentGreat.greatCommentsHistory ||(userCommentGreat.greatCommentsHistory && userCommentGreat.greatCommentsHistory.indexOf(`[${req.params.commentid}]`) === -1)) {
          return res.json({status:'error', msg:"已经取消赞"})  
        }
        db.run('UPDATE comments SET greatNumber = greatNumber - 1 WHERE id = ?', req.params.commentid - 0)
        userCommentGreat = userCommentGreat.greatCommentsHistory.replace(`[${req.params.commentid}]`, "")
        db.run('UPDATE users SET greatCommentsHistory = ? WHERE id = ?', userCommentGreat, req.user.id - 0)
      }
    }
    res.json({status:53, msg:"点赞(取消点赞)"})  
  } else user_error(req, res)
})


router.get('*', async function(req, res, next) {      
  res.sendFile(path.join(__dirname, '../public/src', 'index.html'))
})

function user_error(req, res){
  req.session.login = false
  res.clearCookie('userID')
  res.redirect('/')
}

module.exports = router
