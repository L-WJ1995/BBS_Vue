function getUser() {
  axios.get('/user').then((data) => {
    myBBS.user = data.data.user ? data.data.user : {}
    myBBS.contents = data.data.datas
  })
}


function getCaptcha() {
  axios('/captcha').then((res) => $("#captcha_img").empty().append(res.data.result))
}


function login(userData) {
  if (!input_judge(userData)) return
  return axios({
    method:'post',
    url:'/registerORlogin',
    data:{
      username:userData.username + "",
      password:userData.password + "",
      captcha:userData.captcha.toUpperCase() + "",
      keepLogin:userData.keepLogin,
      type:"login",
    }
  })
}


function register(userData) {
  if (!input_judge(userData)) return
  return axios({
    method:'post',
    url:'/registerORlogin',
    data:{
      username:userData.username + "",
      password:userData.password + "",
      captcha:userData.captcha.toUpperCase() + "",
      keepLogin:userData.keepLogin,
      avatarPath:"", //暂时未添加头像功能
      type:"register",
    }
  })
}



function input_judge(userData) {
  if (userData.username === "") {
    myBBS.userData.captcha = ""
    $(".modal-title span").text("错误")
    $(".modal-body span").text("用户名不能为空！")
    $(".modal-footer button").addClass("btn-warning").text("Close")
    modal_status()
    return false 
  } else if (userData.password === "") {
    myBBS.userData.captcha = ""
    $(".modal-title span").text("错误")
    $(".modal-body span").text("密码不能为空！")
    $(".modal-footer button").addClass("btn-warning").text("Close")
    modal_status()
    return false
  } else if (userData.captcha === "") {
    myBBS.userData.captcha = ""
    $(".modal-title span").text("错误")
    $(".modal-body span").text("验证码不能为空！")
    $(".modal-footer button").addClass("btn-warning").text("Close")
    modal_status()
    return false
  } else return true
}

function res_status(data, self) {
  switch(data.status) {
    case 100: {
      let str = [data.type === "login" ? "登录成功" : "注册成功", "欢迎访问BBS！"]
      $(".modal-title span").text(str[0])
      $(".modal-body span").text(str[1])
      $(".modal-footer button").removeClass("btn-warning").addClass("btn-success").text("Close")
      $(".bs-example-modal-sm").modal("show")
      myBBS.logInShow = false
      myBBS.userData.password = myBBS.userData.captcha = ""
      break
    }

    case 101: {
      $(".modal-title span").text("评论成功")
      $(".modal-body span").text("即将关闭提示！")
      $(".modal-footer button").removeClass("btn-warning").addClass("btn-success").text("Close")
      $(".bs-example-modal-sm").modal("show")
      self.commentData[data.index].sumComments += 1
      break
    }

    case 108: {
      $(".modal-title span").text("评论成功")
      $(".modal-body span").text("即将关闭提示！")
      $(".modal-footer button").removeClass("btn-warning").addClass("btn-success").text("Close")
      $(".bs-example-modal-sm").modal("show")
      self.commentData.push(data.data)
      self.commentText = ""
      hid(self)
      break
    }

    case 109: {
      $(".modal-title span").text("评论成功")
      $(".modal-body span").text("即将关闭提示！")
      $(".modal-footer button").removeClass("btn-warning").addClass("btn-success").text("Close")
      $(".bs-example-modal-sm").modal("show")
      self.commentComments.push(data.commentCommentsData)  
      break
    }

    case 201: {
      getCaptcha()
      myBBS.userData.username = myBBS.userData.captcha = ""
      let str = data.type === "login" ? ["登录失败", "用户名不存在,请重试！"] : ["注册失败", "用户名已存在,请更换用户名！"]
      $(".modal-title span").text(str[0])
      $(".modal-body span").text(str[1])
      $(".modal-footer button").addClass("btn-warning").text("Close")
      break
    }

    case 202: {
      getCaptcha()
      myBBS.userData.username = myBBS.userData.password = myBBS.userData.captcha = ""
      $(".modal-title span").text("登录失败")
      $(".modal-body span").text("用户名或密码错误,请重试！")
      $(".modal-footer button").addClass("btn-warning").text("Close")
      break
    }

    case 203: {
      myBBS.userData.captcha = ""
      getCaptcha()
      let str = data.type === "login" ? ["登录失败", "验证码输入有误,请重试！"] : ["注册失败", "验证码输入有误,请重试！"]
      $(".modal-title span").text(str[0])
      $(".modal-body span").text(str[1])
      $(".modal-footer button").addClass("btn-warning").text("Close")
      break
    }

    case 205: {
      myBBS.userData.captcha = ""
      getCaptcha()
      let str = data.type === "login" ? ["登录失败", "验证码超时,请重试！"] : ["注册失败", "验证码超时,请重试！"]
      $(".modal-title span").text(str[0])
      $(".modal-body span").text(str[1])
      $(".modal-footer button").addClass("btn-warning").text("Close")
      break
    }

    case 300: {
      $(".modal-title span").text("发帖成功")
      $(".modal-body span").text("即将关闭提示！")
      $(".modal-footer button").removeClass("btn-warning").addClass("btn-success").text("Close")
      $(".bs-example-modal-sm").modal("show")
      self.shade = false
      setTimeout(() => {
        myBBS.$router.push("./contentID/" + data.content.id)
        self.arrowsShow = true
        arrows.parentNode.classList.remove("trans-in", "trans-out")
        arrows.style.display = "block"
        myBBS.contents.unshift(data.content)
      },600)
      break
    }

    case 50: {
      $(".modal-title span").text("删除成功")
      $(".modal-body span").text("即将关闭提示！")
      $(".modal-footer button").removeClass("btn-warning").addClass("btn-success").text("Close")
      setTimeout(() => {
        $(".bs-example-modal-sm").modal("hide")
      }, 600)
      myBBS.$router.push("/")
      break
    }

    case 51: {
      $(".modal-title span").text("删除成功")
      $(".modal-body span").text("即将关闭提示！")
      $(".modal-footer button").removeClass("btn-warning").addClass("btn-success").text("Close")
      $(".bs-example-modal-sm").modal("show")
      self.commentData.splice(data.index, 1)
      break
    }


  }
  modal_status()
}


