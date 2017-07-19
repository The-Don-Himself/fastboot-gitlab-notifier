'use strict';

const request   = require('request');

function AppNotFoundError(message) {
  let error = new Error(message);
  error.name = 'AppNotFoundError';

  return error;
}

/*
 * Notifier class that notifies Fastboot App Server of a new Ember build artifact from GitLab to download.
 */
class GitLabNotifier {
  constructor(options) {
    this.ui = options.ui;

    this.url = options.url || 'https://gitlab.com';
    this.token = options.token;
    this.repo = options.repo;
    this.branch = options.branch || 'master';
    this.job = options.job || 'build';
    this.pollTime = options.poll || 60 * 1000;

    let repo = this.repo;
    let branch = this.branch;
    let job = this.job;

    this.fileUrl = 'https://gitlab.com/' + repo + '/builds/artifacts/'+ branch + '/download?job=' + job;
  }

  subscribe(notify) {
    let addon = this;

    addon.notify = notify;

    return addon.fetchCurrentBuild()
      .then((buildID) => {
        addon.fastbootBuildID = buildID;
        addon.schedulePoll();
      });
  }

  fetchCurrentBuild() {
    let addon = this;

    let fileUrl = addon.fileUrl;
    let token = addon.token;

    let options = {
        method: 'HEAD',
        uri: fileUrl,
        headers: {
            'PRIVATE-TOKEN': token
        }
    };

    addon.ui.writeLine('domain     : ' + addon.url);
    addon.ui.writeLine('repository : ' + addon.repo);
    addon.ui.writeLine('branch     : ' + addon.branch);
    addon.ui.writeLine('job        : ' + addon.job);

    return new Promise((res, rej) => {
        request(options)
        .on('response', function(response) {
            let filename,
                contentDisp = response.headers['content-disposition'];
            if (contentDisp && /^attachment/i.test(contentDisp)) {
                filename = contentDisp.toLowerCase()
                    .split('filename=')[1]
                    .split(';')[0]
                    .replace(/"/g, '');
            }

            if(!filename){
                addon.ui.writeError('Did Not Find Zip File, Notifications Aborted.');
                rej(new AppNotFoundError());
            } else {
                addon.ui.writeLine('Found Zip File : ' + filename);

                let realDownloadUrl = response.request.uri.href;
                let jobID = realDownloadUrl.substring(realDownloadUrl.lastIndexOf("/jobs/") + 6 , realDownloadUrl.lastIndexOf("/artifacts/"));
                addon.ui.writeLine('Pipeline Build ID : ' + jobID);

                res(jobID);
            }
        })
        .on('error', function(error) {
            console.log('error:', error); // Print the error if one occurred
            addon.ui.writeError('could not fetch repo build artifact');
            rej(new AppNotFoundError());
        });
    });
  }

  schedulePoll() {
    let addon = this;

    addon.ui.writeLine("Polling With In Intervals Of : " + addon.pollTime / 1000 + " seconds");
    setTimeout(() => {
      addon.poll();
    }, addon.pollTime);
  }

  poll() {
    let addon = this;

    addon.fetchCurrentBuild()
      .then((buildID) => {
        addon.compareBuilds(buildID);
        addon.schedulePoll();
      })
      .catch(() => {
        addon.ui.writeError("An Error Occurred While Polling!");
      });
  }

  compareBuilds(gitlabBuildID) {
    let addon = this;

    if (gitlabBuildID !== this.fastbootBuildID) {
      addon.ui.writeLine("New Build Found");
      addon.fastbootBuildID = gitlabBuildID;
      addon.notify();
    }
  }
}


module.exports = GitLabNotifier;
