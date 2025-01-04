# Auth Flow

1.  User clicks the login button
    - redirect to the login page with the client_id on the query string
    - user clicks authorize
2.  User is redirected to a url that contains the access token and refresh token in the query string
    - Url triggers a lambda to store the user in the database
    - redirected to the account landing page
    - user is now logged in

# User table

| id                  | username       | email | githubId |
| ------------------- | -------------- | ----- | -------- |
| a unique identifier | a display name | email |
