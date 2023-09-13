// For some reason, after navigation YouTube glances previos video title as current title. We track it to avoid double length in title.
let prevTitle = "";

// Seems like I can't access window variables, eh
console.log("ytInitialData")
console.log(window?.ytInitialData);
setTimeout(() => {
  console.log("ytInitialData")
  console.log(window?.ytInitialData);
}, 10000)
function secondsToHMS(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (hours) parts.push(hours);
  parts.push(minutes.toString().padStart(hours ? 2 : 1, '0'));
  parts.push(seconds.toString().padStart(2, '0'));

  return parts.join(':');
}

function isYouTubeVideoPage() {
  if (window.location.hostname === 'www.youtube.com' || window.location.hostname === 'm.youtube.com') {
    return window.location.pathname.startsWith('/watch');
  }
  return false;
}

// We know that ytInitialPlayerResponse exists.
function isLiveStream() {
  return window.ytInitialPlayerResponse?.videoDetails?.isLive
}

function getDurationInSeconds() {
  return parseInt(window.ytInitialPlayerResponse?.videoDetails?.lengthSeconds) || 0;
}

function updateTitle() {
  if (isLiveStream()) return;
  const lengthRaw = getDurationInSeconds();
  if (!lengthRaw) return;
  const length = secondsToHMS(lengthRaw);
  if (isYouTubeVideoPage() && !document.title.includes(length) && document.title !== prevTitle) {
    const newTitle = `${length} ${document.title}`;
    document.title = newTitle;
    prevTitle = newTitle;
  }
}

updateTitle();

// Observe changes to the document's title (youtube overrides it a few times after initial page load)
const observer = new MutationObserver(function (mutationsList) {
  for (let mutation of mutationsList) {
    if (mutation.type === 'childList') {
      updateTitle();
    }
  }
});
observer.observe(document.querySelector("title"), { childList: true });
