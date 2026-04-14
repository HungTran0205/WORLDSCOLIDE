---
name: tm:jira-search
metadata: version: 1.00
description: Search Jira issues, Confluence pages, and codebase documentation. Use this when asked to find documentation, research a topic, search Jira issues, search Confluence pages, or gather context about a feature or component. This skill searches across Jira, Confluence, and codebase to produce a consolidated markdown report.
---

# Documentation Search Skill

## Purpose
This skill enables comprehensive documentation search across multiple sources to gather context and produce a consolidated research report.

## When to Use
- User asks to find documentation about a topic (e.g., "find documentation about Selfcare")
- User asks to research a Jira issue (e.g., "find docs related to HTM-31231")
- User needs context before starting implementation
- User wants to understand existing documentation coverage

## Tools Required
- `atlassian/atlassian-mcp-server/fetch` - For fetching Jira issues and Confluence pages
- `atlassian/atlassian-mcp-server/search` - For searching Jira and Confluence
- `atlassian/atlassian-mcp-server/getJiraissue` - For retrieving specific Jira issue details
- `search` - For searching the codebase

## Configuration
- **Atlassian URL:** https://hansentechnologies.atlassian.net

## Step-by-Step Process

### 1. Parse the Request
- Identify the search topic or Jira issue key from the user's request
- Determine if this is a topic-based search or a Jira-issue-based search

### 2. Search Jira (if applicable)
If a Jira issue key is provided (e.g., `HTM-31231`):
1. Use `atlassian/atlassian-mcp-server/getJiraIssue` to retrieve the full issue details
2. Extract key information: summary, description, acceptance criteria, linked issues, comments
3. Use issue summary, key, and Details/Account as search keywords for next steps

If a topic is provided:
1. Use `atlassian/atlassian-mcp-server/search` to find related Jira issues
2. Filter results by project if specified
3. Note relevant issue keys for cross-referencing

### 3. Search Confluence
1. Use `atlassian/atlassian-mcp-server/search` with JQL/CQL to find related pages
2. Search for pages containing the topic keywords, can use Account retreived from Jira as query for e.g (CHSOW-119)
3. For Jira-based searches, look for pages linked to or mentioning the issue
4. Retrieve page content for the most relevant results (top 3-5 pages)

### 4. Search Codebase
1. Use `search` tool to find related code, documentation files (`.md`, `README`, etc.)
2. Search for references in:
   - `docs/` directory
   - `README.md` files
   - Inline code comments
   - `.nova/` specification files
   - `specs/` feature documentation
3. Note file paths and relevant code snippets

### 5. Compile Research Report
Produce a markdown report with the following structure:

```markdown
# Documentation Research Report: {Topic/Issue}

## Summary
Brief overview of what was found.

## Jira Issues
| Issue Key | Summary | Status |
|-----------|---------|--------|
| HTM-12345 | ... | Open |

## Confluence Pages
- [Page Title](link) - Brief description
- [Another Page](link) - Brief description

## Codebase References
- `path/to/file.md` - Description of relevant content
- `path/to/code.ts` (lines 10-25) - Related implementation

## Key Findings
- Finding 1
- Finding 2

## Recommendations
- Next steps or areas for further investigation
```

## Quality Standards
- Always provide source links/paths for all findings
- Summarize content rather than copying large blocks
- Highlight connections between different sources
- Note any gaps or missing documentation
- Include timestamps if relevant (e.g., last updated date for Confluence pages)

## Example Usage

### Topic-based Search
User: "Find documentation about Selfcare"
1. Search Confluence for pages containing "Selfcare"
2. Search codebase for Selfcare-related files
3. Search Jira for Selfcare-related issues
4. Compile and present report

### Jira Issue-based Search
User: "Find documentation related to HTM-31231"
1. Fetch HTM-31231 from Jira
2. Extract keywords from issue summary/description
3. Search Confluence for related pages
4. Search codebase for related files
5. Compile and present report
