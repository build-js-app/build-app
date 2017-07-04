import * as fs from 'fs-extra';
import * as path from 'path';
import * as downloadGitRepo from 'download-git-repo';

import utils from './utils';

export default {
    downloadGitRepository
};

async function downloadGitRepository(origin, repository, branch, directory) {
    fs.emptyDirSync(directory);

    await download(origin, repository, branch, directory);

    let gitFolderPath = path.join(directory, '.git');
    utils.removeDir(gitFolderPath);
}

function download(origin, repository, branch, directory) {
    return new Promise((resolve, reject) => {
        let repoPath = origin ? `${origin}:` : '';
        repoPath += `${repository}#${branch}`;
        downloadGitRepo(repoPath, directory, (err) => {
            if (err) return reject(err);

            return resolve();
        });
    });
}