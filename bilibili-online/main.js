// ==UserScript==
// @name         bilibili-live-onlive
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://live.bilibili.com/*
// @run-at        document-body
// ==/UserScript==
(async function () {
  "use strict";

  const ROOMNO = "" + location.pathname.replace("/", "");

  // WebSocket
  const textEncoder = new TextEncoder("utf-8");
  const textDecoder = new TextDecoder("utf-8");

  function readInt(buffer, start, len) {
    let result = 0;
    for (let i = len - 1; i >= 0; i--) {
      result += Math.pow(256, len - i - 1) * buffer[start + i];
    }
    return result;
  }

  function writeInt(buffer, start, len, value) {
    let i = 0;
    while (i < len) {
      buffer[start + i] = value / Math.pow(256, len - i - 1);
      i++;
    }
  }

  function encode(str, op) {
    let data = textEncoder.encode(str);
    let packetLen = 16 + data.byteLength;
    let header = [0, 0, 0, 0, 0, 16, 0, 1, 0, 0, 0, op, 0, 0, 0, 1];
    writeInt(header, 0, 4, packetLen);
    return new Uint8Array(header.concat(...data)).buffer;
  }
  function decode(message) {
    return new Promise(function (resolve, reject) {
      let blob = message.data;
      let reader = new FileReader();
      reader.onload = function (e) {
        let buffer = new Uint8Array(e.target.result);
        let result = {};
        result.packetLen = readInt(buffer, 0, 4);
        result.headerLen = readInt(buffer, 4, 2);
        result.ver = readInt(buffer, 6, 2);
        result.op = readInt(buffer, 8, 4);
        result.seq = readInt(buffer, 12, 4);
        if (result.op === 5) {
          result.body = [];
          let offset = 0;
          while (offset < buffer.length) {
            let packetLen = readInt(buffer, offset + 0, 4);
            let headerLen = 16; // readInt(buffer,offset + 4,4)
            let data = buffer.slice(offset + headerLen, offset + packetLen);
            let body = textDecoder.decode(data);
            if (body) {
              result.body.push(JSON.parse(body));
            }
            offset += packetLen;
          }
        } else if (result.op === 3) {
          result.body = {
            count: readInt(buffer, 16, 4),
          };
        }
        resolve(result);
      };
      reader.readAsArrayBuffer(blob);
    });
  }
  function wsroom(roomid, mcallback, opencb, closecb) {
    this.ws = new WebSocket("wss://broadcastlv.chat.bilibili.com:2245/sub");
    this.roomid = Number(roomid);
    this.ws.onopen = () => {
      this.ws.send(
        encode(
          JSON.stringify({
            uid: 0,
            roomid: this.roomid,
          }),
          7
        )
      );
      console.log("打开连接: " + this.roomid);
      let heartTimerId = setInterval(() => {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(encode("", 2));
        } else {
          clearInterval(heartTimerId);
        }
      }, 30000);
      if (typeof opencb === "function") {
        opencb(this);
      }
    };
    this.ws.onclose = () => {
      console.log("关闭连接: " + this.roomid);
    };
    this.close = () => {
      this.ws.close();
      if (typeof closecb === "function") {
        closecb(this);
      }
    };
    this.ws.onmessage = async (data) => {
      data = await decode(data);
      if (data.op === 5) {
        for (let i = 0; i < data.body.length; ++i) {
          let body = data.body[i];
          if (typeof mcallback === "function") {
            mcallback(body, this);
          }
        }
      }
      if (data.op === 3) {
        data.body.cmd = "HEART";
        if (typeof mcallback === "function") {
          mcallback(data.body, this);
        }
      }
    };
  }
  // WebSocket

  const axios = function ({
    url,
    data,
    method,
    onUploadProgress,
    headers,
    dataType,
  }) {
    return new Promise(function (resolve, reject) {
      let xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      if (typeof onUploadProgress === "function") {
        xhr.upload.addEventListener("progress", onUploadProgress);
      }
      if (typeof headers === "object") {
        for (let key in headers) {
          xhr.setRequestHeader(key, headers[key]);
        }
      }
      xhr.withCredentials = true;
      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
          if (xhr.status == 200) {
            if (/json/.test(xhr.getAllResponseHeaders())) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              resolve(xhr.responseText);
            }
          } else {
            reject("error");
          }
        }
      };
      if (dataType === "formdata") {
        xhr.setRequestHeader(
          "Content-Type",
          "application/x-www-form-urlencoded"
        );
        let fromdata = "";
        for (let key in data) {
          fromdata += `${key}=${data[key]}&`;
        }
        data = fromdata.substr(0, fromdata.length - 1);
      }
      xhr.send(data);
    });
  };

  const sleep = function (time) {
    return new Promise(function (resolve, reject) {
      setTimeout(() => {
        resolve();
      }, time);
    });
  };

  async function getRoomId(shortId) {
    let res = await axios({
      method: "get",
      url: `https://live.bilibili.com/${shortId}`,
    });
    return res.match(/"room_id":(.*?),/)[1];
  }

  async function getAbleJoinGroup() {
    return await axios({
      url: "https://api.vc.bilibili.com/link_group/v1/member/joinable_groups",
      method: "get",
    });
  }

  const Style = {
    dom: document.createTextNode(""),
    style: {},
    init: () => {
      let dom = document.createElement("style");
      dom.setAttribute("type", "text/css");
      dom.appendChild(Style.dom);
      document.head.appendChild(dom);
    },
    insert: (classname, style) => {
      if (!Style.style[classname]) {
        Style.style[classname] = {};
      }
      Object.assign(Style.style[classname], style);
      Style.update();
    },
    update: () => {
      let str = "";
      for (let key in Style.style) {
        str += `${key}{`;
        for (let skey in Style.style[key]) {
          str += `${skey}:${Style.style[key][skey]};`;
        }
        str += `}`;
      }
      Style.dom.nodeValue = str;
    },
  };

  const Statistical = {
    mainDom: document.createElement("div"),
    statusDom: document.createElement("div"),
    adminDom: document.createElement("div"),
    ableJoinDom: document.createElement("div"),
    init: () => {
      Statistical.mainDom.className = "Statistical";
      Statistical.mainDom.style.position = "fixed";
      Statistical.mainDom.style.display = "inline-block";
      Statistical.mainDom.style.padding = "10px 10px 10px 10px";
      Statistical.mainDom.style.borderBottomLeftRadius = "12px";
      Statistical.mainDom.style.borderTopLeftRadius = "12px";
      Statistical.mainDom.style.border = "1px solid #e9eaec";
      Statistical.mainDom.style.boxShadow = "0 0 20px 0 rgba(0,85,255,.1)";
      Statistical.mainDom.style.right = "0px";
      Statistical.mainDom.style.top = "100px";
      Statistical.mainDom.style.backgroundColor = "#fff";
      Statistical.mainDom.style.zIndex = "999";
      Statistical.mainDom.style.maxWidth = "200px";
      document.querySelector("body").appendChild(Statistical.mainDom);
      Statistical.statusDom.style.padding = "7px";
      Statistical.mainDom.appendChild(Statistical.statusDom);
      Statistical.adminDom.className = "adminmsgbox";
      Statistical.mainDom.appendChild(Statistical.adminDom);
      Statistical.update("发过弹幕的人数: 0");
      getAbleJoinGroup().then((data) => {
        if (data.data.list.length) {
          Statistical.ableJoinDom.style.padding = "7px";
          Statistical.ableJoinDom.innerHTML = `有${data.data.list.length}个应援团可加入`;
          Statistical.mainDom.appendChild(Statistical.ableJoinDom);
        }
      });
    },
    update(value) {
      Statistical.statusDom.innerHTML = value;
    },
    admin(item) {
      let msg = document.createElement("div");
      msg.className = "msg adminmsg";
      msg.innerHTML = `<span class='admin-icon'>${item.admin}</span><span class='name'>${item.name}:</span>${item.msg}`;
      Statistical.adminDom.appendChild(msg);
    },
    self(item) {
      let msg = document.createElement("div");
      msg.className = "msg selfmsg";
      msg.innerHTML = `<span class='admin-icon'>${item.admin}</span><span class='name'>${item.name}:</span>${item.msg}`;
      Statistical.adminDom.appendChild(msg);
    },
  };

  const Admin = {
    master: null,
    admins: [],
    logs: [],
    async init(roomid) {
      Admin.admins = (
        await axios({
          method: "get",
          url: `https://api.live.bilibili.com/xlive/web-room/v1/roomAdmin/get_by_room?roomid=${roomid}&page_size=20`,
        })
      ).data.data;
      Admin.master = (
        await axios({
          method: "get",
          url: `https://api.live.bilibili.com/live_user/v1/UserInfo/get_anchor_in_room?roomid=${roomid}`,
        })
      ).data.info.uid;
    },
    isAdmin(uid) {
      if (uid === Admin.master) return "主播";
      for (let item of Admin.admins) {
        if (item.uid === uid) return "房管";
      }
      return false;
    },
    push(item) {
      Admin.logs.push(item);
      if (item.admin === "自己") {
        Statistical.self(item);
      } else {
        Statistical.admin(item);
      }
      Statistical.adminDom.scrollTop = Statistical.adminDom.scrollHeight + 500;
    },
  };

  Style.init();
  Style.insert(".Statistical .adminmsgbox", {
    "max-height": "300px",
    "overflow-y": "auto",
  });
  Style.insert(".Statistical .adminmsgbox .msg", {
    padding: "4px 5px",
    "max-height": "300px",
    "overflow-y": "auto",
    "word-break": "break-all",
  });
  Style.insert(".Statistical .adminmsgbox .msg .admin-icon", {
    "margin-right": "3px",
    "border-color": "#ea9336",
    "background-color": "#ffa340",
    display: "inline-block",
    height: "15px",
    padding: "1px 8px",
    border: "1px solid #fff",
    "border-radius": "4px",
    "line-height": "17px",
    "font-size": "12px",
    color: "#fff",
  });
  Style.insert(".Statistical .adminmsgbox .adminmsg .admin-icon", {
    "background-color": "#ffa340",
  });
  Style.insert(".Statistical .adminmsgbox .selfmsg .admin-icon", {
    "background-color": "#ff86b2",
  });
  Style.insert(".Statistical .adminmsgbox .msg .name", {
    "margin-right": "3px",
    color: "#23ade5",
  });
  Statistical.init();
  let roomid = await getRoomId(ROOMNO);
  Admin.init(roomid);
  let selfuid = (
    await axios({
      method: "get",
      url: "https://api.live.bilibili.com/xlive/web-ucenter/user/get_user_info",
    })
  ).data.uid;
  console.log(selfuid);
  let uidlist = [];
  let readyList = [];
  let room = new wsroom(
    roomid,
    function (body) {
      //msgcb
      if (body.cmd === "DANMU_MSG") {
        let uid = body.info[2][0];
        let ul = body.info[4][0];
        //info[0][9]如果不等于0就是抽奖弹幕
        if (ul > 1 && body.info[0][9] === 0) {
          readyList.push(uid);
        }
        let admin = Admin.isAdmin(uid);
        admin = admin ? admin : uid === selfuid ? "自己" : false;
        if (admin) {
          Admin.push({
            uid,
            name: body.info[2][1],
            msg: body.info[1],
            admin,
          });
        }
      } else if (
        body.cmd === "WELCOME" ||
        body.cmd === "SEND_GIFT" ||
        body.cmd === "WELCOME_GUARD" ||
        body.cmd === "ENTRY_EFFECT" ||
        body.cmd === "COMBO_END" ||
        body.cmd === "COMBO_SEND"
      ) {
        let uid = body.data.uid;
        readyList.push(uid);
      } else if (
        body.cmd !== "HEART" &&
        body.cmd !== "SYS_MSG" &&
        body.cmd !== "NOTICE_MSG" &&
        body.cmd !== "ROOM_RANK" &&
        body.cmd !== "ROOM_REAL_TIME_MESSAGE_UPDATE"
      ) {
        console.log(body);
      }
    },
    function () {},
    function () {
      //closecb
    }
  );

  setTimeout(async function () {
    while (true) {
      if (readyList.length) {
        if (!uidlist.includes(readyList[0])) {
          uidlist.push(readyList[0]);
        }
        readyList.splice(0, 1);
      } else {
        Statistical.update(`发过弹幕的人数: ${uidlist.length}`);
        await sleep(5000);
      }
    }
  });

  setInterval(() => {
    Statistical.update(`发过弹幕的人数: ${uidlist.length}`);
  }, 5000);
})();
