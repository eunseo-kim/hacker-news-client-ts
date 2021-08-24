// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"app.js":[function(require,module,exports) {
// Hacker News 피드 정보 가져오기
var ajax = new XMLHttpRequest();
var NEWS_URL = "https://api.hnpwa.com/v0/news/1.json";
var container = document.querySelector(".container");
var header = document.querySelector("header");
var postsPerPage = 5; // 1페이지 당 게시물 수

var store = {};
var currentPage = 1;

function getData(url) {
  ajax.open("GET", url, false);
  ajax.send();
  return JSON.parse(ajax.response);
} // newsFeed 불러오기


function getNewsFeed() {
  var newsFeed = getData(NEWS_URL);
  var lastPage = newsFeed.length % postsPerPage === 0 ? parseInt(newsFeed.length / postsPerPage) : parseInt(newsFeed.length / postsPerPage) + 1;
  var source = "\n    <ul>\n      {{#each list}}\n      <li>\n        <h3><a href=\"{{url}}\">{{title}} ({{domain}})</a></h3>\n        <div>\n          <span>{{points}} points by {{user}} {{time_ago}}</span>\n          <a href=\"{{individual_url}}\"><div id=\"comments\"><i class=\"far fa-comment\"></i>{{comments_count}} comments</div></a>\n        </div>\n      </li>\n      {{/each}}\n    </ul> \n    <div class=\"page\">\n        <a href=\"#news?p={{prev_page}}\"><span>Prev</span></a>\n        <a href=\"#news?p={{next_page}}\"><span>Next</span></a>\n    </div>\n    ";
  store = {
    list: newsFeed.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage),
    // 이전 페이지, 다음 페이지 구현(삼항 조건 연산자 사용)
    prev_page: currentPage > 1 ? currentPage - 1 : currentPage,
    next_page: currentPage < lastPage ? currentPage + 1 : lastPage
  };

  for (var i = 0; i < store.list.length; i++) {
    store.list[i].individual_url = "#item?id=".concat(store.list[i].id);
  }

  var template = Handlebars.compile(source);
  container.innerHTML = template(store);
  header.innerHTML = "\n  <h1>\n    <a href=\"\"><i class=\"fab fa-hacker-news-square\"></i>Hacker News</a>\n  </h1>";
} // 클릭한 글의 id를 전달해서 콘텐츠 화면 불러오기


function getIndividualContents(id) {
  var CONTENT_URL = "https://api.hnpwa.com/v0/item/".concat(id, "/json");
  var contents = getData(CONTENT_URL);
  var source = "\n  <div class=\"title\">\n    <h1>\n      <a href=\"{{url}}\">{{title}} ({{domain}})</a>\n    </h1>\n    <div>\n    <span>{{points}} points by {{user}} {{time_ago}}</span>\n    <div id=\"comments\"><i class=\"far fa-comment\"></i>{{comments_count}} comments</div>\n    </div>\n  </div>\n\n  <ul id=\"comments-list\">\n  </ul>\n  ";
  store = {
    title: contents.title,
    url: contents.url,
    domain: contents.domain,
    points: contents.points,
    user: contents.user,
    time_ago: contents.time_ago,
    comments_count: contents.comments_count
  };
  var template = Handlebars.compile(source);
  container.innerHTML = template(store); // comments의 html을 ul의 innerHTML으로 넣기

  function makeComments(comments) {
    var called = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var commentString = [];

    for (var i = 0; i < comments.length; i++) {
      commentString.push("\n        <li>\n          <div id=\"comment-info\" style = \"padding-left: ".concat(called * 1.5, "rem\"}><i class=\"far fa-comment-alt\"></i>").concat(comments[i].user, " ").concat(comments[i].time_ago, "</div>\n          <div style = \"padding-left: ").concat(called * 1.5, "rem\">").concat(comments[i].content, "</div>\n        </li> \n    "));

      if (comments[i].comments_count > 0) {
        commentString.push(makeComments(comments[i].comments, called + 1));
      }
    }

    return commentString.join("");
  }

  document.querySelector(".container ul").innerHTML = makeComments(contents.comments);
  header.innerHTML = "\n    <h1>\n      <a href=\"\"><i class=\"fab fa-hacker-news-square\"></i>Hacker News</a>\n    </h1>\n    <div title=\"\uB4A4\uB85C\uAC00\uAE30\">\n      <a href=\"#\"><i class=\"fas fa-arrow-circle-left\"></i></a>\n    </div>\n  ";
} // 라우터 구현


function router() {
  var hash = location.hash;

  if (hash === "") {
    getNewsFeed();
  } else if (hash.substr(1, 7) === "news?p=") {
    // currentPage 갱신
    currentPage = Number(hash.substr(8));
    getNewsFeed();
  } else {
    getIndividualContents(hash.substr(9, location.hash.length));
  }
}

window.addEventListener("hashchange", router);
router();
},{}],"../../../AppData/Roaming/npm/node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "59492" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../../../AppData/Roaming/npm/node_modules/parcel-bundler/src/builtins/hmr-runtime.js","app.js"], null)
//# sourceMappingURL=/app.c328ef1a.js.map