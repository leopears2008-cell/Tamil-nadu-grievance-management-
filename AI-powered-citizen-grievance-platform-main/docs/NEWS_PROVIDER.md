# Production News Provider

The current Tamil Nadu live-news feature uses a server-side Google News RSS adapter. The browser does not fetch the RSS feed directly, which avoids exposing a feed request to client-side CORS behavior and keeps query limits/caching on the server.

For production/commercial use, review the current Google News feed terms and the terms of every linked publisher. Google News RSS is an aggregation feed, not a license to republish article content. The UI should keep headlines, publisher attribution and links to the original publisher rather than copying full article text.

The backend is intentionally isolated behind `/api/news/tamil-nadu` so a licensed news provider can replace the adapter without changing the UI. Do not claim a news provider is licensed unless the operator has an actual contract/approved account.