function modal_status() {
  $(".bs-example-modal-sm").modal("show")
  let modal_ID = setTimeout(() => {
    $(".bs-example-modal-sm").modal("hide")
  }, 1000)
  $(".bs-example-modal-sm").on("hidden.bs.modal", () => {
    clearTimeout(modal_ID)
    $(".bs-example-modal-sm").off("hidden.bs.modal")
  })
}



function shadeClick() {
  this.shade = false
  if (!this.arrowsShow && arrows) {
    arrows.parentNode.classList.add("trans-out")
    setTimeout(() => {
      this.arrowsShow = true
      arrows.parentNode.classList.remove("trans-in", "trans-out")
      arrows.style.display = "block"
    },600)
  }
}

function hid(self){
  if (self) setTimeout(() => {self.hidden=false},600)
  else setTimeout(() => {this.hidden=false},600)
  if (!this.arrowsShow && arrows) {
    arrows.parentNode.classList.add("trans-out")
    setTimeout(() => {
      this.arrowsShow = true
      arrows.parentNode.classList.remove("trans-in", "trans-out")
      arrows.style.display = "block"
    },600)
  }
  if (myBBS.commentsComments.length) {
    myBBS.commentsComments.css({'height':'0px'})
    myBBS.commentsComments = {}
  }
}

function arrowsClick() {
  if (!myBBS.user.name) {
    $(".modal-title span").text("错误！")
    $(".modal-body span").text("未登陆,无法发布内容！")
    $(".modal-footer button").addClass("btn-warning").text("Close")
    modal_status()
    myBBS.next = "submit_content"
    myBBS.logInShow = true
    return
  } else {
      this.shade = true
      this.arrowsShow = false
      arrows.parentNode.classList.add("trans-in")
  }

}

function arrowsClick1() {
  if (!myBBS.user.name) {
    $(".modal-title span").text("错误！")
    $(".modal-body span").text("未登陆,无法发布内容！")
    $(".modal-footer button").addClass("btn-warning").text("Close")
    modal_status()
    myBBS.next = "submit_content"
    myBBS.logInShow = true
    return
  } else {
      this.hidden = true
      this.arrowsShow = false
      arrows.parentNode.classList.add("trans-in")
  }

}

function submit_contentClick() {
  if(submit_title.value === "" || submit_text.value === "" ) {
    $(".modal-title span").text("错误！")
    $(".modal-body span").text("标题或内容不能为空！")
    $(".modal-footer button").addClass("btn-warning").text("Close")
    modal_status()
  } else {
      axios({
        method:'post',
        url:'/add_post',
        data:{
          title: submit_title.value,
          content: submit_text.value,
        }
      }).then((res) => {
          res_status(res.data, this)
      })
  }
}



function deleteContent(id) {
  axios({
    method:'delete',
    url:`/delete/content/` + id,
  }).then((res) => {
      for (let i = 0; i < myBBS.contents.length; i++) {
        if (myBBS.contents[i].id === res.data.id) {
          myBBS.contents.splice(i, 1)
          break
        }
      }
      res_status(res.data)
  })
}


function subGreatContent(id) {
  if (!myBBS.user.name) {
    $(".modal-title span").text("错误！")
    $(".modal-body span").text("未登陆,无法点赞！")
    $(".modal-footer button").addClass("btn-warning").text("Close")
    modal_status()
    myBBS.logInShow = true
    return
  } else {
    axios({
      method:'put',
      url:`/greatNumber/${id}/1/${this.greatContent ? 0 : 1}/_`,
    }).then((res) => {
        if(res.data.status === 'error') return 
        if (this.greatContent) {
          myBBS.user.greatHistory = myBBS.user.greatHistory.replace(`[${id}]`,"")
          this.contentData.greatNumber -= 1
        } else {
          myBBS.user.greatHistory = myBBS.user.greatHistory + `[${id}]`
          this.contentData.greatNumber += 1
        }
    })  
  }
}

