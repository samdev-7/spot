chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'CLOSE') {
    const tab = sender.tab
    if (tab?.id == null) {
      return
    }

    if (!message.new_tab) {
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: onClose
    })
  } else {
    chrome.tabs.query({currentWindow: true}, (tabs) => {
      if (tabs.length <= 1) {
        return
      }

      setTimeout(() => {
        chrome.tabs.remove(tab.id as number)
      }, 100)
    })
  }
  } else if (message.type == 'URL') {
    const tab = sender.tab
    if (tab?.id == null) {
      return
    }
    const url = message.url

    chrome.tabs.create({url: url})
  } else if (message.type == 'NEW_TAB') {
    chrome.tabs.create({url: chrome.runtime.getURL('new.html')})
  }
})

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'open') {
    if (tab?.id == null) {
      return
    }

    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: onOpen
    })
  }
})

chrome.action.onClicked.addListener((tab) => {
  if (tab?.id == null) {
    return
  }

  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: onOpen
  })
})

/* RUNS IN THE CONTEXT OF THE PAGE */
function onOpen() {
  const searchHtml = chrome.runtime.getURL('search.html')

  let search: HTMLIFrameElement;
  if (document.getElementById('spot-search-container')) {
      search = document.getElementById('spot-search-container') as HTMLIFrameElement
      search.src = search.src
  } else {
      search = document.createElement('iframe')
      search.id = 'spot-search-container'
      search.src = searchHtml
      search.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
          z-index: 999999;
      `
      document.body.appendChild(search)
  }
}

/* RUNS IN THE CONTEXT OF THE PAGE */
function onClose() {
  document.getElementById('spot-search-container')?.remove()
}
