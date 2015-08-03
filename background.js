var defaultSuggestionURL = '';

chrome.runtime.onStartup.addListener(buildAndSetRepoMap);
chrome.runtime.onInstalled.addListener(buildAndSetRepoMap);

chrome.omnibox.onInputChanged.addListener(function(input, suggest) {
  input = input.trim();

  chrome.storage.local.get('repoMap', function(storageObj) {
    // Go through repoMap, find suggestions based on keyword
    var repoMap = storageObj.repoMap;
    var suggestions = [];

    _.forEach(repoMap, function(repo, fullName) {
      var suggestion = {
          content: repo.url,
          description: fullName
      };
      // See if we have multiple or just a single keyword
      if (input.split(' ').length == 1 && input != '') {
        var keyword = input;

        // Put exact match in the front of suggestions
        if (repo.repoName == keyword) {
          suggestions.unshift(suggestion);
        } else if (_.contains(fullName, keyword)) {
          suggestions.push(suggestion);
        }
      }
      // Multiple keywords
      else {
        var keywords = input.split(' ');
        var inFullName = function(keyword) {
          return _.contains(fullName, keyword);
        };

        if (_.all(keywords, inFullName)) {
          suggestions.push(suggestion);
        }
      }
    });

    // Use the first suggestion as default
    if (suggestions.length > 0) {
      var defaultSuggestionDescription = '<match>' + suggestions[0].description + '</match>';
      defaultSuggestionURL = suggestions[0].content;

      chrome.omnibox.setDefaultSuggestion({
        description: defaultSuggestionDescription
      });
    }

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
