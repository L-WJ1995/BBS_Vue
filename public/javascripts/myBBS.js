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

function res_status(data) {
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

    case 201: {
      username.value = captcha.value = ""
      let str = data.type === "login" ? ["登录失败", "用户名不存在,请重试！"] : ["注册失败", "用户名已存在,请更换用户名！"]
      $(".modal-title span").text(str[0])
      $(".modal-body span").text(str[1])
      $(".modal-footer button").addClass("btn-warning").text("Close")
      break
    }

    case 202: {
      username.value = password.value = captcha.value = ""
      $(".modal-title span").text("登录失败")
      $(".modal-body span").text("用户名或密码错误,请重试！")
      $(".modal-footer button").addClass("btn-warning").text("Close")
      break
    }

    case 203: {
      captcha.value = ""
      let str = data.type === "login" ? ["登录失败", "验证码输入有误,请重试！"] : ["注册失败", "验证码输入有误,请重试！"]
      $(".modal-title span").text(str[0])
      $(".modal-body span").text(str[1])
      $(".modal-footer button").addClass("btn-warning").text("Close")
      break
    }

    case 205: {
      captcha.value = ""
      let str = data.type === "login" ? ["登录失败", "验证码超时,请重试！"] : ["注册失败", "验证码超时,请重试！"]
      $(".modal-title span").text(str[0])
      $(".modal-body span").text(str[1])
      $(".modal-footer button").addClass("btn-warning").text("Close")
      break
    }

    case 300: {
      $(".modal-title span").text("发帖成功")
      $(".modal-body span").text("正在跳转")
      $(".modal-footer button").removeClass("btn-warning").addClass("btn-success").text("Close")
      $(".bs-example-modal-sm").modal("show")
      getcontent(data.id)
      setTimeout(() => {
        myBBS.$router.push("./content/" + data.id)
        myBBS.shade = false
        myBBS.arrowsShow = true
        arrows.parentNode.classList.remove("trans-in", "trans-out")
        arrows.style.display = "block"
      }, 300)
      break
    }

    case 50: {
      $(".modal-title span").text("删除成功")
      $(".modal-body span").text("正在返回")
      $(".modal-footer button").removeClass("btn-warning").addClass("btn-success").text("Close")
      $(".bs-example-modal-sm").modal("show")
      myBBS.$router.push("/")
      break
    }

  }
  modal_status()
}


function modal_status() {
  $(".bs-example-modal-sm").modal("show")
  let modal_ID = setTimeout(() => {
    $(".bs-example-modal-sm").modal("hide")
  }, 1500)
  $(".bs-example-modal-sm").on("hidden.bs.modal", () => {
    clearTimeout(modal_ID)
    $(".bs-example-modal-sm").off("hidden.bs.modal")
  })
}



function shadeClick() {
  myBBS.shade = false
  if (!myBBS.arrowsShow && arrows) {
    arrows.parentNode.classList.add("trans-out")
    setTimeout(() => {
      myBBS.arrowsShow = true
      arrows.parentNode.classList.remove("trans-in", "trans-out")
      arrows.style.display = "block"
    },600)
  }
}


function arrowsClick() {
  if (!myBBS.user.name) {
    $(".modal-title span").text("错误！")
    $(".modal-body span").text("未登陆,无法发布帖子！")
    $(".modal-footer button").addClass("btn-warning").text("Close")
    modal_status()
    myBBS.next = "submit_content"
    myBBS.logInShow = true
    return
  } else {
      myBBS.shade = true
      myBBS.arrowsShow = false
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
          res_status(res.data)
      })
  }
}

function getcontent(id) {
  axios.get('/content/' + id)
  .then((res) => {
    myBBS.contentGreat = res.data.contentGreat
    myBBS.contentData = res.data.contentData
    myBBS.commentData = res.data.commentData
  })
}

function deleteContent(id) {
  axios({
    method:'delete',
    url:`/delete/content/` + contentID,
  }).then((res) => {
      res_status(res.data)
  })
}
