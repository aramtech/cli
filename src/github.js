import ora from 'ora'
import path from 'path'
import fs from 'fs'
import { exec } from './exec.js'
import { execSync } from 'child_process'

import Logger from './logger.js'
import axios from 'axios'
import { read_answer_to } from './prompt.js'

const repo_name_to_api_link = (repo_name) => `https://api.github.com/repos/${repo_name}`

const repo_name_to_cli_link = (repo_name) => `https://github.com/${repo_name}`

async function git_cli_client(repo_name, branch, new_project_path) {
    const full_new_project_path = path.resolve(new_project_path)
    execSync(`git clone -b ${branch} ${repo_name_to_cli_link(repo_name)} ${new_project_path}`, {
        stdio: 'inherit',
    })
    execSync(`rm -rf ${full_new_project_path}/.git `)
    return
}

async function downloadRepo(repo_name, branch, github_personal_access_token, new_project_path) {
    const loadingSpinner = ora()
    loadingSpinner.start()

    loadingSpinner.text = `Downloading: 0.00%`

    const request_body = {
        method: 'GET',
        url: `${repo_name_to_api_link(repo_name)}/tarball/${branch}`,
        headers: {
            Authorization: `Bearer ${github_personal_access_token}`,
            'X-GitHub-Api-Version': '2022-11-28',
        },
        responseType: 'stream',
    }
    try {
        const { data, headers } = await axios(request_body)

        return new Promise((resolve, reject) => {
            const new_project_full_path = path.resolve(new_project_path)
            const tar_full_path = path.resolve(path.join('./', 'empty_template.tar.gz'))
            const writer = fs.createWriteStream(tar_full_path)
            const content_length = headers['Content-Length']
            let downloaded_length = 0

            data.on('data', (chunk) => {
                if (content_length) {
                    downloaded_length += chunk.length || 0
                    loadingSpinner.text = `Downloading: ${((downloaded_length / content_length) * 100).toFixed(2)}\%`
                } else {
                    downloaded_length += chunk.length || 0
                    loadingSpinner.text = `Downloading: ${(downloaded_length / 1000).toFixed(2)}kb`
                }
            })

            data.pipe(writer)

            let error = null

            writer.on('error', (err) => {
                error = err
                writer.close()
                Logger.error(error.message)

                reject(false)
            })

            writer.on('close', () => {
                if (!error) {
                    loadingSpinner.stop()
                    execSync(`tar -xf ${tar_full_path} -C ${new_project_full_path}`, {
                        stdio: 'inherit',
                    })

                    execSync(`rm -rf ${tar_full_path}`, {
                        stdio: 'inherit',
                    })

                    const extraction_path = path.join(
                        new_project_full_path,
                        Buffer.from(
                            execSync(`ls`, {
                                cwd: new_project_full_path,
                            }),
                        )
                            .toString('utf-8')
                            .trim(),
                    )
                    execSync(`mv ${extraction_path}/* ./.`, {
                        cwd: new_project_full_path,
                    })

                    execSync(`mv ${path.join(extraction_path, '/.vscode')} .`, {
                        cwd: new_project_full_path,
                    })

                    execSync(`rm -rf ${extraction_path}`, {
                        cwd: new_project_full_path,
                    })
                    resolve(true)
                }
            })
        })
    } catch (error) {
        console.log('status', error?.response?.status, 'Message', error?.message, 'name', error?.name)
        Logger.error('Error: Something went wrong')
        process.exit(1)
    }
}

async function github_api_client(repo_name, branch, new_project_path) {
    try {
        execSync('tar --version')
    } catch (error) {
        Logger.error('please install "tar" extraction command line')
    }

    let github_personal_access_token = ''

    const loadingSpinner = ora()

    let try_count = 0

    while (true) {
        try_count += 1
        if (try_count >= 3) {
            Logger.error('Maximum try count exceeded')
            process.exit(1)
        }

        github_personal_access_token = await read_answer_to(
            'Please provide your classic personal github access token (you can create one at https://github.com/settings/tokens)\n\n Token:',
        )

        loadingSpinner.text = 'Verifying Token...'
        loadingSpinner.start()

        try {
            await axios({
                method: 'GET',
                url: repo_name_to_api_link(repo_name),
                headers: {
                    Authorization: `Bearer ${github_personal_access_token}`,
                    'X-GitHub-Api-Version': '2022-11-28',
                },
            })
            loadingSpinner.stop()

            break
        } catch (error) {
            Logger.error('\nInvalid Github Access Token, Please Make sure that the token is valid.\n')
            loadingSpinner.stop()
            continue
        }
    }

    await downloadRepo(repo_name, branch, github_personal_access_token, new_project_path)
}

const get_repo_downloader = (opts) => {
    try {
        if (opts.tar) {
            throw ''
        }
        exec('git --version')
        exec(`git ls-remote ${repo_name_to_cli_link(opts.repository_name)}`)
        return git_cli_client
    } catch (_) {
        return github_api_client
    }
}

export const download_repo_to = async (repo_name, branch, to, use_tar = false) => {
    const download = get_repo_downloader({ tar: use_tar, repository_name: repo_name })
    await download(repo_name, branch, to)

    Logger.success(
        '\nFinished!\n' +
            'Go to https://handbook.aramtech.ly/#/rest/introduction to learn how you can properly use the framework.\n' +
            'run `npm init` to modify package.json of the project to your liking.',
    )
}
