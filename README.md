# SharedPearls - English Learning Platform

An educational platform with courses, progress tracking, quizzes, forums, and certificates.

## Website
Visit: [www.sharedpearls.com](https://www.sharedpearls.com)

## Membership setup
The US$10/month Supabase and Stripe integration runs on Cloudflare Pages Functions
or Workers. See [MEMBERSHIP_SETUP.md](MEMBERSHIP_SETUP.md) before deployment.
Run `npm ci`, `npm test`, and `npm run build`. Plain GitHub Pages cannot execute
the payment endpoints or protect the premium assets.

## Features
- Grammar lessons
- Vocabulary courses
- Listening & pronunciation modules
- LinguaSkill exam preparation
- Interactive quizzes

## Structure
- `Index.html` - Home page
- Individual HTML files for each course/lesson
