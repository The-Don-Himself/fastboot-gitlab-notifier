## FastBoot GitLab Notifier

This notifier for the [FastBoot App Server][app-server] works with GitLab Builds to poll for new successful builds for a specified ref / branch.

[app-server]: https://github.com/ember-fastboot/fastboot-app-server

To use the notifier, configure it with your GitLab API token and your repo:

```js
const FastBootAppServer = require('fastboot-app-server');
const GitLabNotifier    = require('fastboot-gitlab-notifier');

let notifier = new GitLabNotifier({
  url:      'https://gitlab.com',           // Gitlab host e.g self hosted, defaults to https://gitlab.com
  token:    '1_A23CtFvGnsgdqwLPYZ',         // your Gitlab private token
  repo:     'my-app/ember.js',              // name of your repo
  branch:   'master',                       // optional, defaults to 'master'
  job:      'build',                        // optional, defaults to 'build'
  poll:     60 * 1000                       // optional polling interval, defaults to 60 * 1000 i.e every minute
});

let server = new FastBootAppServer({
  notifier: notifier
});
```

When the notifier starts, it will poll the API for the specified repository and branch. Once a new successful build is found, it will tell the FastBoot App Server to fetch the latest version of the app.

If you like this, you may also be interested in the companion [fastboot-gitlab-downloader](https://github.com/campus-discounts/fastboot-gitlab-downloader), which downloads the most recent build artifact for the specified ref.
