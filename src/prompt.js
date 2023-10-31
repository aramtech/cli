import enq from 'enquirer'

export const read_answer_to = async (question) => {
    const { input } = await enq.prompt({
        type: 'input',
        name: 'input',
        message: question,
    })

    return input
}

export const read_choice = async (question, choices) => {
    const { input } = await enq.prompt({
        type: 'select',
        name: 'input',
        choices,
        message: question,
    })

    return input
}
