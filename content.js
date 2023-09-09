const VIDEO_LENGTH_SELECTOR = ".ytp-time-duration";
const OBERSVER_TIMEOUT = 10_000;
// Hack to identify that page title was updated. Otherwise, old title flashes with old video length AND new video length.
const YVLiT = "(YVLiT)";

function isYouTubeVideoPage() {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  if (hostname === 'www.youtube.com' || hostname === 'm.youtube.com') {
      return pathname.startsWith('/watch');
  }

  return false;
}

function updateTitle(videoLengthElement) {  
  const length = videoLengthElement?.textContent;
  if (isYouTubeVideoPage() && !document.title.endsWith(YVLiT)) {
    document.title = `${length} ${document.title} ${YVLiT}`;
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
  timeoutId = setTimeout(function() {
      observer.disconnect();
  }, OBERSVER_TIMEOUT);
}

// Observe changes to the document's title (youtube overrides it a few times after initial page load)
const documentTitle = document.querySelector('head > title');

function updateTitleAfterChange(mutationsList) {
  for (let mutation of mutationsList) {
    if (mutation.type === 'childList') {
      waitForElement(VIDEO_LENGTH_SELECTOR, updateTitle);
    }
  }
};

// Do it once, in case title doesn't change for some reason
waitForElement(VIDEO_LENGTH_SELECTOR, updateTitle);
const observer = new MutationObserver(updateTitleAfterChange).observe(documentTitle, { childList: true });
