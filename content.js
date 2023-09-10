// :not(.ytp-live) is needed to avoid selecting duration in live streams
const VIDEO_LENGTH_SELECTOR = ":not(.ytp-live).ytp-time-display .ytp-time-duration";
const OBERSVER_TIMEOUT = 10_000;

// For some reason, after navigation YouTube glances previos video title as current title. We track it to avoid double length in title.
let prevTitle = "";
// Fix for videos with length = 0:00, caused by Disable HTML5 Autoplay (Reloaded) https://chrome.google.com/webstore/detail/disable-html5-autoplay-re/cafckninonjkogajnihihlnnimmkndgf
let prevLength = "";
const EMPTY_LENGTH = "0:00";

function isYouTubeVideoPage() {
  if (window.location.hostname === 'www.youtube.com' || window.location.hostname === 'm.youtube.com') {
    return window.location.pathname.startsWith('/watch');
  }
  return false;
}

function updateTitle(videoLengthElement) {
  // Fix for videos with length = 0:00, caused by Disable HTML5 Autoplay (Reloaded) https://chrome.google.com/webstore/detail/disable-html5-autoplay-re/cafckninonjkogajnihihlnnimmkndgf
  const lengthRaw = videoLengthElement?.textContent;
  const length = lengthRaw === EMPTY_LENGTH ? prevLength : lengthRaw;
  prevLength = length;
  if (isYouTubeVideoPage() && !document.title.includes(length) && document.title !== prevTitle) {
    const newTitle = `${length} ${document.title}`;
    document.title = newTitle;
    prevTitle = newTitle;
  }
}

function waitForElement(selector, callback) {
  const element = document.querySelector(selector);
  if (element) {
    callback(element);
    return;
  }

  let timeoutId;

  const observer = new MutationObserver((_mutationsList, observer) => {
    const element = document.querySelector(selector);
    if (element) {
      callback(element);
      observer.disconnect();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      return;
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  /* 
    Disconnect observers after OBERSVER_TIMEOUT, just in case.
    Also, since this script doesn't differentiate between streams and videos,
    this will prevent infinite wait for observers in streams
    TODO: can we detect video/stream earlier and not call all of this for stream?
  */
  timeoutId = setTimeout(function () {
    observer.disconnect();
  }, OBERSVER_TIMEOUT);
}

// Do it once, in case title doesn't change for some reason
waitForElement(VIDEO_LENGTH_SELECTOR, updateTitle);

// Observe changes to the document's title (youtube overrides it a few times after initial page load)
waitForElement('title', function (titleElement) {
  const observer = new MutationObserver(function (mutationsList) {
    for (let mutation of mutationsList) {
      if (mutation.type === 'childList') {
        console.log(document.querySelector("title"))
        waitForElement(VIDEO_LENGTH_SELECTOR, updateTitle);
      }
    }
  });
  observer.observe(titleElement, { childList: true });
})
