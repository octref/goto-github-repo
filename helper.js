// A list of repos that shouldn't be recorded, such as
// github.com/blog, github.com/explore, etc
var inValidOwners = [
  'blog',
  'explore',
  'showcases',
  'trending',
  'stars',
  'contact',
  'about'
]

// Build a hashmap of accessed repos
function buildRepoMap(cb) {
  chrome.history.search({
    text: 'github',
    startTime: 0,
    maxResults: 1000000
  }, function(hits) {
      var repoMap = {};
      var parser = document.createElement('a');

      _.forEach(hits, function(hit) {
        parser.href = hit.url;
        if (parser.hostname == 'github.com') {
          var paths = parser.pathname.split('/');
          if (paths.length >= 3) {
            var owner = paths[1],
                repoName = paths[2],
                fullName = owner + '/' + repoName;

            if (!repoMap[fullName] && !_.contains(inValidOwners, owner)) {
              repoMap[fullName] = {
                url: 'https://github.com/' + fullName,
                owner: owner,
                repoName: repoName
              }
            }
          }
        }
      });

      cb(repoMap);
  });
}

// After building repoMap, set it in local storage
function buildAndSetRepoMap() {
  buildRepoMap(function(repoMap) {
    chrome.storage.local.set({ repoMap: repoMap }, function() {
      console.log('RepoMap built successfully');
    });
  });
}

// If new URL is a repo not yet recorded, add it to repoMap
function processNewURL(url) {
  var parser = document.createElement('a');
  parser.href = url;

  if (parser.hostname == 'github.com') {
    var paths = parser.pathname.split('/');
    if (paths.length >= 3) {
      var owner = paths[1],
          repoName = paths[2],
          fullName = owner + '/' + repoName;

      chrome.storage.local.get('repoMap', function(storageObj) {
        var repoMap = storageObj.repoMap;
        if (!repoMap[fullName] && !_.contains(inValidOwners, owner)) {
          repoMap[fullName] = {
            url: 'https://github.com/' + fullName,
            owner: owner,
            repoName: repoName
          }

          console.log('Adding ' + fullName + ' to repoMap');

          chrome.storage.local.set({ repoMap: repoMap }, function() {
            console.log('RepoMap updated successfully');
          });
        }
      });
    }
  }
}
