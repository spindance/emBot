import * as AWS from 'aws-sdk'
import * as Crypto from 'crypto'

export class LexBot {
    private lexRuntime: AWS.LexRuntime
    constructor(readonly name: string, readonly alias: string) {
        this.lexRuntime = new AWS.LexRuntime({ region: 'us-east-1' })
    }

    public async postText(inputText: string, userId: string): Promise<Output> {
        let params = this.buildParams(inputText, userId)

        // this needs to handle `Invalid Bot Status: Bot emBot has status BUILDING` better
        return new Promise((resolve, reject) => {
            this.lexRuntime.postText(params, function (err: AWS.AWSError, data: AWS.LexRuntime.PostTextResponse) {
                return (err)
                    ? reject(err)
                    : resolve(data as Output)
            })
        })
    }

    private buildParams(inputText: string, userId: string): Input {
        /*
            AWS says userId should be something unique but not personally identifiable.
            Eventually, we may want to create and persist a user-specific UUID for this,
            but for now, just hash the user's name.
        */
        const hash = Crypto.createHash('sha256')
        hash.update(userId)

        return {
            botAlias: this.alias,
            botName: this.name,
            userId: hash.digest('hex'),
            inputText
        }
    }
}

export interface Output {
    dialogState?: string,
    intentName?: string | null,
    message?: string | null,
    slots?: {
        [key: string]: string
    }
}

interface Input {
    botAlias: string,
    botName: string,
    userId: string,
    inputText: string
}