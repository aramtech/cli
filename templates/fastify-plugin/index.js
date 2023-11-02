import fp from 'fastify-plugin'

async function plugin(app, _opts = {}) {
    console.log('Hello world!')
}

export default fp(plugin)
