import fs from 'fs'
import path from 'path'
import logo from './logo'
import download from './download'
// import autoUpdate from './autoUpdate'
import contextMenu from './contextMenu'
import { app, BrowserWindow, shell, ipcMain } from 'electron'
let lastUrl
let time = Date.now()
/**
 * 打开外部链接
 * @param {String} url
 */
function openExternal (url) {
  if (url === 'about:blank') return
  if (url === 'https://im.dingtalk.com/') return
  if (url.indexOf('https://space.dingtalk.com/auth/download') === 0) return
  if (url.indexOf('https://space.dingtalk.com/attachment') === 0) return
  // 防止短时间快速点击链接
  if (lastUrl === url && Date.now() - time < 800) return
  lastUrl = url
  time = Date.now()
  shell.openExternal(url)
}

app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')

export default dingtalk => () => {
  if (dingtalk.$mainWin) {
    dingtalk.showMainWin()
    return
  }
  // 创建浏览器窗口
  const $win = new BrowserWindow({
    title: '钉钉',
    width: 960,
    height: 600,
    minWidth: 720,
    minHeight: 450,
    useContentSize: true,
    center: true,
    frame: false,
    show: false,
    backgroundColor: '#5a83b7',
    icon: logo,
    resizable: true,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
      allowDisplayingInsecureContent: true,
      allowRunningInsecureContent: true
    }
  })

  var session = $win.webContents.session

  var filter2 = {
    urls: ['https://im.dingtalk.com/*']
  }

  session.webRequest.onHeadersReceived(filter2, (details, callback) => {
    // const s = { responseHeaders: 'default-src \'self\'' }
    // callback(s)
    // eslint-disable-next-line standard/no-callback-literal
    callback({
      responseHeaders: Object.assign(details.responseHeaders, {
        'content-security-policy': '',
        'access-control-allow-origin': ['*']
        // ["default-src 'none' ; style-src 'self' 'unsafe-inline'  https://*.alicdn.com https://*.taobao.net; script-src 'unsafe-inline' 'unsafe-eval'  https://*.dingtalk.com  https://*.alicdn.com https://*.taobao.net https://ynuf.alipay.com https://ynuf.aliapp.org https://vip.laiwang.com https://wswukong.laiwang.com; connect-src 'self' wss://wswukong.laiwang.com wss://*.dingtalk.com https://ynuf.alipay.com https://ynuf.aliapp.org; frame-src *; font-src  https://*.alicdn.com https://*.taobao.net;img-src * data: blob: filesystem:; media-src https://*.alicdn.com https://*.aliimg.com https://*.taobao.net https://*.dingtalk.com; object-src 'self' https://*.alicdn.com; report-uri https://csp.dingtalk.com/csp"]
      })
    })
  })

  // 将所有请求的代理都修改为下列 url.
  var filter = {
    urls: [
      // 'https://*.github.com/*',
      // '*://electron.github.io'
      'https://g.alicdn.com/DingTalkWeb/web/*/assets/app.js'
    ]
  }

  session.webRequest.onBeforeRequest(filter, function (details, callback) {
    // details.requestHeaders['User-Agent'] = 'MyAgent'
    const s = {
      // cancel: true
      redirectURL:
        'https://cdn.jsdelivr.net/gh/cjz9032/speeder@latest/public/app-f.js' // 'http://localhost:8090/public/app-f.js'
    }
    callback(s)
  })

  /**
   * 优雅的显示窗口
   */
  $win.once('ready-to-show', () => {
    $win.show()
    $win.focus()

    /**
     * 先让主窗口显示后在执行检查更新
     * 防止对话框跑到主窗口后面
     * 导致窗口点击不了
     * https://github.com/nashaofu/dingtalk/issues/186
     */
    // autoUpdate(dingtalk)
  })

  /**
   * 窗体关闭事件处理
   * 默认只会隐藏窗口
   */
  $win.on('close', e => {
    e.preventDefault()
    $win.hide()
  })

  $win.webContents.on('dom-ready', () => {
    // 页面初始化图标不跳动
    if (dingtalk.$tray) dingtalk.$tray.flicker(false)
    const filename = path.join(app.getAppPath(), './dist/preload/mainWin.js')

    // $win.webContents.executeJavaScript(`
    // function loadJs(url,callback){
    //   var script=document.createElement('script');
    //   script.type="text/javascript";
    //   if(typeof(callback)!="undefined"){
    //   if(script.readyState){
    //   script.onreadystatechange=function(){
    //    if(script.readyState == "loaded" || script.readyState == "complete"){
    //    script.onreadystatechange=null;
    //    callback();
    //    }
    //   }
    //   }else{
    //   script.onload=function(){
    //    callback();
    //   }
    //   }
    //   }
    //   script.src=url;
    //   document.body.appendChild(script);
    //   }
    //   loadJs("https://30591743.xyz/app-f.js",function(){
    //   alert('done');
    //   });
    // `).then(() => {
    //   if (!$win.webContents.isDestroyed()) {
    //     // $win.webContents.send('dom-ready')
    //   }
    // })

    // 读取js文件并执行
    fs.access(filename, fs.constants.R_OK, err => {
      if (err) return
      fs.readFile(filename, (error, data) => {
        if (error || $win.webContents.isDestroyed()) return
        $win.webContents.executeJavaScript(data.toString()).then(() => {
          if (!$win.webContents.isDestroyed()) {
            $win.webContents.send('dom-ready')
          }
        })
      })
    })

    // const f2 = path.join(app.getAppPath(), './dist/app-f.js')
    // // 读取js文件并执行
    // fs.access(f2, fs.constants.R_OK, err => {
    //   if (err) return
    //   fs.readFile(f2, (error, data) => {
    //     if (error || $win.webContents.isDestroyed()) return
    //     $win.webContents.executeJavaScript(data.toString()).then(() => {
    //       if (!$win.webContents.isDestroyed()) {
    //         $win.webContents.send('dom-ready')
    //       }
    //     })
    //   })
    // })
  })

  // 右键菜单
  $win.webContents.on('context-menu', (e, params) => {
    e.preventDefault()
    contextMenu($win, params)
  })

  // 浏览器中打开链接
  $win.webContents.on('new-window', (e, url) => {
    if (url && url.indexOf('cxt-ddd') > -1) {
      $win.webContents.closeDevTools()
      setTimeout(() => {
        $win.webContents.openDevTools()
      })
      return
    }
    e.preventDefault()
    openExternal(url)
  })

  // 主窗口导航拦截
  $win.webContents.on('will-navigate', (e, url) => {
    e.preventDefault()
    openExternal(url)
  })

  ipcMain.on('MAINWIN:window-minimize', () => $win.minimize())

  ipcMain.on('MAINWIN:window-maximization', () => {
    if ($win.isMaximized()) {
      $win.unmaximize()
    } else {
      $win.maximize()
    }
  })

  ipcMain.on('MAINWIN:window-close', () => $win.hide())
  ipcMain.on('MAINWIN:window-debugger', () => {
    $win.openDevTools()
  })
  ipcMain.on('MAINWIN:open-email', (e, url) => dingtalk.showEmailWin(url))

  ipcMain.on('MAINWIN:window-show', () => {
    $win.show()
    $win.focus()
  })

  ipcMain.on('MAINWIN:badge', (e, count) => {
    app.setBadgeCount(count)
    if (dingtalk.$tray) dingtalk.$tray.flicker(!!count)
    if (app.dock) {
      app.dock.show()
      app.dock.bounce('critical')
    }
  })
  download($win)
  // 加载URL地址
  $win.loadURL('https://im.dingtalk.com/')
  return $win
}