function subGreatComment(id, index, e) {
  if (!myBBS.user.name) {
    $(".modal-title span").text("错误！")
    $(".modal-body span").text("未登陆,无法点赞！")
    $(".modal-footer button").addClass("btn-warning").text("Close")
    modal_status()
    myBBS.logInShow = true
    return
  } else {  
    axios({
      method:'put',
      url:`/greatNumber/${this.contentData.id}/2/${$(e.target).prev().prop('checked') ? 0 : 1}/${id}`,
    }).then((res) => {
        if(res.data.status === 'error') return 
        if ($(e.target).prev().prop('checked')) {
          myBBS.user.greatCommentsHistory = myBBS.user.greatCommentsHistory.replace(`[${id}]`,"")
          this.commentData[index].greatNumber -= 1
        } else {
          myBBS.user.greatCommentsHistory = myBBS.user.greatCommentsHistory + `[${id}]`
          this.commentData[index].greatNumber += 1
        }
    })  
  }
}

function commentBtn(data, index) {
  if (!myBBS.user.name) {
    $(".modal-title span").text("错误！")
    $(".modal-body span").text("未登陆,无法评论！")
    $(".modal-footer button").addClass("btn-warning").text("Close")
    modal_status()
    myBBS.logInShow = true
    return
  } 
  $('.submit_content_box').css({'z-index':'0'})
  this.hidden = true
  this.temporaryData = data
  this.temporaryData.index = index
  let el = $('.commentsComments form')
  myBBS.commentsComments = el
  el.css({'height':'320px'})
}

function subComment() {
  if (!myBBS.user.name) {
    $(".modal-title span").text("错误！")
    $(".modal-body span").text("未登陆,无法评论！")
    $(".modal-footer button").addClass("btn-warning").text("Close")
    modal_status()
    myBBS.logInShow = true
    return
  } 
  axios({
    method:'post',
    url:'/add_comment',
    data:{
        text: this.commentText,
        contentID:this.contentData.id,
    }
  }).then((res) => {
    res_status(res.data, this)
  })  
}

function deleteCommentBtn(id, index) {
  axios({
    method:'delete',
    url:`/delete/comment/${this.contentData.id}/${id}`,
  }).then((res) => {
      res.data.index = index
      res_status(res.data, this)
  })
}

function subCommentComment(id, index) {
  if (!myBBS.user.name) {
    hid.call(this)
    $(".modal-title span").text("错误！")
    $(".modal-body span").text("未登陆,无法评论！")
    $(".modal-footer button").addClass("btn-warning").text("Close")
    modal_status()
    myBBS.logInShow = true
    return
  } else {
    axios({
      method:'post',
      url:'/add_commentsComments',
      data:{
          text: this.commentCommentText,
          contentID:this.contentData.id,
          commentid:id,
      }
    }).then((res) => {
      hid.call(this)
      res.data.index = this.temporaryData.index
      res_status(res.data, this)
    })  
  }
}

function getCommentComments(id) {
  return axios('/commentsComments/' + id)
}

function deleteComments(comID, comsID, index){
  axios({
    method:'delete',
    url:`/delete/commentsComments/` + this.contentData.id + "/" + comID + "/" + comsID,
  }).then((res) => {
      this.commentComments.splice(index, 1)
      for (let i = 0; i < this.commentData.length; i++) {
        if (this.commentData[i].id === comID - 0) return this.commentData[i].sumComments -= 1
      }
  })
}

function repComments(text, comID, comsID, touser, index, el) {
  if (!myBBS.user.name) {
    hid.call(this)
    $(".modal-title span").text("错误！")
    $(".modal-body span").text("未登陆,无法评论！")
    $(".modal-footer button").addClass("btn-warning").text("Close")
    modal_status()
    myBBS.logInShow = true
    return
  } 
  axios({
    method:'post',
    url:'/replyComment',
    data:{
      text,
      commentsCommentsId:comsID,
      tousername:touser,
      commentid:comID,
      contentID:this.contentData.id,
    }
  }).then((res) => {
      if (res.data.status === 109) $(el).next().click()
      for (let i = 0; i < this.commentData.length; i++) {
        if (this.commentData[i].id === comID - 0) {
          this.commentData[i].sumComments += 1
          break
        } 
      }
      res_status(res.data, this)
  })
}

function lookUsersTalks(conID, comID, lookUserID, touser){
  return axios({
    method:'get',
    url:`/usersTalk/${conID}/${comID}/${lookUserID}/${touser}`,
  })
}