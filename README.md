# SnapNutrient 🍽️

SnapNutrient is an AI-powered nutrition tracking app that helps users analyze their meals, receive personalized dietary suggestions, and engage with a health-conscious community through a built-in social platform.

> Built with React, AWS (DynamoDB & S3), and OpenAI GPT-4o, SnapNutrient offers seamless image-based nutrient analysis and a rich user dashboard experience.

---

## 🔍 Features

### 📷 1. Image Analysis

SnapNutrient uses few-shot prompting and state-of-the-art large language models (LLMs) to analyze user-submitted food images. Upon uploading a photo, the app generates a targeted prompt with embedded examples to guide the model in identifying food items and their macronutrient breakdown (calories, carbohydrates, proteins, fats). The result is a fast, detailed nutritional analysis with minimal user effort.

![Image Analysis Screenshot](./../snapnutrient/ReadMe/Image%20Analysis.png)
---

### 📊 2. User Dashboard & Dietary Suggestions

The SnapNutrient dashboard gives users immediate access to:

- **Daily & weekly nutritional summaries**
- **Macronutrient and micronutrient breakdowns**
- **Filterable meal entries (breakfast, lunch, dinner, snacks)**
- **Real-time updates on edits or new entries**
- **Dynamic dietary suggestions powered by GPT-4o**

Meal data is fetched from AWS DynamoDB (`SnapNutrient_mealEntries`), with associated images stored in S3. The dashboard ensures low-latency access through optimized batch queries and provides a smooth, responsive UI built with React.

![Image Analysis Screenshot](./../snapnutrient/ReadMe/Image%20Analysis.png)

---

### 🧑‍🤝‍🧑 3. Social Platform

Inspired by platforms like Instagram, the social feed allows users to:

- Share meal photos with captions
- Like and comment on posts
- Scroll through posts in a paginated, optimized feed

Posts are stored in DynamoDB (`SnapNutrient_posts`) with images referenced via S3 keys. The frontend uses lazy loading and batched S3 requests to minimize latency and improve performance.

> Posting flow: Upload/take photo → Add caption → Preview → Share → Instant post display.

The goal of the social platform is to build a motivating, supportive user community — users land here first to inspire healthy habits through peer engagement.

![Image Analysis Screenshot](./../snapnutrient/ReadMe/Social%20Workflow%201.png)
![Image Analysis Screenshot](./../snapnutrient/ReadMe/Social%20Workflow%202.png)

---

## 🛠️ Tech Stack

- **Frontend:** React (Web & Mobile Responsive UI)
- **Backend:** AWS DynamoDB, AWS S3
- **AI Integration:** OpenAI GPT-4o for dietary recommendations
- **DevOps:** Vercel (for frontend deployment)

---

## 🧠 Contributors

- Y. Huang 
- S. Ji
- L. Long
- D. Wang

---

## 🚨 License

This repository is for demonstration and educational purposes. Please do not copy or reuse code without permission.

> To restrict commercial use while allowing visibility, consider using the **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)** license, or **view-only** repo with a notice discouraging code reuse.

---

## 📸 Demo Screenshots (Optional)

You can optionally include screenshots or a screen recording of:
- Image analysis results
- Dashboard summaries
- Social feed post interactions

---

## 📬 Contact

Have questions or feedback? Feel free to reach out via GitHub Issues or email.


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



