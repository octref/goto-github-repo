var defaultSuggestionURL = '';

chrome.runtime.onStartup.addListener(function() {
  buildRepoMap(function(repoMap) {
    chrome.storage.local.set({ repoMap: repoMap }, function() {
      console.log('RepoMap updated successfully');
    });
  });
});

chrome.runtime.onInstalled.addListener(function() {
  buildRepoMap(function(repoMap) {
    chrome.storage.local.set({ repoMap: repoMap }, function() {
      console.log('RepoMap updated successfully');
    });
  });
});

chrome.omnibox.onInputChanged.addListener(function(keyword, suggest) {
  chrome.storage.local.get('repoMap', function(storageObj) {
    var repoMap = storageObj.repoMap;
    var suggestions = [];

    _.forEach(repoMap, function(repo, fullName) {
      var suggestion = {
          content: repo.url,
          description: fullName
      };
      if (repo.repoName == keyword) {
        suggestions.unshift(suggestion);
      } else if (_.contains(fullName, keyword)) {
        suggestions.push(suggestion);
      }
    });

    // Use the first suggestion as default
    var defaultSuggestion = {
      description: '<match>' + suggestions[0].description + '</match>'
    };
    defaultSuggestionURL = suggestions[0].content;

    chrome.omnibox.setDefaultSuggestion(defaultSuggestion);
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
