import * as Base64 from 'base-64'
import * as HTTP from 'http'
import { json } from 'micro'
import fetch, * as Fetch from 'node-fetch'
import * as Env from 'require-env'

const JIRA_BASE_URL = Env.require('JIRA_BASE_URL')
const JIRA_USERNAME = Env.require('JIRA_USERNAME')
const JIRA_PASSWORD = Env.require('JIRA_PASSWORD')

interface ExpectedInput {
    userEmail: string,
    channel: string,
    lexOutput: {
        slots: {
            project: string,
            summary: string
        }
    }
}

interface JiraIssue {
    key: string
}

interface JiraUser {
    name: string
}

module.exports = async (req: HTTP.IncomingMessage, res: HTTP.ServerResponse) => {
    let input = await json(req) as ExpectedInput


    let user = await jiraUserRequest(input.userEmail)
    let issue = await jiraIssueRequest(input, user)

    res.end('Here is the issue I created: ```' +
        `${JIRA_BASE_URL}/browse/${issue.key}` +
        '```')
    return
}

async function jiraUserRequest(email: string): Promise<JiraUser> {
    const rq = buildJiraUserRequest(email)
    const rs = await fetch(rq)

    return handleJiraUserResponse(rs)
}

function buildJiraUserRequest(email: string): Fetch.Request {
    return new Fetch.Request(`${JIRA_BASE_URL}/rest/api/2/user/search?username=${email}`, {
        method: 'GET',
        headers: defaultJiraHeaders()
    })
}

async function handleJiraUserResponse(rs: Fetch.Response): Promise<JiraUser> {
    const users = await rs.json() as Array<JiraUser>

    if (users.length === 0) {
        return { name: JIRA_USERNAME }
    }

    return users[0]
}

async function jiraIssueRequest(input: ExpectedInput, user: JiraUser): Promise<JiraIssue> {
    const rq = buildJiraIssueRequest(input, user)
    const rs = await fetch(rq)

    return handleJiraIssueRequest(rs)
}

function buildJiraIssueRequest(input: ExpectedInput, user: JiraUser): Fetch.Request {
    let dueDate = calculateDueDate()
    let body = {
        fields: {
            project: {
                name: input.lexOutput.slots.project
            },
            summary: input.lexOutput.slots.summary,
            description: `"${input.lexOutput.slots.summary}"\n\nIssue created by EmBot`,
            reporter: user.name,
            assignee: {
                name: 'brucej'
            },
            issueType: {
                name: 'Task'
            },
            priority: {
                name: 'Low'
            },
            timetracking: {
                originalEstimate: '1h',
                remainingEstimate: '1h'
            },
            duedate: dueDate,
            customfield_11600: { // SpinDance Project
                id: '11300' // SD-InternalRequest
            },
            customfield_11500: { // Customer
                value: 'SpinDance'
            }
        }
    }

    return new Fetch.Request(`${JIRA_BASE_URL}/rest/api/2/issue`, {
        method: 'POST',
        headers: defaultJiraHeaders(),
        body: JSON.stringify(body)
    })
}

async function handleJiraIssueRequest(rs: Fetch.Response): Promise<JiraIssue> {
    const issue = await rs.json() as JiraIssue
    return issue
}

function defaultJiraHeaders(): { [index: string]: string } {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Base64.encode(JIRA_USERNAME + ":" + JIRA_PASSWORD)}`
    }
}

function calculateDueDate(): string {
    var d = new Date()
    var dayOfMonth = d.getDate()
    d.setDate(dayOfMonth + 7)

    return d.toISOString()
}