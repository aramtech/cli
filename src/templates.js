import fs_extra from 'fs-extra'
import { fileURLToPath } from 'url'
import path from 'path'

const { copySync } = fs_extra

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const plugin_template_path = path.join(__dirname, '../templates/fastify-plugin')

export const generate_plugin_in = (path) => {
    copySync(plugin_template_path, path)
}
