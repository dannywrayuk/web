type Response = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};
type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "ANY";
type Mock = Partial<Record<Method, Response>>;
type Mocks = Record<string, Mock>;

const applicationJson = { ContentType: "application/json" };

export const fallback: Response = {
  statusCode: 404,
  headers: applicationJson,
  body: JSON.stringify({ message: "Mock not found." }),
};

export const mocks: Mocks = {
  hello_world: {
    ANY: {
      statusCode: 200,
      headers: applicationJson,
      body: JSON.stringify({ message: "Hello, World!" }),
    },
  },
  "github.com/login/oauth/access_token": {
    POST: {
      statusCode: 200,
      headers: applicationJson,
      body: JSON.stringify({
        access_token: "mock_access_token",
        scope: "read:user,user:email",
        token_type: "bearer",
      }),
    },
  },
  "api.github.com/user": {
    GET: {
      statusCode: 200,
      headers: applicationJson,
      body: JSON.stringify({
        login: "octocat",
        id: 0,
        node_id: "MDQ6VXNlcjE=",
        avatar_url: "https://avatars.githubusercontent.com/u/0?v=4",
        gravatar_id: "",
        url: "https://api.github.com/users/octocat",
        html_url: "https://github.com/octocat",
        followers_url: "https://api.github.com/users/octocat/followers",
        following_url:
          "https://api.github.com/users/octocat/following{/other_user}",
        gists_url: "https://api.github.com/users/octocat/gists{/gist_id}",
        starred_url:
          "https://api.github.com/users/octocat/starred{/owner}{/repo}",
        subscriptions_url: "https://api.github.com/users/octocat/subscriptions",
        organizations_url: "https://api.github.com/users/octocat/orgs",
        repos_url: "https://api.github.com/users/octocat/repos",
        events_url: "https://api.github.com/users/octocat/events{/privacy}",
        received_events_url:
          "https://api.github.com/users/octocat/received_events",
        type: "User",
        site_admin: false,
        name: "monalisa octocat",
        company: "GitHub",
        blog: "https://github.com/blog",
        location: "San Francisco",
        email: "octocat@github.com",
        hireable: false,
        bio: "There once was...",
        twitter_username: "monatheoctocat",
        public_repos: 2,
        public_gists: 1,
        followers: 20,
        following: 0,
        created_at: "2008-01-14T04:33:35Z",
        updated_at: "2008-01-14T04:33:35Z",
        private_gists: 81,
        total_private_repos: 100,
        owned_private_repos: 100,
        disk_usage: 10000,
        collaborators: 8,
        two_factor_authentication: true,
        plan: {
          name: "Medium",
          space: 400,
          private_repos: 20,
          collaborators: 0,
        },
      }),
    },
  },
  "api.github.com/user/emails": {
    GET: {
      statusCode: 200,
      headers: applicationJson,
      body: JSON.stringify([
        {
          email: "octocat@github.com",
          verified: true,
          primary: true,
          visibility: "public",
        },
      ]),
    },
  },
};
