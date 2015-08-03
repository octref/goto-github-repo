var defaultSuggestionURL = '';

chrome.runtime.onStartup.addListener(buildAndSetRepoMap);
chrome.runtime.onInstalled.addListener(buildAndSetRepoMap);

chrome.omnibox.onInputChanged.addListener(function(keyword, suggest) {
  chrome.storage.local.get('repoMap', function(storageObj) {
    // Go through repoMap, find suggestions based on keyword
    var repoMap = storageObj.repoMap;
    var suggestions = [];

    _.forEach(repoMap, function(repo, fullName) {
      var suggestion = {
          content: repo.url,
          description: fullName
      };
      // Put exact match in the front of suggestions
      if (repo.repoName == keyword) {
        suggestions.unshift(suggestion);
      } else if (_.contains(fullName, keyword)) {
        suggestions.push(suggestion);
      }
    });

    // Use the first suggestion as default
    var defaultSuggestionDescription = '<match>' + suggestions[0].description + '</match>';
    defaultSuggestionURL = suggestions[0].content;

    chrome.omnibox.setDefaultSuggestion({
      description: defaultSuggestionDescription
    });
    suggest(_.rest(suggestions));
  });
});

chrome.omnibox.onInputEntered.addListener(function(input) {
  var url;

  if (_.contains(input, '/')) {
    url = input;
  } else {
    url = defaultSuggestionURL;
  }

  chrome.tabs.query({ highlighted: true }, function(tab) {
    chrome.tabs.update(tab.id, { url: url });
  });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo) {
  if (changeInfo.url) {
    processNewURL(changeInfo.url);
  }
});
