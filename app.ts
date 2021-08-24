interface Store {
  currentPage: number;
}

interface News {
  title: string;
  points: number;
  time_ago: string;
  url: string;
  domain: string;
  user: string;
  id: number;
}

interface NewsFeed extends News {
  domain: string;
  comments_count: number;
  newsUrl: string;
}

interface NewsDetail extends News {
  comments: NewsComment[];
  comments_count: number;
  domain: string;
}

interface NewsComment extends News {
  comments: NewsComment[];
  level: number;
}

const ajax: XMLHttpRequest = new XMLHttpRequest();
const NEWS_URL: string = "https://api.hnpwa.com/v0/news/1.json";
const container: HTMLElement | null = document.querySelector(".container");
const header: HTMLElement | null = document.querySelector("header");
const postsPerPage: number = 5; // 1페이지 당 게시물 수
const store: Store = {
  currentPage: 1,
};

function getData<AjaxResponse>(url: string): AjaxResponse {
  ajax.open("GET", url, false);
  ajax.send();
  return JSON.parse(ajax.response);
}

// newsFeed 불러오기
function getNewsFeed(): void {
  const newsFeeds = getData<NewsFeed[]>(NEWS_URL);
  const lastPage = newsFeeds.length % postsPerPage === 0 ? parseInt(newsFeeds.length / postsPerPage) : parseInt(newsFeeds.length / postsPerPage) + 1;

  const source = `
    <ul>
      {{#each list}}
      <li>
        <h3><a href="{{url}}">{{title}} ({{domain}})</a></h3>
        <div>
          <span>{{points}} points by {{user}} {{time_ago}}</span>
          <a href="{{newsUrl}}"><div id="comments"><i class="far fa-comment"></i>{{comments_count}} comments</div></a>
        </div>
      </li>
      {{/each}}
    </ul> 
    <div class="page">
        <a href="#news?p={{prev_page}}"><span>Prev</span></a>
        <a href="#news?p={{next_page}}"><span>Next</span></a>
    </div>
    `;

  const NewsFeed = {
    list: newsFeeds.slice((store.currentPage - 1) * postsPerPage, store.currentPage * postsPerPage),
    // 이전 페이지, 다음 페이지 구현(삼항 조건 연산자 사용)
    prev_page: store.currentPage > 1 ? store.currentPage - 1 : store.currentPage,
    next_page: store.currentPage < lastPage ? store.currentPage + 1 : lastPage,
  };

  for (let i = 0; i < NewsFeed.list.length; i++) {
    NewsFeed.list[i].newsUrl = `#item?id=${NewsFeed.list[i].id}`;
  }

  let template = Handlebars.compile(source);
  container.innerHTML = template(NewsFeed);
  header.innerHTML = `
  <h1>
    <a href=""><i class="fab fa-hacker-news-square"></i>Hacker News</a>
  </h1>`;
}

// 클릭한 글의 id를 전달해서 콘텐츠 화면 불러오기
function getNewsDetail(id: number): void {
  const CONTENT_URL = `https://api.hnpwa.com/v0/item/${id}/json`;
  const contents = getData(CONTENT_URL);
  const source = `
  <div class="title">
    <h1>
      <a href="{{url}}">{{title}} ({{domain}})</a>
    </h1>
    <div>
    <span>{{points}} points by {{user}} {{time_ago}}</span>
    <div id="comments"><i class="far fa-comment"></i>{{comments_count}} comments</div>
    </div>
  </div>

  <ul id="comments-list">
  </ul>
  `;

  const newsDetails = {
    title: contents.title,
    url: contents.url,
    domain: contents.domain,
    points: contents.points,
    user: contents.user,
    time_ago: contents.time_ago,
    comments_count: contents.comments_count,
  };

  const template = Handlebars.compile(source);
  container.innerHTML = template(newsDetails);

  // comments의 html을 ul의 innerHTML으로 넣기
  function makeComments(comments, called = 0) {
    const commentString = [];
    for (let i = 0; i < comments.length; i++) {
      commentString.push(`
        <li>
          <div id="comment-info" style = "padding-left: ${called * 1.5}rem"}><i class="far fa-comment-alt"></i>${comments[i].user} ${comments[i].time_ago}</div>
          <div style = "padding-left: ${called * 1.5}rem">${comments[i].content}</div>
        </li> 
    `);
      if (comments[i].comments_count > 0) {
        commentString.push(makeComments(comments[i].comments, called + 1));
      }
    }
    return commentString.join("");
  }

  document.querySelector(".container ul").innerHTML = makeComments(contents.comments);
  header.innerHTML = `
    <h1>
      <a href=""><i class="fab fa-hacker-news-square"></i>Hacker News</a>
    </h1>
    <div title="뒤로가기">
      <a href="#"><i class="fas fa-arrow-circle-left"></i></a>
    </div>
  `;
}

// 라우터 구현
function router(): void {
  const hash = location.hash;
  if (hash === "") {
    getNewsFeed();
  } else if (hash.substr(1, 7) === "news?p=") {
    // store.currentPage 갱신
    store.currentPage = Number(hash.substr(8));
    getNewsFeed();
  } else {
    getNewsDetail(hash.substr(9, location.hash.length));
  }
}
window.addEventListener("hashchange", router);
router();
