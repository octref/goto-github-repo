var defaultSuggestionURL = '';

chrome.runtime.onStartup.addListener(buildAndSetRepoMap);
chrome.runtime.onInstalled.addListener(buildAndSetRepoMap);

chrome.omnibox.onInputChanged.addListener(function(input, suggest) {
  input = input.trim().toLowerCase();

  chrome.storage.local.get('repoMap', function(storageObj) {
    // Go through repoMap, find suggestions based on keyword
    var repoMap = storageObj.repoMap;
    var suggestions = [];

    // See if we have multiple or just a single keyword
    // Single keyword
    if (input.split(' ').length == 1 && input != '') {
      var keyword = input.trim().toLowerCase();

      _.each(repoMap, function(repo, fullName) {
        var suggestion = {
          content: repo.url,
          description: fullName
        };

        // Put exact match in the front of suggestions
        if (repo.repoName.toLowerCase() == keyword) {
          suggestions.unshift(suggestion);
        } else if (_.contains(fullName.toLowerCase(), keyword)) {
          suggestions.push(suggestion);
        }
      });
    }
    // Multiple keywords
    else {
      var keywords = input.trim().toLowerCase().split(' ');

      _.each(repoMap, function(repo, fullName) {
        var suggestion = {
          content: repo.url,
          description: fullName
        };

        var inFullName = function(keyword) {
          return _.contains(fullName.toLowerCase(), keyword);
        };

        if (_.all(keywords, inFullName)) {
          suggestions.push(suggestion);
        }
      });
    }

    // Use the first suggestion as default
    var defaultSuggestionDescription;
    if (suggestions.length > 0) {
      defaultSuggestionDescription = '<match>' + suggestions[0].description + '</match>';
      defaultSuggestionURL = suggestions[0].content;

    } else {
      defaultSuggestionDescription = '<match>No match found. Search github with "' +
                                     input + '"</match>';
      defaultSuggestionURL = 'https://github.com/search?q=' + input.replace(' ', '+');
    }

    chrome.omnibox.setDefaultSuggestion({
      description: defaultSuggestionDescription
    });

    suggest(_.rest(suggestions));
  });
});

chrome.omnibox.onInputEntered.addListener(function(input) {
  var url; 

  // If input is a valid Github URL, the user has selected something else than the default option
  if (_.startsWith(input, 'https://github.com/')) {
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
