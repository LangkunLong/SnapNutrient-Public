This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Install all the dependencies through [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) or [pnpm](https://pnpm.io/)

```bash
#dependencies conflict issue when using npm, please try yarn install
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```
## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
```

## Testing on mobile phone
First install ngrok to forward your port to outer network:
```bash
npm install -g ngrok
```

Start your app by running:
```bash
npm run dev
```

In a new terminal, start ngrok:
```bash
ngrok http 3000
```

ngrok will give you a link something like this:
```bash
https://d1ee-xx-xxx-xxx-xxx.ngrok-free.app 
```

Update your .env.local file:
```bash
NEXTAUTH_URL = https://d1ee-xx-xxx-xxx-xxx.ngrok-free.app 
```

Setup google oauth and add the link you created using ngrok. 
note: rememeber to change google client id and google secret if you're connecting to your own google oauth api

Example of what your google oauth should look like:
```bash
Authorized JavaScript origins
For use with requests from a browser
URIs 1 
http://localhost:3000
URIs 2 
https://25b5-69-166-116-174.ngrok-free.app

Authorized redirect URIs
For use with requests from a web server
URIs 1 
https://d1ee-69-166-116-174.ngrok-free.app
URIs 2 
http://localhost:3000
URIs 3 
http://localhost:3000/api/auth/callback/google
URIs 4 
https://25b5-69-166-116-174.ngrok-free.app/api/auth/callback/google
```

Now go to chrome and add the app to your homescreen, you're all set



